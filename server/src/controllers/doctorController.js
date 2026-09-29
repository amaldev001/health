const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Patient = require('../models/Patient');
const { findDoctorsInDatabase } = require('../utils/searchUtil');
const { AppError, catchAsync } = require('../utils/AppError');

// Helper to project public doctor fields only (no email, no phone, no isActive unless admin)
const formatPublicDoctor = (docObj) => {
  return {
    id: docObj.id || docObj._id,
    name: docObj.name || docObj.userId?.name || '',
    specialization: docObj.specialization || (docObj.specializationId ? { id: docObj.specializationId._id, name: docObj.specializationId.name, description: docObj.specializationId.description } : null),
    qualification: docObj.qualification,
    experience: docObj.experience,
    consultationFee: docObj.consultationFee,
    bio: docObj.bio,
    profileImage: docObj.profileImage || '',
    availability: docObj.availability || []
  };
};

// GET /api/doctors (Public list & Admin list with includeInactive DB search)
const getDoctors = catchAsync(async (req, res, next) => {
  const { specializationId, search, includeInactive, page = 1, limit = 20 } = req.query;

  // Requirement 6: includeInactive=true is restricted to Admin only
  const shouldIncludeInactive = (includeInactive === true || includeInactive === 'true') && req.user && req.user.role === 'admin';

  const result = await findDoctorsInDatabase({
    specializationId,
    search,
    includeInactive: shouldIncludeInactive,
    page: Number(page),
    limit: Number(limit)
  });

  // Strip private info for public responses
  const finalData = result.doctors.map(d => {
    if (req.user && req.user.role === 'admin') {
      return d; // Admin gets full details including email/phone/isActive
    }
    return formatPublicDoctor(d);
  });

  return res.json({
    success: true,
    data: finalData,
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages
    }
  });
});

// GET /api/doctors/:id (Public details D7)
const getDoctorById = catchAsync(async (req, res, next) => {
  const doctor = await Doctor.findById(req.params.id)
    .populate({ path: 'userId', select: 'name email role isActive' })
    .populate('specializationId');

  if (!doctor || (!doctor.isActive && (!req.user || req.user.role !== 'admin'))) {
    throw AppError.notFound('Doctor not found.');
  }

  const isSelfOrAdmin = req.user && (req.user.role === 'admin' || doctor.userId._id.toString() === req.user.id);
  const data = isSelfOrAdmin ? doctor : formatPublicDoctor(doctor);

  return res.json({
    success: true,
    data
  });
});

// POST /api/doctors (Admin creates doctor account D13, D17)
const createDoctor = catchAsync(async (req, res, next) => {
  const { name, email, password, specializationId, qualification, experience, consultationFee, phone, bio } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw AppError.conflict('Email address already in use.');
  }

  let user;
  try {
    const passwordHash = await User.hashPassword(password);
    user = await User.create({
      name,
      email,
      passwordHash,
      role: 'doctor',
      mustChangePassword: true, // Doctor forced to change temp password on initial login D17
      isActive: true
    });

    const defaultAvailability = [1, 2, 3, 4, 5].map(day => ({
      dayOfWeek: day,
      startTime: '09:00',
      endTime: '17:00'
    }));

    const doctor = await Doctor.create({
      userId: user._id,
      specializationId,
      qualification,
      experience: Number(experience) || 0,
      consultationFee: Number(consultationFee) || 0,
      phone: phone || '',
      bio: bio || '',
      availability: defaultAvailability,
      isActive: true
    });

    const populatedDoctor = await Doctor.findById(doctor._id)
      .populate('userId', 'name email role mustChangePassword')
      .populate('specializationId');

    return res.status(201).json({
      success: true,
      data: {
        id: populatedDoctor._id,
        name: user.name,
        email: user.email,
        qualification: doctor.qualification,
        experience: doctor.experience,
        consultationFee: doctor.consultationFee,
        specialization: populatedDoctor.specializationId
      }
    });
  } catch (err) {
    if (user && user._id) {
      await User.findByIdAndDelete(user._id);
    }
    throw err;
  }
});

// PUT /api/doctors/:id (Doctor edits profile; Admin edits profile D14)
const updateDoctorProfile = catchAsync(async (req, res, next) => {
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) {
    throw AppError.notFound('Doctor profile not found.');
  }

  if (req.user.role !== 'admin' && doctor.userId.toString() !== req.user.id) {
    throw AppError.forbidden('Not authorized to edit this doctor profile.');
  }

  const { name, qualification, experience, consultationFee, phone, bio, specializationId, isActive } = req.body;

  if (name) await User.findByIdAndUpdate(doctor.userId, { name });

  if (qualification !== undefined) doctor.qualification = qualification;
  if (experience !== undefined) doctor.experience = experience;
  if (consultationFee !== undefined) doctor.consultationFee = consultationFee;
  if (phone !== undefined) doctor.phone = phone;
  if (bio !== undefined) doctor.bio = bio;
  if (specializationId !== undefined) doctor.specializationId = specializationId;
  if (isActive !== undefined && req.user.role === 'admin') doctor.isActive = isActive;

  await doctor.save();

  const updatedDoctor = await Doctor.findById(doctor._id)
    .populate('userId', 'name email role isActive')
    .populate('specializationId');

  return res.json({
    success: true,
    data: updatedDoctor
  });
});

// GET /api/doctors/:id/availability
const getDoctorAvailability = catchAsync(async (req, res, next) => {
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) {
    throw AppError.notFound('Doctor not found.');
  }

  return res.json({
    success: true,
    data: doctor.availability || []
  });
});

// PUT /api/doctors/:id/availability (Doctor own only D14, Requirement 7)
const updateDoctorAvailability = catchAsync(async (req, res, next) => {
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) {
    throw AppError.notFound('Doctor not found.');
  }

  if (doctor.userId.toString() !== req.user.id) {
    throw AppError.forbidden('Only the doctor can edit their own availability (D14).');
  }

  const { availability } = req.body;
  doctor.availability = availability;
  await doctor.save();

  return res.json({
    success: true,
    data: doctor.availability
  });
});

// GET /api/doctors/:id/available-slots?date=YYYY-MM-DD
const getAvailableSlots = catchAsync(async (req, res, next) => {
  const { getAvailableSlotsForDoctor } = require('../services/availabilityService');
  const { date } = req.query;

  const slots = await getAvailableSlotsForDoctor(req.params.id, date);
  return res.json({
    success: true,
    data: slots
  });
});

// GET /api/doctors/:id/patients (Doctor clinical relation patients D15, Requirement 6)
const getDoctorPatients = catchAsync(async (req, res, next) => {
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) {
    throw AppError.notFound('Doctor not found.');
  }

  if (doctor.userId.toString() !== req.user.id) {
    throw AppError.forbidden('Not authorized to view another doctor patients.');
  }

  const Appointment = require('../models/Appointment');
  // Find patients with at least one non-cancelled appointment with this doctor (D15)
  const appointments = await Appointment.find({
    doctorId: doctor._id,
    status: { $ne: 'cancelled' }
  }).distinct('patientId');

  const { page = 1, limit = 20 } = req.query;
  const pageNum = Number(page);
  const limitNum = Number(limit);
  const skip = (pageNum - 1) * limitNum;

  const total = appointments.length;
  const patients = await Patient.find({ _id: { $in: appointments } })
    .populate('userId', 'name email role')
    .skip(skip)
    .limit(limitNum);

  // Return limited patient profiles (EXCLUDING home address D15)
  const limitedPatients = patients.map(p => ({
    id: p._id,
    name: p.userId?.name,
    email: p.userId?.email,
    dateOfBirth: p.dateOfBirth,
    gender: p.gender,
    phone: p.phone
  }));

  return res.json({
    success: true,
    data: limitedPatients,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1
    }
  });
});

module.exports = {
  getDoctors,
  getDoctorById,
  createDoctor,
  updateDoctorProfile,
  getDoctorAvailability,
  updateDoctorAvailability,
  getAvailableSlots,
  getDoctorPatients
};
