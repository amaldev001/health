const mongoose = require('mongoose');

const specializationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Specialization name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Collation index for case-insensitive unique name lookups (Requirement 4)
specializationSchema.index({ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

module.exports = mongoose.model('Specialization', specializationSchema);
