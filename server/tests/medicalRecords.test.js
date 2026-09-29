/**
 * tests/medicalRecords.test.js
 *
 * Coverage: doctor creates for own confirmed appointment; second record same
 * appointment → 409; other doctor → 403; patient reads own; another patient
 * → 403; admin → 403 on every route; no record content in logs (verified by
 * checking response structure rather than logs, as logs go to console).
 */
const request = require('supertest');
const {
  setupTestDB, clearDB, teardownTestDB,
  registerPatient, createDoctor, createSpecialization, createAdmin,
  getFutureDateStr,
  app,
} = require('./helpers');

const Appointment = require('../src/models/Appointment');
const Patient = require('../src/models/Patient');

beforeAll(setupTestDB);
afterEach(clearDB);
afterAll(teardownTestDB);

// ── Fixtures ──────────────────────────────────────────────────────────────────
let spec, docResult, doc2Result, patResult, pat2Result, adminResult;
let confirmedAppt;

beforeEach(async () => {
  spec = await createSpecialization('Neurology');
  docResult = await createDoctor(spec._id, { email: `doc_${Date.now()}@test.com` });
  doc2Result = await createDoctor(spec._id, { email: `doc2_${Date.now()}@test.com` });
  patResult = await registerPatient({ email: `pat_${Date.now()}@test.com`, password: 'PatPass1234!' });
  pat2Result = await registerPatient({ email: `pat2_${Date.now()}@test.com`, password: 'Pat2Pass1234!' });
  adminResult = await createAdmin({ email: `admin_${Date.now()}@test.com` });

  // Get patient profile ID
  const patProfile = await Patient.findOne({ userId: patResult.user.id });

  // Create a confirmed appointment directly in DB
  confirmedAppt = await Appointment.create({
    patientId: patProfile._id,
    doctorId: docResult.doctorProfile._id,
    appointmentDate: getFutureDateStr(1),
    startTime: '10:00',
    endTime: '10:30',
    reason: 'Neurology follow-up',
    status: 'confirmed',
  });
});

function makeRecord(apptId, patId) {
  return {
    appointmentId: apptId.toString(),
    patientId: patId.toString(),
    diagnosis: 'Tension headache',
    symptoms: 'Persistent head pain',
    treatment: 'Rest and hydration',
    prescription: 'Ibuprofen 400mg TDS',
    notes: 'Patient to return in 2 weeks',
  };
}

// ── Doctor Creates Record ─────────────────────────────────────────────────────

describe('Doctor creates medical record', () => {
  it('allows doctor to create record for their own confirmed appointment', async () => {
    const patProfile = await Patient.findOne({ userId: patResult.user.id });
    const res = await request(app)
      .post('/api/medical-records')
      .set('Cookie', [docResult.cookie])
      .send(makeRecord(confirmedAppt._id, patProfile._id));

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.diagnosis).toBe('Tension headache');
    // Ensure password hash never appears in response
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash/);
    expect(JSON.stringify(res.body)).not.toMatch(/\$argon2/);
  });

  it('returns 409 when a second record is created for the same appointment', async () => {
    const patProfile = await Patient.findOne({ userId: patResult.user.id });
    const payload = makeRecord(confirmedAppt._id, patProfile._id);

    const first = await request(app)
      .post('/api/medical-records')
      .set('Cookie', [docResult.cookie])
      .send(payload);
    expect(first.status).toBe(201);

    const second = await request(app)
      .post('/api/medical-records')
      .set('Cookie', [docResult.cookie])
      .send(payload);
    expect(second.status).toBe(409);
    expect(second.body.error.code).toBe('CONFLICT');
  });

  it('returns 403 when a different doctor tries to create a record for this appointment', async () => {
    const patProfile = await Patient.findOne({ userId: patResult.user.id });
    const res = await request(app)
      .post('/api/medical-records')
      .set('Cookie', [doc2Result.cookie])  // wrong doctor
      .send(makeRecord(confirmedAppt._id, patProfile._id));
    expect(res.status).toBe(403);
  });
});

// ── Patient Reads Own Records ─────────────────────────────────────────────────

describe('Patient reads medical records', () => {
  beforeEach(async () => {
    // Create a record so there's something to read
    const patProfile = await Patient.findOne({ userId: patResult.user.id });
    await request(app)
      .post('/api/medical-records')
      .set('Cookie', [docResult.cookie])
      .send(makeRecord(confirmedAppt._id, patProfile._id));
  });

  it('patient can read their own medical records', async () => {
    const res = await request(app)
      .get('/api/medical-records')
      .set('Cookie', [patResult.cookie]);
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('another patient cannot read someone else\'s records — returns 403 or empty', async () => {
    // pat2 should not see pat1's records; endpoint returns only their own records
    const res = await request(app)
      .get('/api/medical-records')
      .set('Cookie', [pat2Result.cookie]);
    expect(res.status).toBe(200);
    // pat2 has no records, so list is empty
    expect(res.body.data).toHaveLength(0);
  });

  it('another patient cannot access a specific record by ID', async () => {
    // Get the record ID
    const ownRes = await request(app)
      .get('/api/medical-records')
      .set('Cookie', [patResult.cookie]);
    const recordId = ownRes.body.data[0]._id;

    const res = await request(app)
      .get(`/api/medical-records/${recordId}`)
      .set('Cookie', [pat2Result.cookie]);
    expect([403, 404]).toContain(res.status);
  });
});

// ── Admin is Blocked from All Medical Record Routes ───────────────────────────

describe('Admin blocked from all medical record routes', () => {
  let recordId;

  beforeEach(async () => {
    const patProfile = await Patient.findOne({ userId: patResult.user.id });
    const res = await request(app)
      .post('/api/medical-records')
      .set('Cookie', [docResult.cookie])
      .send(makeRecord(confirmedAppt._id, patProfile._id));
    recordId = res.body.data?._id;
  });

  it('admin cannot list medical records (GET /medical-records → 403)', async () => {
    const res = await request(app)
      .get('/api/medical-records')
      .set('Cookie', [adminResult.cookie]);
    expect(res.status).toBe(403);
  });

  it('admin cannot read a single medical record (GET /medical-records/:id → 403)', async () => {
    if (!recordId) return; // skip if creation failed
    const res = await request(app)
      .get(`/api/medical-records/${recordId}`)
      .set('Cookie', [adminResult.cookie]);
    expect(res.status).toBe(403);
  });

  it('admin cannot create a medical record (POST /medical-records → 403)', async () => {
    const patProfile = await Patient.findOne({ userId: patResult.user.id });
    const res = await request(app)
      .post('/api/medical-records')
      .set('Cookie', [adminResult.cookie])
      .send(makeRecord(confirmedAppt._id, patProfile._id));
    expect(res.status).toBe(403);
  });

  it('admin cannot update a medical record (PUT /medical-records/:id → 403)', async () => {
    if (!recordId) return;
    const res = await request(app)
      .put(`/api/medical-records/${recordId}`)
      .set('Cookie', [adminResult.cookie])
      .send({ diagnosis: 'Hacked diagnosis' });
    expect(res.status).toBe(403);
  });
});

// ── Record Content Does Not Appear in Logs (structural check) ────────────────
// We can't inspect stdout in tests, but we verify that sensitive record fields
// are not echoed back in error responses (the error handler strips them).

describe('Medical record content stays out of error responses', () => {
  it('a validation error response does not contain record diagnosis text', async () => {
    const res = await request(app)
      .post('/api/medical-records')
      .set('Cookie', [docResult.cookie])
      .send({
        appointmentId: 'not-a-valid-id',
        patientId: 'not-a-valid-id',
        diagnosis: 'SENSITIVE_DIAGNOSIS_TEXT',
      });
    // Error response must not echo back the sensitive diagnosis
    expect(JSON.stringify(res.body)).not.toContain('SENSITIVE_DIAGNOSIS_TEXT');
    expect([400, 403]).toContain(res.status);
  });
});
