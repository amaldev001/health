const appointmentService = require('../services/appointmentService');
const { catchAsync } = require('../utils/AppError');

// POST /api/appointments
const createAppointment = catchAsync(async (req, res, next) => {
  const { doctorId, appointmentDate, startTime, reason, notes } = req.body;

  const appointment = await appointmentService.createAppointment({
    user: req.user,
    doctorId,
    appointmentDate,
    startTime,
    reason,
    notes
  });

  return res.status(201).json({
    success: true,
    data: appointment
  });
});

// GET /api/appointments (Filters: status, from, to Requirement 6)
const getAppointments = catchAsync(async (req, res, next) => {
  const { status, from, to, page = 1, limit = 20 } = req.query;
  const result = await appointmentService.getAppointments({
    user: req.user,
    status,
    from,
    to,
    page: Number(page),
    limit: Number(limit)
  });

  return res.json({
    success: true,
    data: result.appointments,
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages
    }
  });
});

// GET /api/appointments/:id
const getAppointmentById = catchAsync(async (req, res, next) => {
  const appointment = await appointmentService.getAppointmentById({
    user: req.user,
    appointmentId: req.params.id
  });

  return res.json({
    success: true,
    data: appointment
  });
});

// PATCH /api/appointments/:id/status (State Machine Transition D2, D3, D4)
const updateAppointmentStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body;

  const appointment = await appointmentService.updateAppointmentStatus({
    user: req.user,
    appointmentId: req.params.id,
    newStatus: status
  });

  return res.json({
    success: true,
    data: appointment
  });
});

module.exports = {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointmentStatus
};
