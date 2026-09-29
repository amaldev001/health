const { z } = require('zod');
const { objectIdSchema, paginationSchema } = require('./commonValidator');

const createMedicalRecordSchema = z.object({
  patientId: objectIdSchema,
  appointmentId: objectIdSchema,
  diagnosis: z.string().trim().min(1, 'Diagnosis is required').max(500, 'Diagnosis cannot exceed 500 characters'),
  symptoms: z.string().trim().max(1000, 'Symptoms cannot exceed 1000 characters').optional().default(''),
  treatment: z.string().trim().max(1000, 'Treatment cannot exceed 1000 characters').optional().default(''),
  prescription: z.string().trim().max(1000, 'Prescription cannot exceed 1000 characters').optional().default(''),
  notes: z.string().trim().max(1000, 'Notes cannot exceed 1000 characters').optional().default('')
});

const updateMedicalRecordSchema = z.object({
  diagnosis: z.string().trim().min(1).max(500).optional(),
  symptoms: z.string().trim().max(1000).optional(),
  treatment: z.string().trim().max(1000).optional(),
  prescription: z.string().trim().max(1000).optional(),
  notes: z.string().trim().max(1000).optional()
});

const medicalRecordIdParamSchema = z.object({
  id: objectIdSchema
});

module.exports = {
  createMedicalRecordSchema,
  updateMedicalRecordSchema,
  medicalRecordIdParamSchema,
  paginationSchema
};
