const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Specialization = require('../models/Specialization');
const { getTodayInClinicTimezone } = require('../utils/time');
const { AppError, catchAsync } = require('../utils/AppError');

// GET /api/admin/dashboard (Counts run in parallel Requirement 8)
const getDashboardMetrics = catchAsync(async (req, res, next) => {
  const todayStr = getTodayInClinicTimezone();

  // Run all count queries and recent items query in parallel via Promise.all
  const [
    totalUsers,
    totalDoctors,
    totalPatients,
    totalSpecializations,
    totalAppointments,
    scheduledAppointments,
    confirmedAppointments,
    completedAppointments,
    cancelledAppointments,
    noShowAppointments,
    todaysAppointments,
    recentAppointments
  ] = await Promise.all([
    User.countDocuments(),
    Doctor.countDocuments({ isActive: true }),
    Patient.countDocuments(),
    Specialization.countDocuments({ isActive: true }),
    Appointment.countDocuments(),
    Appointment.countDocuments({ status: 'scheduled' }),
    Appointment.countDocuments({ status: 'confirmed' }),
    Appointment.countDocuments({ status: 'completed' }),
    Appointment.countDocuments({ status: 'cancelled' }),
    Appointment.countDocuments({ status: 'no_show' }),
    Appointment.countDocuments({ appointmentDate: todayStr }),
    Appointment.find()
      .populate({ path: 'patientId', populate: { path: 'userId', select: 'name' } })
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } })
      .sort({ createdAt: -1 })
      .limit(5)
  ]);

  return res.json({
    success: true,
    data: {
      metrics: {
        totalUsers,
        totalDoctors,
        totalPatients,
        totalSpecializations,
        totalAppointments,
        scheduledAppointments,
        confirmedAppointments,
        completedAppointments,
        cancelledAppointments,
        noShowAppointments,
        todaysAppointments
      },
      recentAppointments
    }
  });
});

// GET /api/admin/users (Paginated)
const getUsers = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 20 } = req.query;
  const pageNum = Number(page);
  const limitNum = Number(limit);
  const skip = (pageNum - 1) * limitNum;

  const total = await User.countDocuments();
  const users = await User.find()
    .select('-passwordHash')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  return res.json({
    success: true,
    data: users,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1
    }
  });
});

// PATCH /api/admin/users/:id/status (Requirement 6: Cannot deactivate yourself or last active admin)
const updateUserStatus = catchAsync(async (req, res, next) => {
  const { isActive } = req.body;

  const user = await User.findById(req.params.id);
  if (!user) {
    throw AppError.notFound('User not found.');
  }

  // Requirement 6: Cannot deactivate yourself
  if (req.user.id === user._id.toString() && isActive === false) {
    throw AppError.forbidden('You cannot deactivate your own administrator account.');
  }

  // Requirement 6: Cannot deactivate the last active admin
  if (user.role === 'admin' && isActive === false) {
    const activeAdminCount = await User.countDocuments({ role: 'admin', isActive: true });
    if (activeAdminCount <= 1) {
      throw AppError.conflict('Cannot deactivate the last active administrator account.');
    }
  }

  user.isActive = isActive;
  await user.save();

  // Requirement 6: Deactivating a doctor user also deactivates the doctor profile
  if (user.role === 'doctor') {
    await Doctor.findOneAndUpdate({ userId: user._id }, { isActive });
  }

  return res.json({
    success: true,
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive
    }
  });
});

// GET /api/admin/appointments (Paginated)
const getAllAppointments = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 20 } = req.query;
  const pageNum = Number(page);
  const limitNum = Number(limit);
  const skip = (pageNum - 1) * limitNum;

  const total = await Appointment.countDocuments();
  const appointments = await Appointment.find()
    .populate({ path: 'patientId', populate: { path: 'userId', select: 'name email' } })
    .populate({ path: 'doctorId', populate: [{ path: 'userId', select: 'name email' }, { path: 'specializationId', select: 'name' }] })
    .sort({ appointmentDate: -1, startTime: 1 })
    .skip(skip)
    .limit(limitNum);

  return res.json({
    success: true,
    data: appointments,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1
    }
  });
});

// DELETE /api/admin/users/:id (Admin deletes user account except self and last active admin)
const deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    throw AppError.notFound('User not found.');
  }

  // Cannot delete yourself
  if (req.user.id === user._id.toString()) {
    throw AppError.forbidden('You cannot delete your own administrator account.');
  }

  // Cannot delete the last active admin
  if (user.role === 'admin') {
    const activeAdminCount = await User.countDocuments({ role: 'admin', isActive: true });
    if (activeAdminCount <= 1) {
      throw AppError.conflict('Cannot delete the last active administrator account.');
    }
  }

  // Delete doctor or patient profile if present
  if (user.role === 'doctor') {
    await Doctor.deleteMany({ userId: user._id });
  } else if (user.role === 'patient') {
    await Patient.deleteMany({ userId: user._id });
  }

  await User.findByIdAndDelete(user._id);

  return res.json({
    success: true,
    message: `User ${user.email} deleted successfully.`
  });
});

module.exports = {
  getDashboardMetrics,
  getUsers,
  updateUserStatus,
  deleteUser,
  getAllAppointments
};
