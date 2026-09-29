# Decisions Register (Formerly Open Decisions)

All baseline decisions have been explicitly resolved by user mandate (D1–D19).

| ID | Subject | Impact | Status | Resolution / Decision | Date |
|---|---|---|---|---|---|
| DEC-001 | Appointment slot duration? | Scheduling | Resolved (D1) | 30 minutes, no buffer time. Bookable up to 60 days in advance. | 2026-09-19 |
| DEC-002 | Booking confirmation flow? | Appointment workflow | Resolved (D2) | Bookings start in `scheduled`. Doctor (own) or Admin confirms. | 2026-09-19 |
| DEC-003 | Cancellation cutoff? | Appointment workflow | Resolved (D3) | Patients >= 24h before start. Doctor/Admin any time before completion. | 2026-09-19 |
| DEC-004 | Rescheduling behavior? | Data model / API | Resolved (D4) | No rescheduling in v1 (cancel & rebook). `PUT/DELETE` endpoints removed. | 2026-09-19 |
| DEC-005 | Reminder timing & provider? | Notifications | Resolved (D5) | No reminders in v1. In-app notifications for booked, confirmed, cancelled, completed, no_show. | 2026-09-19 |
| DEC-006 | Admin access to medical records? | Authorization / Privacy | Resolved (D6) | Admin can NOT read, create, or modify medical records. | 2026-09-19 |
| DEC-007 | Production timezone policy? | Scheduling | Resolved (D7) | Single clinic timezone from `CLINIC_TIMEZONE` (default `Asia/Kolkata`). `appointmentDate` as `"YYYY-MM-DD"`. | 2026-09-19 |
| DEC-008 | Medical record attachments? | Storage / Security | Resolved (D8) | No attachments in v1. Field removed from schema and API. | 2026-09-19 |
| DEC-009 | Password-reset provider? | Authentication | Resolved (D9) | No reset in v1. Removed reset endpoints/fields. Added `POST /auth/change-password`. | 2026-09-19 |
| DEC-010 | Production hosting provider? | Deployment | Resolved (D10) | Provider-neutral single deployable (Express serves client). Dockerfile + compose provided. | 2026-09-19 |
| DEC-011 | Email / SMS / Push notifications? | Notifications | Resolved (D11) | No email, SMS, or push in v1. In-app notifications only. | 2026-09-19 |
| DEC-012 | Doctor leave / holiday exceptions? | Scheduling | Resolved (D12) | No leave/holiday exceptions in v1. Recurring weekly schedule only. | 2026-09-19 |
