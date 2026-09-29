const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateToken, verifyOrigin } = require('../middleware/auth');
const { validate, paginationSchema } = require('../validators/commonValidator');
const { notificationIdParamSchema } = require('../validators/adminNotificationValidator');

router.use(verifyOrigin);

router.get('/', authenticateToken, validate({ query: paginationSchema }), notificationController.getNotifications);
router.patch('/read-all', authenticateToken, notificationController.markAllAsRead);
router.patch('/:id/read', authenticateToken, validate({ params: notificationIdParamSchema }), notificationController.markAsRead);

module.exports = router;
