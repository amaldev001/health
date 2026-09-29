const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { authenticateToken, verifyOrigin } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');
const { validate } = require('../validators/commonValidator');
const {
  createDoctorBodySchema,
  getDoctorsQuerySchema,
  doctorIdParamSchema,
  updateAvailabilityBodySchema,
  availableSlotsQuerySchema
} = require('../validators/doctorValidator');

router.use(verifyOrigin);

router.get('/', validate({ query: getDoctorsQuerySchema }), doctorController.getDoctors);
router.get('/:id', validate({ params: doctorIdParamSchema }), doctorController.getDoctorById);
router.post('/', authenticateToken, authorizeRoles('admin'), validate({ body: createDoctorBodySchema }), doctorController.createDoctor);
router.put('/:id', authenticateToken, validate({ params: doctorIdParamSchema }), doctorController.updateDoctorProfile);

router.get('/:id/availability', validate({ params: doctorIdParamSchema }), doctorController.getDoctorAvailability);
router.put('/:id/availability', authenticateToken, validate({ params: doctorIdParamSchema, body: updateAvailabilityBodySchema }), doctorController.updateDoctorAvailability);
router.get('/:id/available-slots', validate({ params: doctorIdParamSchema, query: availableSlotsQuerySchema }), doctorController.getAvailableSlots);
router.get('/:id/patients', authenticateToken, authorizeRoles('doctor'), validate({ params: doctorIdParamSchema }), doctorController.getDoctorPatients);

module.exports = router;
