const { z } = require('zod');
const { objectIdSchema, paginationSchema } = require('./commonValidator');

const createSpecializationSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name cannot exceed 100 characters'),
  description: z.string().trim().max(500, 'Description cannot exceed 500 characters').optional().default('')
});

const updateSpecializationSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  description: z.string().trim().max(500).optional(),
  isActive: z.boolean().optional()
});

const specializationIdParamSchema = z.object({
  id: objectIdSchema
});

module.exports = {
  createSpecializationSchema,
  updateSpecializationSchema,
  specializationIdParamSchema
};
