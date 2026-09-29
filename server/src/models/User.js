const mongoose = require('mongoose');
const argon2 = require('argon2');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  passwordHash: {
    type: String,
    required: [true, 'Password is required'],
    select: false
  },
  role: {
    type: String,
    enum: ['patient', 'doctor', 'admin'],
    required: true,
    default: 'patient'
  },
  mustChangePassword: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await argon2.verify(this.passwordHash, enteredPassword);
};

userSchema.statics.hashPassword = async function (password) {
  return await argon2.hash(password);
};

module.exports = mongoose.model('User', userSchema);
