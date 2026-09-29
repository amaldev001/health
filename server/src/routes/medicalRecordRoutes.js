const express = require('express');
const router = express.Router();
const medicalRecordController = require('../controllers/medicalRecordController');
const { authenticateToken, verifyOrigin } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');
const { validate } = require('../validators/commonValidator');
const {
  createMedicalRecordSchema,
  updateMedicalRecordSchema,
  medicalRecordIdParamSchema,
  paginationSchema
} = require('../validators/medicalRecordValidator');

router.use(verifyOrigin);

router.post('/', authenticateToken, authorizeRoles('doctor'), validate({ body: createMedicalRecordSchema }), medicalRecordController.createMedicalRecord);
router.get('/', authenticateToken, authorizeRoles('patient', 'doctor'), validate({ query: paginationSchema }), medicalRecordController.getMedicalRecords);
router.get('/:id', authenticateToken, authorizeRoles('patient', 'doctor'), validate({ params: medicalRecordIdParamSchema }), medicalRecordController.getMedicalRecordById);
router.put('/:id', authenticateToken, authorizeRoles('doctor'), validate({ params: medicalRecordIdParamSchema, body: updateMedicalRecordSchema }), medicalRecordController.updateMedicalRecord);

module.exports = router;
