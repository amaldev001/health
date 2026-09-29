const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const { getDayOfWeekForDateStr, validateBookingDate, getTodayInClinicTimezone, getCurrentTimeInClinicTimezone } = require('../utils/time');
const { AppError } = require('../utils/AppError');

/**
 * Calculates available 30-minute time slots for a given doctor on a specific YYYY-MM-DD date.
 * Uses CLINIC_TIMEZONE with calendar-date parsing (no UTC shifting).
 * Past slots on current clinic day are filtered out.
 */
const getAvailableSlotsForDoctor = async (doctorId, dateString) => {
  const doctor = await Doctor.findById(doctorId);
  if (!doctor || !doctor.isActive) {
    throw AppError.notFound('Doctor not found or inactive.');
  }

  const dateCheck = validateBookingDate(dateString);
  if (!dateCheck.valid) {
    throw AppError.validationError(dateCheck.message);
  }

  // Get Day of Week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const dayOfWeek = getDayOfWeekForDateStr(dateString);

  // Find availability rules for this day of week
  const daySchedule = (doctor.availability || []).filter(slot => slot.dayOfWeek === dayOfWeek);

  if (!daySchedule || daySchedule.length === 0) {
    return []; // No availability configured for this day
  }

  const todayInClinic = getTodayInClinicTimezone();
  const currentTimeInClinic = getCurrentTimeInClinicTimezone();
  const isToday = (dateString === todayInClinic);

  // Generate 30-minute candidate slots
  const candidateSlots = [];
  for (const window of daySchedule) {
    const [startH, startM] = window.startTime.split(':').map(Number);
    const [endH, endM] = window.endTime.split(':').map(Number);

    let currentMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    while (currentMinutes + 30 <= endMinutes) {
      const slotStartH = String(Math.floor(currentMinutes / 60)).padStart(2, '0');
      const slotStartM = String(currentMinutes % 60).padStart(2, '0');

      const nextMinutes = currentMinutes + 30;
      const slotEndH = String(Math.floor(nextMinutes / 60)).padStart(2, '0');
      const slotEndM = String(nextMinutes % 60).padStart(2, '0');

      const slotStartTime = `${slotStartH}:${slotStartM}`;
      const slotEndTime = `${slotEndH}:${slotEndM}`;

      // Requirement 7: Past slot logic in CLINIC_TIMEZONE
      const isPastSlot = isToday && (slotStartTime <= currentTimeInClinic);

      candidateSlots.push({
        startTime: slotStartTime,
        endTime: slotEndTime,
        isPast: isPastSlot
      });

      currentMinutes += 30;
    }
  }

  // Query existing booked active appointments for this doctor on dateString
  const existingAppointments = await Appointment.find({
    doctorId,
    appointmentDate: dateString,
    status: { $in: ['scheduled', 'confirmed'] }
  });

  const bookedStartTimes = new Set(existingAppointments.map(app => app.startTime));

  // Filter out booked slots and past slots
  const availableSlots = candidateSlots.map(slot => ({
    startTime: slot.startTime,
    endTime: slot.endTime,
    isAvailable: !bookedStartTimes.has(slot.startTime) && !slot.isPast
  }));

  return availableSlots;
};

module.exports = { getAvailableSlotsForDoctor };
