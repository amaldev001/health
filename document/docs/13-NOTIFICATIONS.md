# Notification Specification

## 1. Scope (D5, D11)
- **In-App Notifications Only**: Notifications are delivered exclusively via the in-app notification center (D5).
- **No Reminders in v1**: Scheduled reminders are excluded from v1 (D5).
- **No External Channels**: Email, SMS, WhatsApp, and Push notifications are explicitly excluded from v1 (D11).

## 2. Notification Events (D5)
In-app notifications are generated automatically upon the following 5 system events:
1. `booked` — Appointment booked by patient.
2. `confirmed` — Appointment confirmed by doctor or admin.
3. `cancelled` — Appointment cancelled by patient, doctor, or admin.
4. `completed` — Appointment marked as completed.
5. `no_show` — Appointment marked as no_show.

## 3. Notification Schema & Properties
- `userId` (ObjectId, ref: User, required)
- `title` (String, required)
- `message` (String, required)
- `type` (String, enum: `["appointment", "medical_record", "system"]`)
- `isRead` (Boolean, default: false)
- `createdAt` (Date)
