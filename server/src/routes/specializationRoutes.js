const express = require('express');
const router = express.Router();
const specializationController = require('../controllers/specializationController');
const { authenticateToken, verifyOrigin } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');
const { validate } = require('../validators/commonValidator');
const {
  createSpecializationSchema,
  updateSpecializationSchema,
  specializationIdParamSchema
} = require('../validators/specializationValidator');

router.use(verifyOrigin);

router.get('/', specializationController.getSpecializations);
router.post('/', authenticateToken, authorizeRoles('admin'), validate({ body: createSpecializationSchema }), specializationController.createSpecialization);
router.put('/:id', authenticateToken, authorizeRoles('admin'), validate({ params: specializationIdParamSchema, body: updateSpecializationSchema }), specializationController.updateSpecialization);
router.delete('/:id', authenticateToken, authorizeRoles('admin'), validate({ params: specializationIdParamSchema }), specializationController.deleteSpecialization);

module.exports = router;
