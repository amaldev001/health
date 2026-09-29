const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  specializationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Specialization',
    required: true,
    index: true
  },
  qualification: {
    type: String,
    required: true,
    trim: true
  },
  experience: {
    type: Number,
    required: true,
    min: 0
  },
  consultationFee: {
    type: Number,
    required: true,
    min: 0
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  bio: {
    type: String,
    trim: true
  },
  profileImage: {
    type: String,
    default: ''
  },
  availability: [
    {
      _id: false,
      dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
      startTime: { type: String, required: true },
      endTime: { type: String, required: true }
    }
  ],
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: true
});

doctorSchema.index({ qualification: 'text' });
doctorSchema.index({ isActive: 1, specializationId: 1 });

module.exports = mongoose.model('Doctor', doctorSchema);
