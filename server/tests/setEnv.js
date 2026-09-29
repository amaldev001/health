/**
 * tests/setEnv.js
 *
 * This file runs as a Jest setupFile — before any test module or app module is loaded.
 * Setting process.env here ensures that config/env.js validates successfully when
 * the app is first required, and that no real secrets are needed.
 *
 * IMPORTANT: MONGODB_URI is set to a placeholder.  Each test file's beforeAll()
 * overwrites it with the real mongodb-memory-server URI before connecting Mongoose.
 */

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/healthcare_test'; // overridden per-test
process.env.JWT_SECRET = 'test-jwt-secret-minimum-32-characters-here!!';
process.env.FRONTEND_ORIGIN = 'http://localhost:3000';
process.env.CLINIC_TIMEZONE = 'Asia/Kolkata';
process.env.CLINIC_NAME = 'Test Clinic';
process.env.CLINIC_PHONE = '+1-555-0000';
process.env.CLINIC_ADDRESS = '1 Test Street';
process.env.CLINIC_HOURS = 'Mon-Fri 09:00-17:00';
process.env.EMERGENCY_NUMBER = '+1-555-9911';
process.env.CURRENCY = 'USD';
process.env.ADMIN_EMAIL = 'admin@test.com';
process.env.ADMIN_PASSWORD = 'AdminPassword1234!';
process.env.ADMIN_NAME = 'Test Admin';
process.env.PORT = '5001';
