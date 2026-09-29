/**
 * tests/auth.test.js
 *
 * Coverage: registration, login, cookies, deactivated user, role guard,
 * mustChangePassword lockout, change-password, login rate limit, object injection.
 */
const request = require('supertest');
const {
  setupTestDB, clearDB, teardownTestDB,
  registerPatient, loginAs, createAdmin, createDoctor, createSpecialization,
  app,
} = require('./helpers');

const User = require('../src/models/User');
const argon2 = require('argon2');

beforeAll(setupTestDB);
afterEach(clearDB);
afterAll(teardownTestDB);

// ── Registration ──────────────────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  it('registers a new patient and returns 201 with user data', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Alice Smith',
      email: 'alice@test.com',
      password: 'AliceSecure1234!',
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('patient');
    expect(res.body.data.user.email).toBe('alice@test.com');
    // passwordHash must NEVER appear in any response
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash/);
    expect(JSON.stringify(res.body)).not.toMatch(/\$argon2/);
  });

  it('returns 409 for duplicate email', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Bob', email: 'bob@test.com', password: 'BobPassword12!',
    });
    const res = await request(app).post('/api/auth/register').send({
      name: 'Bob2', email: 'bob@test.com', password: 'BobPassword12!',
    });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('returns 400 when email field is an injected object', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Hacker',
      email: { $gt: '' },  // NoSQL injection attempt
      password: 'HackerPass1234!',
    });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

// ── Login ─────────────────────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  it('returns 200 and sets httpOnly cookie on valid credentials', async () => {
    const { credentials } = await registerPatient({
      email: 'logintest@test.com', password: 'LoginTest1234!',
    });
    const res = await request(app).post('/api/auth/login').send(credentials);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('logintest@test.com');

    // Cookie flags
    const cookieHeader = res.headers['set-cookie']?.[0] || '';
    expect(cookieHeader).toMatch(/token=/);
    expect(cookieHeader).toMatch(/HttpOnly/i);
    expect(cookieHeader).toMatch(/SameSite=Strict/i);
    // passwordHash must never appear in response body
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash/);
  });

  it('returns 401 on wrong password', async () => {
    await registerPatient({ email: 'wrongpw@test.com', password: 'RealPass1234!' });
    const res = await request(app).post('/api/auth/login').send({
      email: 'wrongpw@test.com', password: 'WrongPassword!!',
    });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('returns 401 for unknown email (constant-time)', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'nobody@test.com', password: 'SomePassword12!',
    });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('returns 403 for a deactivated user', async () => {
    const { credentials } = await registerPatient({
      email: 'deactivated@test.com', password: 'Deact1234Pass!',
    });
    // Deactivate the user directly in DB
    await User.findOneAndUpdate({ email: 'deactivated@test.com' }, { isActive: false });
    const res = await request(app).post('/api/auth/login').send(credentials);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('returns 400 when password field is an injected object', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'attacker@test.com',
      password: { $gt: '' }, // NoSQL injection attempt
    });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

// ── Unauthenticated Access ────────────────────────────────────────────────────

describe('Unauthenticated route access', () => {
  it('returns 401 when no cookie is present on a protected route', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });

  it('returns 401 with an invalid JWT cookie', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', ['token=this.is.not.a.valid.jwt']);
    expect(res.status).toBe(401);
  });
});

// ── Role Guard ────────────────────────────────────────────────────────────────

describe('Role-based access control', () => {
  it('returns 403 when a patient accesses an admin-only route', async () => {
    const { cookie } = await registerPatient({ email: 'patient_rbac@test.com', password: 'Patient1234!' });
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Cookie', [cookie]);
    expect(res.status).toBe(403);
  });

  it('returns 403 when a doctor accesses an admin-only route', async () => {
    const spec = await createSpecialization();
    const { cookie } = await createDoctor(spec._id, { email: 'doctor_rbac@test.com', password: 'Doctor1234!' });
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Cookie', [cookie]);
    expect(res.status).toBe(403);
  });
});

// ── mustChangePassword Lockout ────────────────────────────────────────────────

describe('mustChangePassword lockout', () => {
  it('blocks access to non-auth routes when mustChangePassword is true', async () => {
    // Create a user with mustChangePassword=true directly
    const passwordHash = await argon2.hash('TempPass1234!');
    await User.create({
      name: 'Temp Doctor',
      email: 'mustchange@test.com',
      passwordHash,
      role: 'doctor',
      mustChangePassword: true,
      isActive: true,
    });
    const { cookie } = await loginAs('mustchange@test.com', 'TempPass1234!');

    // Accessing /api/appointments should be blocked
    const blocked = await request(app)
      .get('/api/appointments')
      .set('Cookie', [cookie]);
    expect(blocked.status).toBe(403);
    expect(blocked.body.error.code).toBe('MUST_CHANGE_PASSWORD');

    // /api/auth/me should still work
    const me = await request(app).get('/api/auth/me').set('Cookie', [cookie]);
    expect(me.status).toBe(200);
  });

  it('clears mustChangePassword and grants full access after change-password', async () => {
    const passwordHash = await argon2.hash('OldPass1234!');
    await User.create({
      name: 'Change Me',
      email: 'changeme@test.com',
      passwordHash,
      role: 'patient',
      mustChangePassword: true,
      isActive: true,
    });
    const { cookie } = await loginAs('changeme@test.com', 'OldPass1234!');

    const changeRes = await request(app)
      .post('/api/auth/change-password')
      .set('Cookie', [cookie])
      .send({ currentPassword: 'OldPass1234!', newPassword: 'NewSecure5678!' });
    expect(changeRes.status).toBe(200);

    // Should be able to access appointments now
    const { cookie: newCookie } = await loginAs('changeme@test.com', 'NewSecure5678!');
    const appt = await request(app)
      .get('/api/appointments')
      .set('Cookie', [newCookie]);
    expect(appt.status).toBe(200);
  });

  it('change-password returns 401 for wrong current password', async () => {
    const { cookie } = await registerPatient({ email: 'changepw@test.com', password: 'Current1234!' });
    const res = await request(app)
      .post('/api/auth/change-password')
      .set('Cookie', [cookie])
      .send({ currentPassword: 'WrongPass1234!', newPassword: 'NewPass5678!' });
    expect(res.status).toBe(401);
  });

  it('change-password returns 400 if new password is too short', async () => {
    const { cookie } = await registerPatient({ email: 'shortpw@test.com', password: 'Current1234!' });
    const res = await request(app)
      .post('/api/auth/change-password')
      .set('Cookie', [cookie])
      .send({ currentPassword: 'Current1234!', newPassword: 'short' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

// ── Login Rate Limit ──────────────────────────────────────────────────────────

describe('Login rate limit', () => {
  it('returns 429 after 10 failed attempts for the same email', async () => {
    const email = `ratelimit_${Date.now()}@test.com`;
    // Register user so attempts hit the password-check path (slower, but needed)
    await registerPatient({ email, password: 'RateLimit1234!' });

    // Fire 10 failed logins
    for (let i = 0; i < 10; i++) {
      await request(app).post('/api/auth/login').send({ email, password: 'WrongPass!!' });
    }

    // 11th attempt should be rate limited
    const res = await request(app).post('/api/auth/login').send({ email, password: 'WrongPass!!' });
    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('RATE_LIMITED');
  }, 60000); // 60s timeout — argon2 × 11 attempts
});
