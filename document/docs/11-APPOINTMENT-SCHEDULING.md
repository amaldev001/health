# Appointment Scheduling Specification

## 1. Core Principles & Configuration (D1, D7, D12)
- **Slot Duration**: 30 minutes, with no buffer time (D1).
- **Booking Window**: Bookable from current time up to 60 days in advance (D1).
- **Timezone Model**: Single clinic timezone specified via environment variable `CLINIC_TIMEZONE` (default `Asia/Kolkata`). `appointmentDate` is stored as a String `"YYYY-MM-DD"` in that timezone (D7). Start and end times are stored as strings `"HH:mm"` in that timezone.
- **Doctor Schedule**: Weekly recurring availability schedule only (0 = Sunday to 6 = Saturday). No doctor leave or holiday exceptions in v1 (D12).
- **Authority**: The server is the sole authority for slot availability and state machine transitions.

## 2. Booking Flow (D2, D14)
1. Patient authenticates.
2. Patient selects doctor and target date `"YYYY-MM-DD"`.
3. Client requests available slots via `GET /api/doctors/:id/available-slots?date=YYYY-MM-DD`.
4. Server generates 30-minute candidate slots from doctor availability and excludes slots with active appointments (`scheduled` or `confirmed`).
5. Patient selects an available slot.
6. Client submits `POST /api/appointments`.
7. Server validates slot availability and enforces unique index `{ doctorId, appointmentDate, startTime }` for active statuses.
8. Appointment is created in `scheduled` status (D2).
9. In-app notifications are generated for Doctor and Patient (D5).

*(Note: Admin cannot book appointments D14)*

## 3. Double Booking Prevention
Double booking is prevented at both the application layer (atomic check) and database layer via a unique partial index on `appointments`: `{ doctorId: 1, appointmentDate: 1, startTime: 1 }` with partial filter expression `{ status: { $in: ["scheduled", "confirmed"] } }`.

## 4. No Rescheduling in v1 (D4)
Rescheduling is NOT supported in v1. Patients or doctors wishing to change appointment time must cancel the existing appointment and book a new slot. Endpoints `PUT /appointments/:id` and `DELETE /appointments/:id` are removed (D4).

## 5. Cancellation Rules (D3)
- **Patient**: May cancel an appointment ONLY 24 hours or more before the appointment start time (`startTime` on `appointmentDate`).
- **Doctor (own)**: May cancel any time before the appointment is completed.
- **Admin**: May cancel any time before the appointment is completed.

---

## 6. Appointment State Machine

| From State | To State | Trigger / Who & Condition |
|---|---|---|
| `scheduled` | `confirmed` | Doctor (own), Admin |
| `scheduled` | `cancelled` | Patient (own, >=24h rule D3), Doctor (own), Admin |
| `confirmed` | `cancelled` | Patient (own, >=24h rule D3), Doctor (own), Admin |
| `confirmed` | `completed` | Doctor (own), Admin (only at or after appointment start time) |
| `confirmed` | `no_show` | Doctor (own), Admin (only at or after appointment start time) |
| `completed` | *terminal* | No further transitions allowed |
| `cancelled` | *terminal* | No further transitions allowed |
| `no_show` | *terminal* | No further transitions allowed |
