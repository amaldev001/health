const mongoose = require('mongoose');
const env = require('./env');

const connectDB = async () => {
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('[Database] MongoDB connection established successfully.');
  } catch (err) {
    console.error(`[Database] MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
};

module.exports = { connectDB, disconnectDB };
