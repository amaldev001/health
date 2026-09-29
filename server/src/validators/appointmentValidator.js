const { z } = require('zod');
const { objectIdSchema, dateStringSchema, timeStringSchema, paginationSchema } = require('./commonValidator');

const createAppointmentSchema = z.object({
  doctorId: objectIdSchema,
  appointmentDate: dateStringSchema,
  startTime: timeStringSchema,
  reason: z.string().trim().min(1, 'Reason for appointment is required').max(500, 'Reason cannot exceed 500 characters'),
  notes: z.string().trim().max(1000, 'Notes cannot exceed 1000 characters').optional()
});

const getAppointmentsQuerySchema = z.object({
  status: z.enum(['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show']).optional(),
  from: dateStringSchema.optional(),
  to: dateStringSchema.optional(),
  page: z.preprocess(val => (val !== undefined && val !== null ? Number(val) : 1), z.number().int().min(1).default(1)),
  limit: z.preprocess(val => (val !== undefined && val !== null ? Number(val) : 20), z.number().int().min(1).max(100).default(20))
});

const updateAppointmentStatusSchema = z.object({
  status: z.enum(['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'], {
    errorMap: () => ({ message: 'Status must be one of: scheduled, confirmed, completed, cancelled, no_show' })
  })
});

const appointmentIdParamSchema = z.object({
  id: objectIdSchema
});

module.exports = {
  createAppointmentSchema,
  getAppointmentsQuerySchema,
  updateAppointmentStatusSchema,
  appointmentIdParamSchema
};
