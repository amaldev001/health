const { z } = require('zod');
const { objectIdSchema, paginationSchema } = require('./commonValidator');

const getPatientsQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  page: z.preprocess(val => (val !== undefined && val !== null ? Number(val) : 1), z.number().int().min(1).default(1)),
  limit: z.preprocess(val => (val !== undefined && val !== null ? Number(val) : 20), z.number().int().min(1).max(100).default(20))
});

const patientIdParamSchema = z.object({
  id: objectIdSchema
});

const updatePatientSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100).optional(),
  phone: z.string().trim().max(20).optional(),
  dateOfBirth: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'dateOfBirth must be YYYY-MM-DD').optional(),
  gender: z.enum(['Male', 'Female', 'Other', 'Prefer not to say']).optional(),
  address: z.string().trim().max(200).optional(),
  emergencyContact: z.object({
    name: z.string().trim().max(100).optional(),
    phone: z.string().trim().max(20).optional(),
    relationship: z.string().trim().max(50).optional()
  }).optional()
});

module.exports = {
  getPatientsQuerySchema,
  patientIdParamSchema,
  updatePatientSchema
};
