const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const medicalRecordController = require('../controllers/medicalRecordController');
const { authenticateToken, verifyOrigin } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');
const { validate, paginationSchema } = require('../validators/commonValidator');
const {
  getPatientsQuerySchema,
  patientIdParamSchema,
  updatePatientSchema
} = require('../validators/patientValidator');

router.use(verifyOrigin);

router.get('/', authenticateToken, authorizeRoles('admin'), validate({ query: getPatientsQuerySchema }), patientController.getAllPatients);
router.get('/:id', authenticateToken, validate({ params: patientIdParamSchema }), patientController.getPatientById);
router.put('/:id', authenticateToken, validate({ params: patientIdParamSchema, body: updatePatientSchema }), patientController.updatePatientProfile);
router.get('/:id/medical-records', authenticateToken, authorizeRoles('patient', 'doctor'), validate({ params: patientIdParamSchema, query: paginationSchema }), medicalRecordController.getPatientMedicalRecords);

module.exports = router;
