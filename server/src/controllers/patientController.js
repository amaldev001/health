const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const { escapeRegex } = require('../utils/searchUtil');
const { AppError, catchAsync } = require('../utils/AppError');

// GET /api/patients (Admin only: search + pagination Requirement 6)
const getAllPatients = catchAsync(async (req, res, next) => {
  const { search, page = 1, limit = 20 } = req.query;
  const pageNum = Number(page);
  const limitNum = Number(limit);
  const skip = (pageNum - 1) * limitNum;

  let pipeline = [
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' }
  ];

  if (search && search.trim()) {
    const escaped = escapeRegex(search.trim());
    const searchRegex = new RegExp(escaped, 'i');
    pipeline.push({
      $match: {
        $or: [
          { 'user.name': searchRegex },
          { 'user.email': searchRegex },
          { phone: searchRegex }
        ]
      }
    });
  }

  const countPipeline = [...pipeline, { $count: 'total' }];
  const countResult = await Patient.aggregate(countPipeline);
  const total = countResult.length > 0 ? countResult[0].total : 0;

  pipeline.push({ $sort: { createdAt: -1 } });
  pipeline.push({ $skip: skip });
  pipeline.push({ $limit: limitNum });

  const patients = await Patient.aggregate(pipeline);

  const formattedPatients = patients.map(p => ({
    _id: p._id,
    userId: {
      _id: p.user._id,
      name: p.user.name,
      email: p.user.email,
      role: p.user.role,
      isActive: p.user.isActive
    },
    dateOfBirth: p.dateOfBirth,
    gender: p.gender,
    phone: p.phone,
    address: p.address,
    emergencyContact: p.emergencyContact,
    createdAt: p.createdAt
  }));

  return res.json({
    success: true,
    data: formattedPatients,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1
    }
  });
});

// GET /api/patients/:id
const getPatientById = catchAsync(async (req, res, next) => {
  const patient = await Patient.findById(req.params.id).populate('userId', 'name email role isActive');
  if (!patient) {
    throw AppError.notFound('Patient not found.');
  }

  // Patient own check
  if (req.user.role === 'patient') {
    if (patient.userId._id.toString() !== req.user.id) {
      throw AppError.forbidden('Access denied.');
    }
    return res.json({ success: true, data: patient });
  }

  // Doctor clinical relationship check (D15)
  if (req.user.role === 'doctor') {
    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (!doctor) {
      throw AppError.forbidden('Access denied.');
    }

    const hasRelation = await Appointment.exists({
      patientId: patient._id,
      doctorId: doctor._id,
      status: { $ne: 'cancelled' }
    });

    if (!hasRelation) {
      throw AppError.forbidden('Doctors can view only patient profiles with whom they have an active clinical relationship.');
    }

    // Return limited profile EXCLUDING home address (D15)
    return res.json({
      success: true,
      data: {
        id: patient._id,
        name: patient.userId?.name,
        email: patient.userId?.email,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        phone: patient.phone,
        emergencyContact: patient.emergencyContact
      }
    });
  }

  // Admin full profile view
  return res.json({
    success: true,
    data: patient
  });
});

// PUT /api/patients/:id
const updatePatientProfile = catchAsync(async (req, res, next) => {
  const patient = await Patient.findById(req.params.id);
  if (!patient) {
    throw AppError.notFound('Patient profile not found.');
  }

  if (req.user.role !== 'admin' && patient.userId.toString() !== req.user.id) {
    throw AppError.forbidden('Not authorized to update this profile.');
  }

  const { name, phone, dateOfBirth, gender, address, emergencyContact } = req.body;

  if (name) await User.findByIdAndUpdate(patient.userId, { name });

  if (phone !== undefined) patient.phone = phone;
  if (dateOfBirth !== undefined) patient.dateOfBirth = new Date(dateOfBirth);
  if (gender !== undefined) patient.gender = gender;
  if (address !== undefined) patient.address = address;
  if (emergencyContact !== undefined) patient.emergencyContact = emergencyContact;

  await patient.save();

  const updatedPatient = await Patient.findById(patient._id).populate('userId', 'name email role');

  return res.json({
    success: true,
    data: updatedPatient
  });
});

module.exports = {
  getAllPatients,
  getPatientById,
  updatePatientProfile
};
