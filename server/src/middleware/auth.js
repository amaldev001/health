const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');

const authenticateToken = async (req, res, next) => {
  try {
    const token = req.cookies ? req.cookies.token : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required. Please log in.'
        }
      });
    }

    // Pin JWT algorithm to HS256
    const decoded = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'User account is inactive or no longer exists.'
        }
      });
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      mustChangePassword: user.mustChangePassword
    };

    // If mustChangePassword is true, block every route except /auth/me, /auth/logout, and /auth/change-password
    if (user.mustChangePassword) {
      const allowedPaths = ['/api/auth/me', '/api/auth/logout', '/api/auth/change-password'];
      if (!allowedPaths.includes(req.baseUrl + req.path) && !allowedPaths.includes(req.originalUrl)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'MUST_CHANGE_PASSWORD',
            message: 'You must change your initial password before accessing other features.'
          }
        });
      }
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Invalid or expired authentication token.'
      }
    });
  }
};

// Origin Check Middleware for CSRF Protection on unsafe HTTP methods (D16)
const verifyOrigin = (req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const origin = req.headers.origin;
    if (env.NODE_ENV === 'production' && origin && origin !== env.FRONTEND_ORIGIN) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Cross-origin request rejected.'
        }
      });
    }
  }
  next();
};

module.exports = { authenticateToken, verifyOrigin };
