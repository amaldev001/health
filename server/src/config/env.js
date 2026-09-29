const dotenv = require('dotenv');
const { z } = require('zod');

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI environment variable is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET environment variable must be at least 32 characters long'),
  FRONTEND_ORIGIN: z.string().min(1, 'FRONTEND_ORIGIN environment variable is required'),
  CLINIC_TIMEZONE: z.string().default('Asia/Kolkata'),
  CLINIC_NAME: z.string().default('HealthPulse Care'),
  CLINIC_PHONE: z.string().default('+1 (555) 019-2831'),
  CLINIC_ADDRESS: z.string().default('100 Healthcare Way'),
  CLINIC_HOURS: z.string().default('Mon-Fri 08:00-18:00'),
  EMERGENCY_NUMBER: z.string().default('+1 (555) 911-0000'),
  CURRENCY: z.string().default('USD')
});

let env;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('\n❌ ENVIRONMENT CONFIGURATION ERROR:');
    error.errors.forEach(err => {
      console.error(` - [${err.path.join('.')}]: ${err.message}`);
    });
    console.error('Please check your environment variables and define all required parameters.\n');
  } else {
    console.error('Failed to parse environment variables:', error);
  }
  process.exit(1);
}

module.exports = env;
