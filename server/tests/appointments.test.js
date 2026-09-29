/**
 * tests/appointments.test.js
 *
 * Coverage: valid booking; outside availability; past date; >60 days; client endTime
 * ignored; occupied slot → 409; 10 concurrent same-slot → exactly 1 success + 9×409;
 * patient cancels another patient's appointment → 403; patient confirms → 403;
 * 24h cutoff; every invalid transition; doctor acts on wrong doctor → 403;
 * completing before start time rejected.
 */
const request = require('supertest');
const mongoose = require('mongoose');
const {
  setupTestDB, clearDB, teardownTestDB,
  registerPatient, createDoctor, createSpecialization, createAdmin,
  getFutureDateStr, getTodayStr,
  app,
} = require('./helpers');

const Appointment = require('../src/models/Appointment');
const Patient = require('../src/models/Patient');

beforeAll(setupTestDB);
afterEach(clearDB);
afterAll(teardownTestDB);

// ── Shared fixtures ───────────────────────────────────────────────────────────
let spec, docResult, patResult, pat2Result, adminResult;

beforeEach(async () => {
  spec = await createSpecialization('Cardiology');
  docResult = await createDoctor(spec._id, { email: `doc_${Date.now()}@test.com` });
  patResult = await registerPatient({ email: `pat_${Date.now()}@test.com`, password: 'PatPass1234!' });
  pat2Result = await registerPatient({ email: `pat2_${Date.now()}@test.com`, password: 'Pat2Pass1234!' });
  adminResult = await createAdmin({ email: `admin_${Date.now()}@test.com` });
});

// Helper — book an appointment for patResult against docResult
async function bookAppt(overrides = {}) {
  const date = overrides.appointmentDate || getFutureDateStr(1);
  return request(app)
    .post('/api/appointments')
    .set('Cookie', [patResult.cookie])
    .send({
      doctorId: docResult.doctorProfile._id.toString(),
      appointmentDate: date,
      startTime: overrides.startTime || '10:00',
      reason: overrides.reason || 'Routine check-up',
      endTime: overrides.endTime,   // intentionally passable to test it's ignored
    });
}

// ── Valid Booking ─────────────────────────────────────────────────────────────

describe('Valid booking', () => {
  it('creates appointment with status=scheduled and computed endTime', async () => {
    const res = await bookAppt({ startTime: '09:00' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('scheduled');
    // endTime must be server-computed (+30 min), not whatever client sent
    expect(res.body.data.endTime).toBe('09:30');
  });

  it('ignores client-supplied endTime and always computes it', async () => {
    const res = await bookAppt({ startTime: '09:00', endTime: '12:00' }); // client sends wrong endTime
    expect(res.status).toBe(201);
    expect(res.body.data.endTime).toBe('09:30'); // must be 09:30, not 12:00
  });
});

// ── Validation Guards ─────────────────────────────────────────────────────────

describe('Booking validation guards', () => {
  it('rejects a past date', async () => {
    const res = await bookAppt({ appointmentDate: '2020-01-01', startTime: '10:00' });
    expect(res.status).toBe(400);
  });

  it('rejects a date more than 60 days in the future', async () => {
    const res = await bookAppt({ appointmentDate: getFutureDateStr(61) });
    expect([400, 409]).toContain(res.status); // 400 for date validation
    expect(res.status).toBe(400);
  });

  it('rejects a slot outside doctor availability', async () => {
    // Doctor has availability 09:00-17:00; try 03:00 which is not a valid slot
    const res = await bookAppt({ startTime: '03:00' });
    expect(res.status).toBe(409);
  });

  it('rejects booking when patient role is required (doctor cannot book)', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .set('Cookie', [docResult.cookie])
      .send({
        doctorId: docResult.doctorProfile._id.toString(),
        appointmentDate: getFutureDateStr(1),
        startTime: '10:00',
        reason: 'Doctor tries to self-book',
      });
    expect(res.status).toBe(403);
  });
});

// ── Double-booking Prevention ─────────────────────────────────────────────────

describe('Double-booking prevention', () => {
  it('returns 409 on duplicate slot booking', async () => {
    // First booking succeeds
    const first = await bookAppt({ startTime: '11:00' });
    expect(first.status).toBe(201);

    // Second booking for same slot returns 409
    const second = await bookAppt({ startTime: '11:00' });
    expect(second.status).toBe(409);
    expect(second.body.error.code).toBe('CONFLICT');
  });

  it('10 concurrent requests for the same slot yield exactly 1 success and 9 conflicts', async () => {
    const appointmentDate = getFutureDateStr(2);
    const startTime = '14:00';

    const promises = Array.from({ length: 10 }, () =>
      request(app)
        .post('/api/appointments')
        .set('Cookie', [patResult.cookie])
        .send({
          doctorId: docResult.doctorProfile._id.toString(),
          appointmentDate,
          startTime,
          reason: 'Concurrent test',
        })
    );

    const results = await Promise.all(promises);
    const successes = results.filter((r) => r.status === 201);
    const conflicts = results.filter((r) => r.status === 409);

    expect(successes).toHaveLength(1);
    expect(conflicts).toHaveLength(9);
  });
});

// ── Ownership Guards ──────────────────────────────────────────────────────────

describe('Appointment ownership guards', () => {
  it('patient cancelling another patient\'s appointment returns 403', async () => {
    // pat1 books an appointment
    const booking = await bookAppt({ startTime: '09:00' });
    expect(booking.status).toBe(201);
    const apptId = booking.body.data._id;

    // pat2 tries to cancel pat1's appointment
    const res = await request(app)
      .patch(`/api/appointments/${apptId}/status`)
      .set('Cookie', [pat2Result.cookie])
      .send({ status: 'cancelled' });

    expect(res.status).toBe(403);
  });

  it('patient confirming an appointment returns 403', async () => {
    const booking = await bookAppt({ startTime: '09:00' });
    const apptId = booking.body.data._id;

    const res = await request(app)
      .patch(`/api/appointments/${apptId}/status`)
      .set('Cookie', [patResult.cookie])
      .send({ status: 'confirmed' });

    expect(res.status).toBe(403);
  });

  it('doctor acting on another doctor\'s appointment returns 403', async () => {
    const doc2 = await createDoctor(spec._id, { email: `doc2_${Date.now()}@test.com` });
    const booking = await bookAppt({ startTime: '09:00' });
    const apptId = booking.body.data._id;

    // doc2 tries to confirm doc1's appointment
    const res = await request(app)
      .patch(`/api/appointments/${apptId}/status`)
      .set('Cookie', [doc2.cookie])
      .send({ status: 'confirmed' });

    expect(res.status).toBe(403);
  });
});

// ── 24h Cancellation Cutoff (D3) ─────────────────────────────────────────────

describe('24h patient cancellation cutoff', () => {
  it('prevents patient from cancelling an appointment on the same calendar day', async () => {
    // Book for tomorrow first, then override appointmentDate to today in DB
    const booking = await bookAppt({ startTime: '09:00' });
    expect(booking.status).toBe(201);
    const apptId = booking.body.data._id;

    // Force appointmentDate to today (within 24h)
    const todayStr = getTodayStr();
    await Appointment.findByIdAndUpdate(apptId, { appointmentDate: todayStr });

    const res = await request(app)
      .patch(`/api/appointments/${apptId}/status`)
      .set('Cookie', [patResult.cookie])
      .send({ status: 'cancelled' });

    expect(res.status).toBe(403);
  });
});

// ── Invalid State Transitions ─────────────────────────────────────────────────

describe('Invalid state transitions', () => {
  async function getApptId(startTime = '09:00') {
    const booking = await bookAppt({ startTime });
    expect(booking.status).toBe(201);
    return booking.body.data._id;
  }

  it('cannot cancel a completed appointment', async () => {
    const apptId = await getApptId('10:00');
    // Force status to completed
    await Appointment.findByIdAndUpdate(apptId, { status: 'completed' });
    const res = await request(app)
      .patch(`/api/appointments/${apptId}/status`)
      .set('Cookie', [adminResult.cookie])
      .send({ status: 'cancelled' });
    expect(res.status).toBe(409);
  });

  it('cannot complete an already-cancelled appointment', async () => {
    const apptId = await getApptId('10:00');
    await Appointment.findByIdAndUpdate(apptId, { status: 'cancelled' });
    const res = await request(app)
      .patch(`/api/appointments/${apptId}/status`)
      .set('Cookie', [adminResult.cookie])
      .send({ status: 'completed' });
    expect(res.status).toBe(409);
  });

  it('cannot confirm a confirmed appointment', async () => {
    const apptId = await getApptId('10:00');
    await Appointment.findByIdAndUpdate(apptId, { status: 'confirmed' });
    // Trying to transition confirmed → confirmed is invalid
    const res = await request(app)
      .patch(`/api/appointments/${apptId}/status`)
      .set('Cookie', [adminResult.cookie])
      .send({ status: 'confirmed' });
    expect(res.status).toBe(409);
  });

  it('cannot go from scheduled directly to completed', async () => {
    const apptId = await getApptId('10:00');
    // Force date to past so time-check passes, but status transition is invalid
    await Appointment.findByIdAndUpdate(apptId, { appointmentDate: '2023-01-01' });
    const res = await request(app)
      .patch(`/api/appointments/${apptId}/status`)
      .set('Cookie', [adminResult.cookie])
      .send({ status: 'completed' });
    // scheduled→completed is NOT in state machine, must return 409
    expect(res.status).toBe(409);
  });
});

// ── Completing Before Start Time ──────────────────────────────────────────────

describe('Completing before appointment start time', () => {
  it('rejects marking a future appointment as completed', async () => {
    const apptId = await (async () => {
      const booking = await bookAppt({ startTime: '09:00', appointmentDate: getFutureDateStr(1) });
      expect(booking.status).toBe(201);
      // Advance to confirmed (required for completed transition)
      await Appointment.findByIdAndUpdate(booking.body.data._id, { status: 'confirmed' });
      return booking.body.data._id;
    })();

    const res = await request(app)
      .patch(`/api/appointments/${apptId}/status`)
      .set('Cookie', [adminResult.cookie])
      .send({ status: 'completed' });

    // Must fail because the appointment is in the future
    expect(res.status).toBe(400);
  });
});
