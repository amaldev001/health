const jwt = require('jsonwebtoken');
const argon2 = require('argon2');
const { z } = require('zod');

const env = require('../config/env');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');

// Pre-computed dummy Argon2 hash for constant-time comparison on unknown emails
let DUMMY_ARGON2_HASH;
(async () => {
  DUMMY_ARGON2_HASH = await argon2.hash('DummyPasswordForConstantTimeVerification123!');
})();

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address format').toLowerCase().trim(),
  password: z.string().min(10, 'Password must be between 10 and 128 characters').max(128, 'Password must be between 10 and 128 characters'),
  phone: z.string().optional(),
  gender: z.enum(['Male', 'Female', 'Other', 'Prefer not to say']).optional(),
  dateOfBirth: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address format').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required')
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(10, 'New password must be between 10 and 128 characters').max(128, 'New password must be between 10 and 128 characters')
});

const setAuthCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 1 day (D16)
  });
};

// POST /api/auth/register (Registers Patient account D13)
const register = async (req, res, next) => {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid registration input.',
          details: parseResult.error.errors
        }
      });
    }

    const { name, email, password, phone, gender, dateOfBirth } = parseResult.data;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: { code: 'CONFLICT', message: 'Email address is already registered.' }
      });
    }

    const passwordHash = await User.hashPassword(password);

    let user;
    try {
      user = await User.create({
        name,
        email,
        passwordHash,
        role: 'patient',
        isActive: true
      });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({
          success: false,
          error: { code: 'CONFLICT', message: 'Email address is already registered.' }
        });
      }
      throw err;
    }

    // Create Patient Profile with compensating cleanup on failure
    try {
      const patient = await Patient.create({
        userId: user._id,
        phone: phone || '',
        gender: gender || 'Prefer not to say',
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined
      });

      const token = jwt.sign({ id: user._id }, env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '1d' });
      setAuthCookie(res, token);

      return res.status(201).json({
        success: true,
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            mustChangePassword: user.mustChangePassword,
            patientId: patient._id
          }
        }
      });
    } catch (patErr) {
      // Compensating cleanup: remove created user if profile fails
      await User.findByIdAndDelete(user._id);
      throw patErr;
    }
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid login input.',
          details: parseResult.error.errors
        }
      });
    }

    const { email, password } = parseResult.data;

    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) {
      // Constant-time execution for unknown emails
      if (DUMMY_ARGON2_HASH) {
        await argon2.verify(DUMMY_ARGON2_HASH, password).catch(() => {});
      }
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' }
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' }
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Your account has been deactivated.' }
      });
    }

    let patientId = null;
    let doctorId = null;

    if (user.role === 'patient') {
      const patient = await Patient.findOne({ userId: user._id });
      if (patient) patientId = patient._id;
    } else if (user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: user._id });
      if (doctor) doctorId = doctor._id;
    }

    const token = jwt.sign({ id: user._id }, env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '1d' });
    setAuthCookie(res, token);

    return res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          mustChangePassword: user.mustChangePassword,
          patientId,
          doctorId
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/logout
const logout = async (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  return res.json({
    success: true,
    message: 'Logged out successfully.'
  });
};

// GET /api/auth/me
const me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found.' }
      });
    }

    let patientProfile = null;
    let doctorProfile = null;

    if (user.role === 'patient') {
      patientProfile = await Patient.findOne({ userId: user._id });
    } else if (user.role === 'doctor') {
      doctorProfile = await Doctor.findOne({ userId: user._id }).populate('specializationId');
    }

    return res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          mustChangePassword: user.mustChangePassword,
          isActive: user.isActive
        },
        patientProfile,
        doctorProfile
      }
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/change-password (D9)
const changePassword = async (req, res, next) => {
  try {
    const parseResult = changePasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid password change input.',
          details: parseResult.error.errors
        }
      });
    }

    const { currentPassword, newPassword } = parseResult.data;

    const user = await User.findById(req.user.id).select('+passwordHash');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found.' }
      });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Current password is incorrect.' }
      });
    }

    user.passwordHash = await User.hashPassword(newPassword);
    user.mustChangePassword = false;
    await user.save();

    return res.json({
      success: true,
      message: 'Password changed successfully.'
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  logout,
  me,
  changePassword
};
