/**
 * tests/helpers.js
 *
 * Shared test DB lifecycle utilities.
 *
 * SAFETY RULE: This module refuses to connect if the resolved database name
 * does not end with "_test".  This prevents accidental data destruction in any
 * development or production MongoDB instance.
 */
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../src/app');

let mongod = null;

/**
 * Start an in-memory MongoDB server whose DB name ends in "_test", connect Mongoose.
 * Call in beforeAll().
 */
async function setupTestDB() {
  mongod = await MongoMemoryServer.create({
    instance: { dbName: 'healthcare_test' },
  });

  let uri = mongod.getUri();
  if (!uri.split('?')[0].endsWith('/healthcare_test')) {
    uri = uri.replace(/\/?(\?.*)?$/, '/healthcare_test$1');
  }

  // ── SAFETY CHECK ──────────────────────────────────────────────────────────
  // Extract DB name from URI.
  const dbName = uri.split('/').pop().split('?')[0];
  if (!dbName.endsWith('_test')) {
    await mongod.stop();
    throw new Error(
      `SAFETY ABORT: Test suite refuses to connect to database "${dbName}". ` +
        `The database name MUST end with "_test". Check MongoMemoryServer configuration.`
    );
  }
  // ──────────────────────────────────────────────────────────────────────────

  // Disconnect from any previous connection (e.g. placeholder URI from setEnv.js)
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  await mongoose.connect(uri);
}

/**
 * Drop all collections, keeping the DB and indexes intact.
 * Call in beforeEach() or afterEach() to isolate tests.
 */
async function clearDB() {
  const collections = mongoose.connection.collections;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
}

/**
 * Disconnect Mongoose and stop the in-memory server.
 * Call in afterAll().
 */
async function teardownTestDB() {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
    mongod = null;
  }
}

// ── Convenience Auth Helpers ──────────────────────────────────────────────────

/**
 * Register a patient and return their auth cookie string.
 */
async function registerPatient(overrides = {}) {
  const defaults = {
    name: 'Test Patient',
    email: `patient_${Date.now()}@test.com`,
    password: 'PatientPass1234!',
  };
  const data = { ...defaults, ...overrides };
  const res = await request(app).post('/api/auth/register').send(data);
  if (res.status !== 201) throw new Error(`registerPatient failed: ${JSON.stringify(res.body)}`);
  const cookie = res.headers['set-cookie']?.[0] || '';
  return { cookie, user: res.body.data.user, credentials: data };
}

/**
 * Log in and return the auth cookie string.
 */
async function loginAs(email, password) {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  if (res.status !== 200) throw new Error(`loginAs failed for ${email}: ${JSON.stringify(res.body)}`);
  const cookie = res.headers['set-cookie']?.[0] || '';
  return { cookie, user: res.body.data.user };
}

/**
 * Create a specialization via the DB directly (bypasses admin-auth requirement).
 */
async function createSpecialization(name = 'General Practice') {
  const Specialization = require('../src/models/Specialization');
  const existing = await Specialization.findOne({ name });
  if (existing) return existing;
  return Specialization.create({ name, description: `${name} department` });
}

/**
 * Create a doctor user + profile directly via DB (avoids admin-auth requirement in tests).
 * Returns { doctorUser, doctorProfile, cookie }.
 */
async function createDoctor(specId, overrides = {}) {
  const User = require('../src/models/User');
  const Doctor = require('../src/models/Doctor');
  const argon2 = require('argon2');

  const email = overrides.email || `doctor_${Date.now()}@test.com`;
  const password = overrides.password || 'DoctorPass1234!';
  const passwordHash = await argon2.hash(password);

  const user = await User.create({
    name: overrides.name || 'Test Doctor',
    email,
    passwordHash,
    role: 'doctor',
    mustChangePassword: false,
    isActive: true,
  });

  const availability = overrides.availability || [
    { dayOfWeek: 0, startTime: '09:00', endTime: '17:00' },
    { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
    { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
    { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' },
    { dayOfWeek: 4, startTime: '09:00', endTime: '17:00' },
    { dayOfWeek: 5, startTime: '09:00', endTime: '17:00' },
    { dayOfWeek: 6, startTime: '09:00', endTime: '17:00' },
  ];

  const profile = await Doctor.create({
    userId: user._id,
    specializationId: specId,
    qualification: 'MBBS MD',
    experience: 5,
    consultationFee: 100,
    phone: '+1-555-1234',
    bio: 'Test doctor bio',
    availability,
    isActive: true,
  });

  const { cookie } = await loginAs(email, password);
  return { doctorUser: user, doctorProfile: profile, cookie, credentials: { email, password } };
}

/**
 * Create an admin user directly via DB.
 */
async function createAdmin(overrides = {}) {
  const User = require('../src/models/User');
  const argon2 = require('argon2');

  const email = overrides.email || `admin_${Date.now()}@test.com`;
  const password = overrides.password || 'AdminPass1234!';
  const passwordHash = await argon2.hash(password);

  const user = await User.create({
    name: overrides.name || 'Test Admin',
    email,
    passwordHash,
    role: 'admin',
    mustChangePassword: false,
    isActive: true,
  });

  const { cookie } = await loginAs(email, password);
  return { adminUser: user, cookie, credentials: { email, password } };
}

/**
 * Get a future date string YYYY-MM-DD in Asia/Kolkata timezone, +daysAhead from today.
 */
function getFutureDateStr(daysAhead = 1) {
  const now = new Date();
  now.setDate(now.getDate() + daysAhead);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/**
 * Get today's date string YYYY-MM-DD in Asia/Kolkata timezone.
 */
function getTodayStr() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

module.exports = {
  setupTestDB,
  clearDB,
  teardownTestDB,
  registerPatient,
  loginAs,
  createSpecialization,
  createDoctor,
  createAdmin,
  getFutureDateStr,
  getTodayStr,
  app,
};
