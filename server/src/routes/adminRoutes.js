const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, verifyOrigin } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');
const { validate, paginationSchema } = require('../validators/commonValidator');
const { userIdParamSchema, updateUserStatusSchema } = require('../validators/adminNotificationValidator');
const { getAppointmentsQuerySchema } = require('../validators/appointmentValidator');

router.use(verifyOrigin);

router.get('/dashboard', authenticateToken, authorizeRoles('admin'), adminController.getDashboardMetrics);
router.get('/users', authenticateToken, authorizeRoles('admin'), validate({ query: paginationSchema }), adminController.getUsers);
router.patch('/users/:id/status', authenticateToken, authorizeRoles('admin'), validate({ params: userIdParamSchema, body: updateUserStatusSchema }), adminController.updateUserStatus);
router.delete('/users/:id', authenticateToken, authorizeRoles('admin'), validate({ params: userIdParamSchema }), adminController.deleteUser);
router.get('/appointments', authenticateToken, authorizeRoles('admin'), validate({ query: getAppointmentsQuerySchema }), adminController.getAllAppointments);

module.exports = router;
