const MedicalRecord = require('../models/MedicalRecord');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Notification = require('../models/Notification');
const { AppError, catchAsync } = require('../utils/AppError');

// POST /api/medical-records (Doctor only D6, D19)
const createMedicalRecord = catchAsync(async (req, res, next) => {
  if (req.user.role === 'admin') {
    throw AppError.forbidden('Administrators can NOT read, create, or modify medical records.');
  }

  if (req.user.role !== 'doctor') {
    throw AppError.forbidden('Only attending doctors can create medical records.');
  }

  const { patientId, appointmentId, diagnosis, symptoms, treatment, prescription, notes } = req.body;

  const doctor = await Doctor.findOne({ userId: req.user.id });
  if (!doctor) {
    throw AppError.notFound('Doctor profile not found.');
  }

  // Verify appointment exists, belongs to this doctor & patient, and is confirmed or completed (D19)
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    throw AppError.notFound('Associated appointment not found.');
  }

  if (appointment.doctorId.toString() !== doctor._id.toString() || appointment.patientId.toString() !== patientId) {
    throw AppError.forbidden('Appointment does not belong to this doctor and patient.');
  }

  if (!['confirmed', 'completed'].includes(appointment.status)) {
    throw AppError.validationError('Medical records can be created only for confirmed or completed appointments.');
  }

  // Check if record already exists for appointment (D19)
  const existingRecord = await MedicalRecord.findOne({ appointmentId });
  if (existingRecord) {
    throw AppError.conflict('A medical record already exists for this appointment.');
  }

  let record;
  try {
    record = await MedicalRecord.create({
      patientId,
      doctorId: doctor._id,
      appointmentId,
      diagnosis: diagnosis.trim(),
      symptoms: symptoms ? symptoms.trim() : '',
      treatment: treatment ? treatment.trim() : '',
      prescription: prescription ? prescription.trim() : '',
      notes: notes ? notes.trim() : ''
    });
  } catch (createErr) {
    if (createErr.code === 11000) {
      throw AppError.conflict('A medical record already exists for this appointment.');
    }
    throw createErr;
  }

  const populatedRecord = await MedicalRecord.findById(record._id)
    .populate({ path: 'patientId', populate: { path: 'userId', select: 'name email' } })
    .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name email' } });

  // Send in-app notification to patient
  const patient = await Patient.findById(patientId).populate('userId');
  if (patient && patient.userId) {
    await Notification.create({
      userId: patient.userId._id,
      title: 'New Medical Record Available',
      message: `Dr. ${req.user.name} added a new medical record for your consultation.`,
      type: 'medical_record'
    });
  }

  return res.status(201).json({
    success: true,
    data: populatedRecord
  });
});

// GET /api/medical-records (Doctor reads authored D15, Patient reads own, Admin 403 Requirement 6)
const getMedicalRecords = catchAsync(async (req, res, next) => {
  if (req.user.role === 'admin') {
    throw AppError.forbidden('Administrators can NOT read, create, or modify medical records.');
  }

  let filter = {};
  if (req.user.role === 'patient') {
    const patient = await Patient.findOne({ userId: req.user.id });
    if (!patient) return res.json({ success: true, data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 1 } });
    filter.patientId = patient._id;
  } else if (req.user.role === 'doctor') {
    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (!doctor) return res.json({ success: true, data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 1 } });
    filter.doctorId = doctor._id; // Doctor reads ONLY authored records D15
  }

  const { page = 1, limit = 20 } = req.query;
  const pageNum = Number(page);
  const limitNum = Number(limit);
  const skip = (pageNum - 1) * limitNum;

  const total = await MedicalRecord.countDocuments(filter);
  const records = await MedicalRecord.find(filter)
    .populate({ path: 'patientId', populate: { path: 'userId', select: 'name email' } })
    .populate({ path: 'doctorId', populate: [{ path: 'userId', select: 'name email' }, { path: 'specializationId', select: 'name' }] })
    .populate('appointmentId')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  return res.json({
    success: true,
    data: records,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1
    }
  });
});

// GET /api/medical-records/:id
const getMedicalRecordById = catchAsync(async (req, res, next) => {
  if (req.user.role === 'admin') {
    throw AppError.forbidden('Administrators can NOT read, create, or modify medical records.');
  }

  const record = await MedicalRecord.findById(req.params.id)
    .populate({ path: 'patientId', populate: { path: 'userId', select: 'name email' } })
    .populate({ path: 'doctorId', populate: [{ path: 'userId', select: 'name email' }, { path: 'specializationId', select: 'name' }] })
    .populate('appointmentId');

  if (!record) {
    throw AppError.notFound('Medical record not found.');
  }

  if (req.user.role === 'patient') {
    if (record.patientId.userId._id.toString() !== req.user.id) {
      throw AppError.forbidden('Access denied.');
    }
  } else if (req.user.role === 'doctor') {
    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (!doctor || record.doctorId._id.toString() !== doctor._id.toString()) {
      throw AppError.forbidden('Doctors can view only records they authored.');
    }
  }

  return res.json({
    success: true,
    data: record
  });
});

// GET /api/patients/:id/medical-records
const getPatientMedicalRecords = catchAsync(async (req, res, next) => {
  if (req.user.role === 'admin') {
    throw AppError.forbidden('Administrators can NOT read, create, or modify medical records.');
  }

  const patient = await Patient.findById(req.params.id);
  if (!patient) {
    throw AppError.notFound('Patient profile not found.');
  }

  let filter = { patientId: req.params.id };

  if (req.user.role === 'patient') {
    if (patient.userId.toString() !== req.user.id) {
      throw AppError.forbidden('Access denied.');
    }
  } else if (req.user.role === 'doctor') {
    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (!doctor) throw AppError.forbidden('Access denied.');
    filter.doctorId = doctor._id; // Doctor reads ONLY records THEY authored D15
  }

  const { page = 1, limit = 20 } = req.query;
  const pageNum = Number(page);
  const limitNum = Number(limit);
  const skip = (pageNum - 1) * limitNum;

  const total = await MedicalRecord.countDocuments(filter);
  const records = await MedicalRecord.find(filter)
    .populate({ path: 'doctorId', populate: [{ path: 'userId', select: 'name email' }, { path: 'specializationId', select: 'name' }] })
    .populate('appointmentId')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  return res.json({
    success: true,
    data: records,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1
    }
  });
});

// PUT /api/medical-records/:id (Original Author Doctor only D19)
const updateMedicalRecord = catchAsync(async (req, res, next) => {
  if (req.user.role === 'admin') {
    throw AppError.forbidden('Administrators can NOT read, create, or modify medical records.');
  }

  const record = await MedicalRecord.findById(req.params.id);
  if (!record) {
    throw AppError.notFound('Medical record not found.');
  }

  const doctor = await Doctor.findOne({ userId: req.user.id });
  if (!doctor || record.doctorId.toString() !== doctor._id.toString()) {
    throw AppError.forbidden('Only the original authoring doctor can edit this medical record.');
  }

  const { diagnosis, symptoms, treatment, prescription, notes } = req.body;

  if (diagnosis !== undefined) record.diagnosis = diagnosis.trim();
  if (symptoms !== undefined) record.symptoms = symptoms.trim();
  if (treatment !== undefined) record.treatment = treatment.trim();
  if (prescription !== undefined) record.prescription = prescription.trim();
  if (notes !== undefined) record.notes = notes.trim();

  await record.save();

  return res.json({
    success: true,
    data: record
  });
});

module.exports = {
  createMedicalRecord,
  getMedicalRecords,
  getMedicalRecordById,
  getPatientMedicalRecords,
  updateMedicalRecord
};
