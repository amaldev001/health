const dotenv = require('dotenv');
dotenv.config();

const argon2 = require('argon2');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');

async function syncAllCredentials() {
  await connectDB();
  const adminHash = await argon2.hash(process.env.ADMIN_PASSWORD || 'AdminPassword123!');
  const doctorHash = await argon2.hash('DoctorPassword123!');

  // Sync Admins
  const adminEmails = [process.env.ADMIN_EMAIL || 'admin@gmail.com', 'admin@healthcare.com'];
  for (const email of adminEmails) {
    let admin = await User.findOne({ email: email.toLowerCase().trim() });
    if (admin) {
      admin.passwordHash = adminHash;
      admin.role = 'admin';
      admin.isActive = true;
      await admin.save();
    }
  }

  // Sync Doctors
  const doctors = await User.find({ role: 'doctor' });
  for (const doc of doctors) {
    doc.passwordHash = doctorHash;
    doc.isActive = true;
    await doc.save();
  }

  console.log('[CREDENTIALS SYNC COMPLETE]');
  await disconnectDB();
}

syncAllCredentials().catch(console.error);
