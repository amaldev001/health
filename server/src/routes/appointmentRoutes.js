const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { authenticateToken, verifyOrigin } = require('../middleware/auth');
const { validate } = require('../validators/commonValidator');
const {
  createAppointmentSchema,
  getAppointmentsQuerySchema,
  updateAppointmentStatusSchema,
  appointmentIdParamSchema
} = require('../validators/appointmentValidator');

router.use(verifyOrigin);

router.post('/', authenticateToken, validate({ body: createAppointmentSchema }), appointmentController.createAppointment);
router.get('/', authenticateToken, validate({ query: getAppointmentsQuerySchema }), appointmentController.getAppointments);
router.get('/:id', authenticateToken, validate({ params: appointmentIdParamSchema }), appointmentController.getAppointmentById);
router.patch('/:id/status', authenticateToken, validate({ params: appointmentIdParamSchema, body: updateAppointmentStatusSchema }), appointmentController.updateAppointmentStatus);

module.exports = router;
