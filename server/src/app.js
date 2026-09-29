const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

const env = require('./config/env');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');

// Import Route Handlers
const authRoutes = require('./routes/authRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const patientRoutes = require('./routes/patientRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const medicalRecordRoutes = require('./routes/medicalRecordRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const specializationRoutes = require('./routes/specializationRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Trust Proxy for Rate Limiting / Load Balancers
app.set('trust proxy', 1);

// Request Logger & Correlation ID Middleware (Requirement 3)
app.use(requestLogger);

// Security & Parsing Middlewares
app.use(helmet());
app.use(cors({
  origin: env.FRONTEND_ORIGIN,
  credentials: true
}));
app.use(cookieParser());
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Global Rate Limiter
const globalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests, please try again later.'
    }
  }
});
app.use('/api', globalApiLimiter);

// Health Check Endpoint (Verifies DB connection)
app.get('/api/health', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  if (!isDbConnected) {
    return res.status(503).json({
      success: false,
      status: 'UNHEALTHY',
      error: { code: 'DATABASE_DISCONNECTED', message: 'Database connection inactive.' },
      requestId: req.requestId
    });
  }
  res.json({
    success: true,
    status: 'OK',
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

// Public Clinic Configuration Endpoint (D18, Requirement 6: GET /config)
app.get('/api/config', (req, res) => {
  res.json({
    success: true,
    data: {
      clinicName: env.CLINIC_NAME,
      phone: env.CLINIC_PHONE,
      address: env.CLINIC_ADDRESS,
      hours: env.CLINIC_HOURS,
      emergencyPhone: env.EMERGENCY_NUMBER,
      currency: env.CURRENCY,
      timezone: env.CLINIC_TIMEZONE,
      slotMinutes: 30,
      cancellationCutoffHours: 24,
      bookingWindowDays: 60
    },
    requestId: req.requestId
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/medical-records', medicalRecordRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/specializations', specializationRoutes);
app.use('/api/admin', adminRoutes);

// Serve client SPA static assets in production if client/dist exists
const path = require('path');
const fs = require('fs');
const clientDistPath = path.join(__dirname, '../../client/dist');

if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Global 404 Handler for API routes
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `API route ${req.originalUrl} not found.` },
    requestId: req.requestId
  });
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
