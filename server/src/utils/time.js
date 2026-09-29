const env = require('../config/env');

/**
 * Gets the current date string "YYYY-MM-DD" in CLINIC_TIMEZONE.
 */
const getTodayInClinicTimezone = () => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: env.CLINIC_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(new Date());
};

/**
 * Gets current "HH:mm" in CLINIC_TIMEZONE.
 */
const getCurrentTimeInClinicTimezone = () => {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: env.CLINIC_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  return formatter.format(new Date());
};

/**
 * Computes end time ("HH:mm") by adding 30 minutes to startTime ("HH:mm").
 */
const add30Minutes = (startTimeStr) => {
  const [hours, minutes] = startTimeStr.split(':').map(Number);
  let totalMins = hours * 60 + minutes + 30;
  const endH = String(Math.floor(totalMins / 60) % 24).padStart(2, '0');
  const endM = String(totalMins % 60).padStart(2, '0');
  return `${endH}:${endM}`;
};

/**
 * Validates whether dateStr "YYYY-MM-DD" is valid, not in past, and within 60 days ahead.
 */
const validateBookingDate = (dateStr) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return { valid: false, message: 'Date must be formatted as YYYY-MM-DD.' };
  }

  const todayStr = getTodayInClinicTimezone();
  if (dateStr < todayStr) {
    return { valid: false, message: 'Cannot book appointments in the past.' };
  }

  const todayDate = new Date(todayStr);
  const targetDate = new Date(dateStr);
  const diffDays = Math.ceil((targetDate - todayDate) / (1000 * 60 * 60 * 24));

  if (diffDays > 60) {
    return { valid: false, message: 'Appointments can only be booked up to 60 days in advance.' };
  }

  return { valid: true };
};

/**
 * Gets day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday) for "YYYY-MM-DD" date in clinic timezone.
 */
const getDayOfWeekForDateStr = (dateStr) => {
  // Add T00:00:00 to avoid UTC shifting
  const d = new Date(`${dateStr}T00:00:00`);
  return d.getDay();
};

module.exports = {
  getTodayInClinicTimezone,
  getCurrentTimeInClinicTimezone,
  add30Minutes,
  validateBookingDate,
  getDayOfWeekForDateStr
};
