const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
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
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true,
    unique: true // Exactly one medical record per appointment (D19)
  },
  diagnosis: {
    type: String,
    required: [true, 'Diagnosis is required'],
    trim: true
  },
  symptoms: {
    type: String,
    trim: true
  },
  treatment: {
    type: String,
    trim: true
  },
  prescription: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

medicalRecordSchema.index({ patientId: 1, createdAt: -1 });
medicalRecordSchema.index({ doctorId: 1, createdAt: -1 });

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
