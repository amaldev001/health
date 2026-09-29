const { z } = require('zod');
const mongoose = require('mongoose');

// Helper to validate MongoDB ObjectId
const objectIdSchema = z.string().trim().refine(
  val => mongoose.Types.ObjectId.isValid(val),
  { message: 'Invalid ObjectId format' }
);

// Helper for pagination query parameters
const paginationSchema = z.object({
  page: z.preprocess(
    val => (val !== undefined && val !== null ? Number(val) : 1),
    z.number().int().min(1, 'Page must be >= 1').default(1)
  ),
  limit: z.preprocess(
    val => (val !== undefined && val !== null ? Number(val) : 20),
    z.number().int().min(1, 'Limit must be >= 1').max(100, 'Limit cannot exceed 100').default(20)
  )
});

// Helper for HH:mm time validation
const timeStringSchema = z.string().trim().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be formatted as HH:mm (00:00 - 23:59)');

// Helper for YYYY-MM-DD date validation
const dateStringSchema = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD');

/**
 * Middleware factory to validate req.body, req.query, and req.params against Zod schemas.
 * Rejects unknown fields (.strip()) and non-string inputs where strings are expected (blocking NoSQL injection).
 */
const validate = ({ body, query, params } = {}) => {
  return (req, res, next) => {
    try {
      if (params) {
        req.params = params.strip().parse(req.params);
      }
      if (query) {
        req.query = query.strip().parse(req.query);
      }
      if (body) {
        req.body = body.strip().parse(req.body);
      }
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors = err.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }));

        const detailedMessage = fieldErrors.length > 0
          ? fieldErrors.map(e => (e.field ? `${e.field}: ${e.message}` : e.message)).join(' | ')
          : 'Invalid input parameters.';

        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: detailedMessage,
            details: fieldErrors
          }
        });
      }
      next(err);
    }
  };
};

module.exports = {
  objectIdSchema,
  paginationSchema,
  timeStringSchema,
  dateStringSchema,
  validate
};
