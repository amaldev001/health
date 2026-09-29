const dotenv = require('dotenv');
dotenv.config();

const argon2 = require('argon2');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const MedicalRecord = require('../models/MedicalRecord');
const Notification = require('../models/Notification');
const Specialization = require('../models/Specialization');

async function cleanDatabase() {
  await connectDB();
  console.log('[CLEAN DB] Wiping all dummy data from database...');

  // 1. Clear transactional collections
  await Appointment.deleteMany({});
  await MedicalRecord.deleteMany({});
  await Notification.deleteMany({});
  await Doctor.deleteMany({});
  await Patient.deleteMany({});
  await Specialization.deleteMany({});

  // 2. Clear users except admin@gmail.com
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@gmail.com').toLowerCase().trim();
  await User.deleteMany({ email: { $ne: adminEmail } });

  // 3. Ensure the single Admin user exists with correct password
  const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPassword123!';
  const hash = await argon2.hash(adminPassword);

  let admin = await User.findOne({ email: adminEmail });
  if (admin) {
    admin.name = process.env.ADMIN_NAME || 'System Admin';
    admin.passwordHash = hash;
    admin.role = 'admin';
    admin.isActive = true;
    admin.mustChangePassword = false;
    await admin.save();
    console.log(`[CLEAN DB] Reset Admin account: ${admin.email}`);
  } else {
    admin = await User.create({
      name: process.env.ADMIN_NAME || 'System Admin',
      email: adminEmail,
      passwordHash: hash,
      role: 'admin',
      mustChangePassword: false,
      isActive: true,
    });
    console.log(`[CLEAN DB] Created Admin account: ${admin.email}`);
  }

  // 4. Verify clean counts
  const userCount = await User.countDocuments();
  const docCount = await Doctor.countDocuments();
  const patCount = await Patient.countDocuments();
  const apptCount = await Appointment.countDocuments();
  const recCount = await MedicalRecord.countDocuments();
  const notifCount = await Notification.countDocuments();

  const specCount = await Specialization.countDocuments();

  console.log('\n--- CLEAN DATABASE STATUS ---');
  console.log(`Users: ${userCount} (Admin only)`);
  console.log(`Specializations: ${specCount}`);
  console.log(`Doctors: ${docCount}`);
  console.log(`Patients: ${patCount}`);
  console.log(`Appointments: ${apptCount}`);
  console.log(`Medical Records: ${recCount}`);
  console.log(`Notifications: ${notifCount}`);
  console.log('-----------------------------\n');

  await disconnectDB();
}

cleanDatabase().catch((err) => {
  console.error('[CLEAN DB ERROR]:', err);
  process.exit(1);
});
