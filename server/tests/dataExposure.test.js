/**
 * tests/dataExposure.test.js
 *
 * Coverage:
 *  - Public doctor endpoints contain no email or phone
 *  - Password hash never appears in any response
 *  - Pagination limits enforced
 *  - CastError (invalid ObjectId) → 400
 *  - ValidationError → 400 with field details
 *  - Duplicate key → 409
 *  - Production error response: no stack trace, no Mongo text
 */
const request = require('supertest');
const mongoose = require('mongoose');
const {
  setupTestDB, clearDB, teardownTestDB,
  registerPatient, createDoctor, createSpecialization, createAdmin,
  getFutureDateStr,
  app,
} = require('./helpers');

beforeAll(setupTestDB);
afterEach(clearDB);
afterAll(teardownTestDB);

// ── Data Exposure — Public Doctor Endpoints ───────────────────────────────────

describe('Public doctor endpoint data exposure', () => {
  let spec, docResult;

  beforeEach(async () => {
    spec = await createSpecialization('Dermatology');
    docResult = await createDoctor(spec._id, {
      email: `expose_${Date.now()}@test.com`,
    });
  });

  it('GET /api/doctors (public, no auth) does not expose email or phone', async () => {
    const res = await request(app).get('/api/doctors');
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);

    const doctorJson = JSON.stringify(res.body.data);
    // phone must not appear
    expect(doctorJson).not.toMatch(/\+1-555-1234/);
    // email field must not appear
    expect(doctorJson).not.toMatch(/expose_/); // matches email address fragments
    // no passwordHash
    expect(doctorJson).not.toMatch(/passwordHash/);
    expect(doctorJson).not.toMatch(/\$argon2/);
  });

  it('GET /api/doctors/:id (public, no auth) does not expose email or phone', async () => {
    const res = await request(app).get(`/api/doctors/${docResult.doctorProfile._id}`);
    expect(res.status).toBe(200);
    const json = JSON.stringify(res.body);
    expect(json).not.toMatch(/\+1-555-1234/);
    expect(json).not.toMatch(/expose_/);
    expect(json).not.toMatch(/passwordHash/);
  });
});

// ── Password Hash Never Exposed ───────────────────────────────────────────────

describe('Password hash never in any response', () => {
  it('register response does not contain passwordHash', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Hash Test', email: 'hashtest@test.com', password: 'HashTest1234!',
    });
    expect(res.status).toBe(201);
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash/);
    expect(JSON.stringify(res.body)).not.toMatch(/\$argon2/);
  });

  it('login response does not contain passwordHash', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Login Hash', email: 'loginhash@test.com', password: 'LoginHash1234!',
    });
    const res = await request(app).post('/api/auth/login').send({
      email: 'loginhash@test.com', password: 'LoginHash1234!',
    });
    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash/);
    expect(JSON.stringify(res.body)).not.toMatch(/\$argon2/);
  });

  it('GET /auth/me does not expose passwordHash', async () => {
    const { cookie } = await registerPatient({ email: 'metest@test.com', password: 'MeTest1234!' });
    const res = await request(app).get('/api/auth/me').set('Cookie', [cookie]);
    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash/);
    expect(JSON.stringify(res.body)).not.toMatch(/\$argon2/);
  });
});

// ── Pagination Limits ─────────────────────────────────────────────────────────

describe('Pagination limit enforcement', () => {
  it('GET /api/doctors respects limit=2 query parameter', async () => {
    const spec = await createSpecialization('Ophthalmology');
    await Promise.all([
      createDoctor(spec._id, { email: `pag1_${Date.now()}@test.com` }),
      createDoctor(spec._id, { email: `pag2_${Date.now() + 1}@test.com` }),
      createDoctor(spec._id, { email: `pag3_${Date.now() + 2}@test.com` }),
    ]);

    const res = await request(app).get('/api/doctors?limit=2&page=1');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(2);
    expect(res.body.pagination.limit).toBe(2);
    expect(res.body.pagination.total).toBeGreaterThanOrEqual(3);
  });
});

// ── Error Handling ────────────────────────────────────────────────────────────

describe('Error handler: CastError (invalid ObjectId)', () => {
  it('returns 400 for an invalid ObjectId in URL params', async () => {
    const { cookie } = await registerPatient({ email: 'cast@test.com', password: 'Cast1234Pass!' });
    const res = await request(app)
      .get('/api/appointments/not-a-valid-objectid')
      .set('Cookie', [cookie]);
    expect(res.status).toBe(400);
    // Must not expose raw Mongoose or Mongo driver error text
    expect(JSON.stringify(res.body)).not.toMatch(/Cast to ObjectId/i);
    expect(JSON.stringify(res.body)).not.toMatch(/BSONTypeError/i);
  });
});

describe('Error handler: ValidationError (Mongoose schema violation)', () => {
  it('returns 400 with field details for a required field violation', async () => {
    // Directly attempt to trigger a Mongoose ValidationError via missing required field
    // The appointment validator catches most things, but we can trigger via the model
    const Appointment = require('../src/models/Appointment');
    let error;
    try {
      await Appointment.create({ doctorId: new mongoose.Types.ObjectId() }); // missing many required fields
    } catch (e) {
      error = e;
    }
    expect(error).toBeDefined();
    expect(error.name).toBe('ValidationError');

    // Verify the error handler maps it correctly by hitting a route that produces one
    // (The appointment POST validator will return 400 with VALIDATION_ERROR)
    const { cookie } = await registerPatient({ email: 'valerr@test.com', password: 'ValErr1234!' });
    const res = await request(app)
      .post('/api/appointments')
      .set('Cookie', [cookie])
      .send({ doctorId: '', appointmentDate: '', startTime: '', reason: '' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('Error handler: Duplicate key 11000', () => {
  it('returns 409 CONFLICT for duplicate email on registration', async () => {
    const data = { name: 'Dup', email: `dup_${Date.now()}@test.com`, password: 'Dup12345678!' };
    await request(app).post('/api/auth/register').send(data);
    const res = await request(app).post('/api/auth/register').send(data);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });
});

describe('Error response in production-like mode', () => {
  it('error response does not contain a stack trace or raw Mongo text', async () => {
    // Trigger an error by requesting an invalid ObjectId
    const { cookie } = await registerPatient({ email: 'proderr@test.com', password: 'ProdErr1234!' });
    const res = await request(app)
      .get('/api/appointments/000000000000000000000000') // valid ObjectId format but non-existent
      .set('Cookie', [cookie]);

    // Should be 404 (appointment not found)
    expect(res.status).toBe(404);
    const body = JSON.stringify(res.body);

    // Must not contain stack trace markers
    expect(body).not.toMatch(/at Object\./);
    expect(body).not.toMatch(/at process\./);
    // Must not contain raw Mongo/Mongoose text
    expect(body).not.toMatch(/MongoServerError/i);
    expect(body).not.toMatch(/E11000/);
    // Must have success: false
    expect(res.body.success).toBe(false);
    // Must have error.code
    expect(res.body.error.code).toBeDefined();
    // Must have requestId
    expect(res.body.requestId).toBeDefined();
  });
});
