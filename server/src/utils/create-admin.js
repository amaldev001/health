const dotenv = require('dotenv');
dotenv.config();

const argon2 = require('argon2');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');

const createAdmin = async () => {
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

  if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('[Create Admin] Error: Missing required environment variables. Please define ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD in your environment.');
    process.exit(1);
  }

  if (ADMIN_PASSWORD.length < 10 || ADMIN_PASSWORD.length > 128) {
    console.error('[Create Admin] Error: ADMIN_PASSWORD must be between 10 and 128 characters long.');
    process.exit(1);
  }

  try {
    await connectDB();

    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log(`[Create Admin] An administrator account already exists (${existingAdmin.email}). No action taken.`);
      await disconnectDB();
      process.exit(0);
    }

    const passwordHash = await argon2.hash(ADMIN_PASSWORD);

    const admin = await User.create({
      name: ADMIN_NAME.trim(),
      email: ADMIN_EMAIL.toLowerCase().trim(),
      passwordHash,
      role: 'admin',
      mustChangePassword: false,
      isActive: true
    });

    console.log(`[Create Admin] Administrator '${admin.name}' (${admin.email}) created successfully.`);
    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error('[Create Admin] Error creating administrator:', err.message);
    process.exit(1);
  }
};

createAdmin();
