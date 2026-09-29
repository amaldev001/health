const { z } = require('zod');
const { objectIdSchema, paginationSchema } = require('./commonValidator');

const userIdParamSchema = z.object({
  id: objectIdSchema
});

const updateUserStatusSchema = z.object({
  isActive: z.boolean({
    required_error: 'isActive boolean is required',
    invalid_type_error: 'isActive must be a boolean'
  })
});

const getNotificationsQuerySchema = z.object({
  page: z.preprocess(val => (val !== undefined && val !== null ? Number(val) : 1), z.number().int().min(1).default(1)),
  limit: z.preprocess(val => (val !== undefined && val !== null ? Number(val) : 20), z.number().int().min(1).max(100).default(20))
});

const notificationIdParamSchema = z.object({
  id: objectIdSchema
});

module.exports = {
  userIdParamSchema,
  updateUserStatusSchema,
  getNotificationsQuerySchema,
  notificationIdParamSchema
};
