process.env.NODE_ENV = 'test';
process.env.PORT = '5000';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/healthcare_empty_flow_db';
process.env.JWT_SECRET = 'test_super_secret_jwt_key_32_characters_min_length';
process.env.FRONTEND_ORIGIN = 'http://localhost:3000';
process.env.CLINIC_TIMEZONE = 'Asia/Kolkata';
process.env.ADMIN_NAME = 'Primary Administrator';
process.env.ADMIN_EMAIL = 'admin@healthcare-system.com';
process.env.ADMIN_PASSWORD = 'AdminSecurePassword123!';

const assert = require('assert');
const argon2 = require('argon2');
const { connectDB, disconnectDB } = require('../src/config/db');
const User = require('../src/models/User');
const Doctor = require('../src/models/Doctor');
const Patient = require('../src/models/Patient');
const Specialization = require('../src/models/Specialization');
const Appointment = require('../src/models/Appointment');
const MedicalRecord = require('../src/models/MedicalRecord');
const Notification = require('../src/models/Notification');
const { getAvailableSlotsForDoctor } = require('../src/services/availabilityService');

async function verifyEmptyDbFlow() {
  console.log('\n================ VERIFYING FRESH INSTALL & EMPTY DATABASE FLOW ================');
  try {
    await connectDB();

    // Step 1: Drop/Clear all collections completely
    console.log('\n1. Dropping all collections (Fresh empty database)...');
    await User.deleteMany({});
    await Doctor.deleteMany({});
    await Patient.deleteMany({});
    await Specialization.deleteMany({});
    await Appointment.deleteMany({});
    await MedicalRecord.deleteMany({});
    await Notification.deleteMany({});

    // Step 2: Run create-admin logic
    console.log('2. Running create-admin script...');
    const existingAdmin = await User.findOne({ role: 'admin' });
    assert.strictEqual(existingAdmin, null, 'Database must be 100% empty initially');

    const adminHash = await argon2.hash(process.env.ADMIN_PASSWORD);
    const adminUser = await User.create({
      name: process.env.ADMIN_NAME,
      email: process.env.ADMIN_EMAIL.toLowerCase(),
      passwordHash: adminHash,
      role: 'admin',
      isActive: true
    });
    console.log(`✔ Admin created: ${adminUser.name} (${adminUser.email})`);

    // Step 3: Confirm all counts are 0/empty
    console.log('3. Checking dashboard metrics on fresh install...');
    const totalDoctors = await Doctor.countDocuments();
    const totalPatients = await Patient.countDocuments();
    const totalSpecs = await Specialization.countDocuments();
    const totalAppts = await Appointment.countDocuments();

    assert.strictEqual(totalDoctors, 0, 'Doctor count must be 0 on fresh install');
    assert.strictEqual(totalPatients, 0, 'Patient count must be 0 on fresh install');
    assert.strictEqual(totalSpecs, 0, 'Specialization count must be 0 on fresh install');
    assert.strictEqual(totalAppts, 0, 'Appointment count must be 0 on fresh install');
    console.log('✔ Confirmed: All entity counts are 0 on fresh install.');

    // Step 4: Create Specialization
    console.log('4. Creating first Specialization (Cardiology)...');
    const spec = await Specialization.create({
      name: 'Cardiology',
      description: 'Comprehensive heart care'
    });
    assert.strictEqual(spec.name, 'Cardiology');
    console.log('✔ Specialization created successfully.');

    // Step 5: Create Doctor Account
    console.log('5. Creating first Doctor account & profile...');
    const docHash = await argon2.hash('DoctorPassword123!');
    const docUser = await User.create({
      name: 'Dr. Alice Sterling',
      email: 'dr.sterling@hospital.com',
      passwordHash: docHash,
      role: 'doctor',
      mustChangePassword: true
    });
    const doctor = await Doctor.create({
      userId: docUser._id,
      specializationId: spec._id,
      qualification: 'MD Cardiology',
      experience: 12,
      consultationFee: 150,
      phone: '+1 555-0199',
      availability: [{ dayOfWeek: 1, startTime: '09:00', endTime: '12:00' }] // Monday 9am-12pm
    });
    console.log(`✔ Doctor created: ${docUser.name} attached to ${spec.name}`);

    // Step 6: Register Patient Account
    console.log('6. Registering first Patient account...');
    const patHash = await argon2.hash('PatientPassword123!');
    const patUser = await User.create({
      name: 'Robert Miller',
      email: 'robert.miller@email.com',
      passwordHash: patHash,
      role: 'patient'
    });
    const patient = await Patient.create({
      userId: patUser._id,
      phone: '+1 555-0288',
      gender: 'Male'
    });
    console.log(`✔ Patient registered: ${patUser.name}`);

    // Step 7: Check available slots & book appointment
    console.log('7. Calculating dynamic time slots for Monday 2026-09-21...');
    const availableSlots = await getAvailableSlotsForDoctor(doctor._id, '2026-09-21');
    assert.ok(availableSlots.length > 0, 'Doctor should have available slots');
    const chosenSlot = availableSlots[0];
    console.log(`✔ Selected slot: ${chosenSlot.startTime} - ${chosenSlot.endTime}`);

    console.log('8. Booking appointment...');
    const appointment = await Appointment.create({
      patientId: patient._id,
      doctorId: doctor._id,
      appointmentDate: '2026-09-21',
      startTime: chosenSlot.startTime,
      endTime: chosenSlot.endTime,
      reason: 'Routine cardiovascular screening',
      status: 'scheduled'
    });
    assert.strictEqual(appointment.status, 'scheduled');
    console.log(`✔ Appointment booked for ${chosenSlot.startTime}`);

    // Step 8: Confirm appointment
    console.log('9. Updating appointment status to confirmed...');
    appointment.status = 'confirmed';
    await appointment.save();
    console.log('✔ Appointment confirmed by doctor.');

    // Step 9: Add Medical Record
    console.log('10. Creating clinical medical record...');
    const medicalRecord = await MedicalRecord.create({
      patientId: patient._id,
      doctorId: doctor._id,
      appointmentId: appointment._id,
      diagnosis: 'Normal Sinus Rhythm',
      symptoms: 'Asymptomatic routine check',
      treatment: 'Annual screening recommended',
      prescription: 'Multivitamins'
    });
    assert.strictEqual(medicalRecord.diagnosis, 'Normal Sinus Rhythm');
    console.log('✔ Medical Record created successfully.');

    // Step 10: Verify updated counts
    console.log('11. Verifying final database counts...');
    const finalDocs = await Doctor.countDocuments();
    const finalPats = await Patient.countDocuments();
    const finalSpecs = await Specialization.countDocuments();
    const finalAppts = await Appointment.countDocuments();
    const finalRecords = await MedicalRecord.countDocuments();

    assert.strictEqual(finalDocs, 1);
    assert.strictEqual(finalPats, 1);
    assert.strictEqual(finalSpecs, 1);
    assert.strictEqual(finalAppts, 1);
    assert.strictEqual(finalRecords, 1);

    console.log('\n✅ ALL VERIFICATION STEPS PASSED SUCCESSFULLY! Whole flow verified with 0 pre-existing data.\n');
  } catch (err) {
    console.error('❌ Empty DB Flow Verification Failed:', err);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
}

verifyEmptyDbFlow();
