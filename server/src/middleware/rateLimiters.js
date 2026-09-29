const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => {
    const email = req.body && req.body.email ? req.body.email.toLowerCase().trim() : '';
    return `${req.ip}_${email}`;
  },
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many login attempts. Please try again after 15 minutes.'
    }
  }
});

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skip: () => process.env.NODE_ENV === 'test',
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many account registrations from this IP. Please try again later.'
    }
  }
});

module.exports = { loginLimiter, registerLimiter };
