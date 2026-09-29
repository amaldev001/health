const { z } = require('zod');
const { objectIdSchema } = require('./commonValidator');

// Helper for availability window validation (D14, Requirement 7)
const availabilityWindowSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().trim().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be formatted as HH:mm'),
  endTime: z.string().trim().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be formatted as HH:mm')
}).refine(data => {
  const [sH, sM] = data.startTime.split(':').map(Number);
  const [eH, eM] = data.endTime.split(':').map(Number);
  const startMins = sH * 60 + sM;
  const endMins = eH * 60 + eM;
  return startMins < endMins;
}, { message: 'startTime must be strictly before endTime', path: ['startTime'] })
.refine(data => {
  const [sH, sM] = data.startTime.split(':').map(Number);
  const [eH, eM] = data.endTime.split(':').map(Number);
  return sM % 30 === 0 && eM % 30 === 0;
}, { message: 'startTime and endTime must be aligned to 30-minute intervals', path: ['startTime'] });

// Array of availability windows per doctor per day
const updateAvailabilityBodySchema = z.object({
  availability: z.array(availabilityWindowSchema)
    .max(21, 'Cannot exceed 21 windows total across the week')
    .refine(windows => {
      // Validate max 3 windows per day and no overlapping windows on the same day
      const byDay = {};
      for (const w of windows) {
        if (!byDay[w.dayOfWeek]) byDay[w.dayOfWeek] = [];
        byDay[w.dayOfWeek].push(w);
      }

      for (const day in byDay) {
        const dayWins = byDay[day];
        if (dayWins.length > 3) {
          return false; // Max 3 windows per day
        }
        // Sort by start time and check overlaps
        dayWins.sort((a, b) => a.startTime.localeCompare(b.startTime));
        for (let i = 0; i < dayWins.length - 1; i++) {
          if (dayWins[i].endTime > dayWins[i + 1].startTime) {
            return false; // Overlap detected
          }
        }
      }
      return true;
    }, { message: 'Schedules must have no overlapping windows and maximum 3 windows per day.' })
});

const getDoctorsQuerySchema = z.object({
  specializationId: objectIdSchema.optional(),
  search: z.string().trim().max(100).optional(),
  includeInactive: z.preprocess(
    val => (val === 'true' || val === true),
    z.boolean().optional().default(false)
  ),
  page: z.preprocess(val => (val !== undefined && val !== null ? Number(val) : 1), z.number().int().min(1).default(1)),
  limit: z.preprocess(val => (val !== undefined && val !== null ? Number(val) : 20), z.number().int().min(1).max(100).default(20))
});

const doctorIdParamSchema = z.object({
  id: objectIdSchema
});

const availableSlotsQuerySchema = z.object({
  date: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD')
});

const createDoctorBodySchema = z.object({
  name: z.string({ required_error: 'Full name is required' }).trim().min(2, 'Name must be at least 2 characters').max(100, 'Name cannot exceed 100 characters'),
  email: z.string({ required_error: 'Email address is required' }).trim().email('Invalid email address format').max(255).transform(val => val.toLowerCase()),
  password: z.string({ required_error: 'Password is required' }).min(10, 'Password must be between 10 and 128 characters').max(128, 'Password must be between 10 and 128 characters'),
  specializationId: objectIdSchema,
  qualification: z.string({ required_error: 'Qualification is required' }).trim().min(1, 'Qualification is required').max(200, 'Qualification cannot exceed 200 characters'),
  experience: z.preprocess(val => (val !== undefined && val !== null && val !== '' ? Number(val) : 0), z.number().min(0, 'Experience must be 0 or greater')),
  consultationFee: z.preprocess(val => (val !== undefined && val !== null && val !== '' ? Number(val) : 0), z.number().min(0, 'Consultation fee must be 0 or greater')),
  phone: z.string().trim().max(30).optional().default(''),
  bio: z.string().trim().max(1000).optional().default('')
});

module.exports = {
  createDoctorBodySchema,
  updateAvailabilityBodySchema,
  getDoctorsQuerySchema,
  doctorIdParamSchema,
  availableSlotsQuerySchema
};
