const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken, verifyOrigin } = require('../middleware/auth');
const { loginLimiter, registerLimiter } = require('../middleware/rateLimiters');

router.use(verifyOrigin);

router.post('/register', registerLimiter, authController.register);
router.post('/login', loginLimiter, authController.login);
router.post('/logout', authController.logout);
router.get('/me', authenticateToken, authController.me);
router.post('/change-password', authenticateToken, authController.changePassword);

module.exports = router;
