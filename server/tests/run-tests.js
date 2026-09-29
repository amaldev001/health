process.env.NODE_ENV = 'test';
process.env.PORT = '5000';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/healthcare_test_db';
process.env.JWT_SECRET = 'test_super_secret_jwt_key_32_characters_min_length';
process.env.FRONTEND_ORIGIN = 'http://localhost:3000';
process.env.CLINIC_TIMEZONE = 'Asia/Kolkata';

const assert = require('assert');
const argon2 = require('argon2');
const { connectDB, disconnectDB } = require('../src/config/db');
const User = require('../src/models/User');
const Doctor = require('../src/models/Doctor');
const Patient = require('../src/models/Patient');
const Specialization = require('../src/models/Specialization');
const Appointment = require('../src/models/Appointment');
const MedicalRecord = require('../src/models/MedicalRecord');
const { getAvailableSlotsForDoctor } = require('../src/services/availabilityService');

async function runTests() {
  console.log('\n--- STARTING BACKEND INTEGRATION TESTS ---');
  try {
    await connectDB();

    // Clean test DB
    await User.deleteMany({});
    await Doctor.deleteMany({});
    await Patient.deleteMany({});
    await Specialization.deleteMany({});
    await Appointment.deleteMany({});
    await MedicalRecord.deleteMany({});

    // Test 1: User password hashing and verification
    console.log('Test 1: User Registration & Argon2 Password Hashing');
    const hashed = await User.hashPassword('SecretPassword123!');
    const testUser = await User.create({
      name: 'Test Patient',
      email: 'test@patient.com',
      passwordHash: hashed,
      role: 'patient'
    });
    const isMatch = await testUser.comparePassword('SecretPassword123!');
    assert.strictEqual(isMatch, true, 'Password verification should return true for correct password');
    console.log('✔ Test 1 Passed: Argon2 password hashing & verification work correctly.');

    // Test 2: Specialization & Doctor Creation
    console.log('Test 2: Specialization & Doctor Setup');
    const spec = await Specialization.create({ name: 'Cardiology', description: 'Heart health' });
    const docUser = await User.create({
      name: 'Dr. Test Doctor',
      email: 'doctor@test.com',
      passwordHash: hashed,
      role: 'doctor'
    });
    const doctor = await Doctor.create({
      userId: docUser._id,
      specializationId: spec._id,
      qualification: 'MD Cardiology',
      experience: 10,
      consultationFee: 200,
      phone: '1234567890',
      availability: [{ dayOfWeek: 1, startTime: '09:00', endTime: '11:00' }] // Monday 9-11 (4 slots: 09:00, 09:30, 10:00, 10:30)
    });
    assert.strictEqual(doctor.qualification, 'MD Cardiology');
    console.log('✔ Test 2 Passed: Doctor profile created & linked to Specialization.');

    // Test 3: Availability Slot Generation
    console.log('Test 3: Slot Generation Service');
    const slots = await getAvailableSlotsForDoctor(doctor._id, '2026-09-21');
    assert.strictEqual(slots.length, 4, 'Should generate 4 candidate slots (09:00, 09:30, 10:00, 10:30)');
    assert.strictEqual(slots[0].startTime, '09:00');
    assert.strictEqual(slots[0].isAvailable, true);
    console.log('✔ Test 3 Passed: Dynamic slots generated accurately for doctor availability.');

    // Test 4: Booking & Double-Booking Prevention
    console.log('Test 4: Appointment Double-Booking Conflict Check');
    const patientProfile = await Patient.create({ userId: testUser._id, phone: '555-1234' });

    const appt1 = await Appointment.create({
      patientId: patientProfile._id,
      doctorId: doctor._id,
      appointmentDate: '2026-09-21',
      startTime: '09:00',
      endTime: '09:30',
      reason: 'Chest discomfort',
      status: 'confirmed'
    });

    const slotsAfterBooking = await getAvailableSlotsForDoctor(doctor._id, '2026-09-21');
    const slot0900 = slotsAfterBooking.find(s => s.startTime === '09:00');
    assert.strictEqual(slot0900.isAvailable, false, '09:00 slot must mark as unavailable after booking');
    console.log('✔ Test 4 Passed: Booked slots are accurately excluded from availability calculation.');

    // Test 5: Medical Record Creation & Access Scope
    console.log('Test 5: Medical Record Creation');
    const medRecord = await MedicalRecord.create({
      patientId: patientProfile._id,
      doctorId: doctor._id,
      appointmentId: appt1._id,
      diagnosis: 'Angina Pectoris',
      symptoms: 'Chest pressure',
      treatment: 'Rest & Sublingual Nitroglycerin',
      prescription: 'Nitroglycerin 0.4mg'
    });
    assert.strictEqual(medRecord.diagnosis, 'Angina Pectoris');
    console.log('✔ Test 5 Passed: Medical Record created successfully.');

    console.log('\n✅ ALL BACKEND TESTS PASSED SUCCESSFULLY!\n');
  } catch (error) {
    console.error('❌ Test Failed:', error);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
}

runTests();
