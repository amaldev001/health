const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Notification = require('../models/Notification');
const { getAvailableSlotsForDoctor } = require('./availabilityService');
const { AppError } = require('../utils/AppError');
const {
  validateBookingDate,
  add30Minutes,
  getTodayInClinicTimezone,
  getCurrentTimeInClinicTimezone
} = require('../utils/time');

// Explicit State Machine Allowed Transitions per Document 11
const STATE_MACHINE_RULES = {
  scheduled: {
    confirmed: ['doctor', 'admin'],
    cancelled: ['patient', 'doctor', 'admin']
  },
  confirmed: {
    cancelled: ['patient', 'doctor', 'admin'],
    completed: ['doctor', 'admin'],
    no_show: ['doctor', 'admin']
  },
  completed: {},
  cancelled: {},
  no_show: {}
};

/**
 * Creates a new appointment (Patient only D14).
 */
const createAppointment = async ({ user, doctorId, appointmentDate, startTime, reason, notes }) => {
  if (user.role !== 'patient') {
    throw AppError.forbidden('Only patients can book appointments.');
  }

  const patient = await Patient.findOne({ userId: user.id });
  if (!patient) {
    throw AppError.notFound('Patient profile not found.');
  }

  // Doctor validation
  const doctor = await Doctor.findById(doctorId).populate('userId', 'name');
  if (!doctor || !doctor.isActive) {
    throw AppError.notFound('Doctor not found or inactive.');
  }

  // Date validation (YYYY-MM-DD, not past, <= 60 days D1, D7)
  const dateValidation = validateBookingDate(appointmentDate);
  if (!dateValidation.valid) {
    throw AppError.validationError(dateValidation.message);
  }

  // Reject slots already passed today
  const todayStr = getTodayInClinicTimezone();
  const currentTimeStr = getCurrentTimeInClinicTimezone();
  if (appointmentDate === todayStr && startTime <= currentTimeStr) {
    throw AppError.validationError('Cannot book a time slot that has already passed today.');
  }

  // Availability validation
  const availableSlots = await getAvailableSlotsForDoctor(doctorId, appointmentDate);
  const matchedSlot = availableSlots.find(s => s.startTime === startTime && s.isAvailable);

  if (!matchedSlot) {
    throw AppError.conflict('The selected appointment slot is not available.');
  }

  // Compute endTime automatically (ignore client endTime)
  const computedEndTime = add30Minutes(startTime);

  try {
    const appointment = await Appointment.create({
      patientId: patient._id,
      doctorId,
      appointmentDate,
      startTime,
      endTime: computedEndTime,
      reason: reason.trim(),
      notes: notes ? notes.trim() : '',
      status: 'scheduled'
    });

    // In-app notifications for booked event (D5)
    await Notification.create({
      userId: doctor.userId._id,
      title: 'New Appointment Booked',
      message: `New appointment booked by ${user.name} for ${appointmentDate} at ${startTime}.`,
      type: 'appointment'
    });

    await Notification.create({
      userId: user.id,
      title: 'Appointment Booked',
      message: `Your appointment with Dr. ${doctor.userId.name} is booked for ${appointmentDate} at ${startTime}.`,
      type: 'appointment'
    });

    return await Appointment.findById(appointment._id)
      .populate({ path: 'patientId', populate: { path: 'userId', select: 'name email' } })
      .populate({ path: 'doctorId', populate: [{ path: 'userId', select: 'name email' }, { path: 'specializationId', select: 'name' }] });
  } catch (err) {
    if (err.code === 11000) {
      throw AppError.conflict('The selected appointment slot is no longer available.');
    }
    throw err;
  }
};

/**
 * Transition appointment status according to State Machine & Ownership (D2, D3, D4).
 */
const updateAppointmentStatus = async ({ user, appointmentId, newStatus }) => {
  const appointment = await Appointment.findById(appointmentId)
    .populate({ path: 'patientId', populate: { path: 'userId', select: 'name' } })
    .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } });

  if (!appointment) {
    throw AppError.notFound('Appointment not found.');
  }

  const currentStatus = appointment.status;

  // Check state machine validity
  const allowedNext = STATE_MACHINE_RULES[currentStatus];
  if (!allowedNext || !allowedNext[newStatus]) {
    throw AppError.conflict(`Cannot transition appointment from '${currentStatus}' to '${newStatus}'.`);
  }

  const allowedRoles = allowedNext[newStatus];

  // Role authorization
  if (!allowedRoles.includes(user.role)) {
    throw AppError.forbidden(`Users with role '${user.role}' cannot transition status to '${newStatus}'.`);
  }

  // Ownership verification
  if (user.role === 'patient') {
    if (appointment.patientId.userId._id.toString() !== user.id) {
      throw AppError.forbidden('You can only manage your own appointments.');
    }
    // 24-hour patient cancellation rule (D3)
    if (newStatus === 'cancelled') {
      const todayStr = getTodayInClinicTimezone();

      if (appointment.appointmentDate === todayStr) {
        throw AppError.forbidden('Patients can cancel only 24 hours or more before start time.');
      }
    }
  } else if (user.role === 'doctor') {
    if (appointment.doctorId.userId._id.toString() !== user.id) {
      throw AppError.forbidden('You can only manage appointments assigned to you.');
    }
  }

  // Additional condition: completed & no_show only allowed at/after start time
  if (newStatus === 'completed' || newStatus === 'no_show') {
    const todayStr = getTodayInClinicTimezone();
    const currentTimeStr = getCurrentTimeInClinicTimezone();
    if (appointment.appointmentDate > todayStr || (appointment.appointmentDate === todayStr && currentTimeStr < appointment.startTime)) {
      throw AppError.validationError(`Status '${newStatus}' can only be set at or after appointment start time.`);
    }
  }

  appointment.status = newStatus;
  await appointment.save();

  // Create event notifications for both parties (D5)
  if (appointment.patientId && appointment.patientId.userId) {
    await Notification.create({
      userId: appointment.patientId.userId._id,
      title: 'Appointment Status Updated',
      message: `Your appointment with Dr. ${appointment.doctorId.userId.name} on ${appointment.appointmentDate} is now ${newStatus.toUpperCase()}.`,
      type: 'appointment'
    });
  }

  if (appointment.doctorId && appointment.doctorId.userId) {
    await Notification.create({
      userId: appointment.doctorId.userId._id,
      title: 'Appointment Status Updated',
      message: `Appointment with ${appointment.patientId.userId.name} on ${appointment.appointmentDate} is now ${newStatus.toUpperCase()}.`,
      type: 'appointment'
    });
  }

  return appointment;
};

/**
 * List appointments with ownership enforcement and status, from, to filters (Requirement 6).
 */
const getAppointments = async ({ user, status, from, to, page = 1, limit = 20 }) => {
  let filter = {};

  if (user.role === 'patient') {
    const patient = await Patient.findOne({ userId: user.id });
    if (!patient) return { appointments: [], total: 0, page, limit, totalPages: 0 };
    filter.patientId = patient._id;
  } else if (user.role === 'doctor') {
    const doctor = await Doctor.findOne({ userId: user.id });
    if (!doctor) return { appointments: [], total: 0, page, limit, totalPages: 0 };
    filter.doctorId = doctor._id;
  }
  // Admin sees all

  if (status) filter.status = status;

  if (from || to) {
    filter.appointmentDate = {};
    if (from) filter.appointmentDate.$gte = from;
    if (to) filter.appointmentDate.$lte = to;
  }

  const skip = (page - 1) * limit;
  const total = await Appointment.countDocuments(filter);
  const appointments = await Appointment.find(filter)
    .populate({ path: 'patientId', populate: { path: 'userId', select: 'name email' } })
    .populate({ path: 'doctorId', populate: [{ path: 'userId', select: 'name email' }, { path: 'specializationId', select: 'name' }] })
    .sort({ appointmentDate: -1, startTime: 1 })
    .skip(skip)
    .limit(limit);

  return {
    appointments,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / limit) || 1
  };
};

/**
 * Get appointment by ID with ownership enforcement.
 */
const getAppointmentById = async ({ user, appointmentId }) => {
  const appointment = await Appointment.findById(appointmentId)
    .populate({ path: 'patientId', populate: { path: 'userId', select: 'name email' } })
    .populate({ path: 'doctorId', populate: [{ path: 'userId', select: 'name email' }, { path: 'specializationId', select: 'name' }] });

  if (!appointment) {
    throw AppError.notFound('Appointment not found.');
  }

  if (user.role === 'patient') {
    if (appointment.patientId.userId._id.toString() !== user.id) {
      throw AppError.forbidden('Access denied.');
    }
  } else if (user.role === 'doctor') {
    if (appointment.doctorId.userId._id.toString() !== user.id) {
      throw AppError.forbidden('Access denied.');
    }
  }

  return appointment;
};

module.exports = {
  createAppointment,
  updateAppointmentStatus,
  getAppointments,
  getAppointmentById
};
