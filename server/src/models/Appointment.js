const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
    index: true
  },
  appointmentDate: {
    type: String, // YYYY-MM-DD in CLINIC_TIMEZONE (D7)
    required: true,
    match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'],
    index: true
  },
  startTime: {
    type: String, // HH:mm in CLINIC_TIMEZONE (D7)
    required: true
  },
  endTime: {
    type: String, // HH:mm in CLINIC_TIMEZONE (D7)
    required: true
  },
  reason: {
    type: String,
    required: [true, 'Reason for appointment is required'],
    trim: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'],
    default: 'scheduled',
    index: true
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Partial Unique Index for Database-Level Double Booking Prevention (D1)
appointmentSchema.index(
  { doctorId: 1, appointmentDate: 1, startTime: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ['scheduled', 'confirmed'] } }
  }
);

appointmentSchema.index({ patientId: 1, appointmentDate: 1 });
appointmentSchema.index({ status: 1, appointmentDate: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
