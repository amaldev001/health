# Testing and QA Specification

## 1. Test Stack & Tools
- **Backend Testing**: `jest`, `supertest`
- **Frontend Testing**: `vitest`, `@testing-library/react`, `@testing-library/user-event`, `jsdom`
- **Linting & Formatting**: `eslint`, `prettier`

## 2. Test Suites & Critical Test Cases

### Suite A: Authentication & Onboarding
1. **Fresh Install `create-admin` Script**: Verifies missing environment variable refusal, Argon2 password creation, and duplicate run handling (D13).
2. **Argon2 Password Hashing**: Verifies 10-128 character policy and Argon2 hash verification (D16).
3. **httpOnly Cookie Auth**: Verifies token storage in httpOnly cookie and clearance on `POST /auth/logout` (D16).
4. **CSRF Origin Check**: Verifies unsafe HTTP methods (`POST`, `PUT`, `PATCH`, `DELETE`) without matching `Origin` header are rejected with `403 FORBIDDEN` (D16).
5. **Doctor Onboarding (`mustChangePassword`)**: Verifies admin-created doctor account gets `mustChangePassword=true` (D17).
6. **Password Change**: Verifies `POST /auth/change-password` with valid current password updates credential and clears `mustChangePassword` (D9).

### Suite B: Clinic Config & Public Endpoints
1. `GET /api/config` returns correct environment configuration parameters (D18).

### Suite C: Appointment Scheduling & State Machine
1. **Dynamic 30-min Slot Calculation**: Verifies 30-min slots generated without buffer for candidate dates (D1).
2. **60-Day Booking Window Boundary**: Verifies bookings > 60 days in advance are rejected with `409 CONFLICT` (D1).
3. **Double Booking Prevention**: Verifies atomic & database unique partial index rejection on conflicting slots (D1).
4. **Initial Status**: Verifies new bookings are created as `scheduled` (D2).
5. **Patient 24h Cancellation Rule**: Verifies patient cancellation < 24h before start time returns `403 FORBIDDEN` (D3).
6. **Doctor / Admin Cancellation**: Verifies doctor or admin can cancel any time before appointment completion (D3).
7. **Reschedule Removal**: Verifies `PUT /appointments/:id` and `DELETE /appointments/:id` return `404 NOT_FOUND` (D4).
8. **State Machine Transitions**: Verifies valid transitions (`scheduled` -> `confirmed` -> `completed` / `cancelled` / `no_show`) and rejects invalid transitions.

### Suite D: Medical Records & Clinical Data Privacy
1. **Admin Access Rejection**: Verifies Admin attempting to read, create, or modify medical records receives `403 FORBIDDEN` (D6).
2. **One Record per Appointment**: Verifies unique index prevents creating multiple medical records for the same appointment (D19).
3. **Creation Eligibility**: Verifies record creation allowed only when appointment status is `confirmed` or `completed` (D19).
4. **Author Edit Restriction**: Verifies only authoring doctor can edit record (D19).
5. **Clinical Relationship Scope**: Verifies doctor can view records & limited patient profiles (no address) ONLY for clinical relations (D15).
6. **Attachments Removed**: Verifies `attachments` field is ignored/not accepted (D8).

### Suite E: Notifications
1. Verifies in-app notifications generated for events: `booked`, `confirmed`, `cancelled`, `completed`, `no_show` (D5).

---

## 4. Test Execution Commands

```bash
# Run full suite (Backend + Frontend)
npm test

# Run backend tests only (Jest + mongodb-memory-server)
npm run test:server

# Run frontend tests only (Vitest + Testing Library)
npm run test:client
```

---

## 5. Manual End-to-End (E2E) QA Verification Checklist

### Flow 1: Patient Registration & Booking
1. [x] Navigate to `/register` and create a new patient account.
2. [x] Verify redirection to `/patient/dashboard` and presence of authentication cookie.
3. [x] Browse `/doctors` list and view available 30-minute time slots.
4. [x] Select an available slot within the 60-day window and click **Book Appointment**.
5. [x] Confirm appointment appears on Patient Dashboard as status `scheduled`.

### Flow 2: Doctor Onboarding & Appointment Lifecycle
1. [x] Log in as Admin (`/login`) and create a new Doctor account at `/admin/dashboard`.
2. [x] Log out and log in as the newly created Doctor.
3. [x] Verify forced redirection to `/change-password` (`mustChangePassword=true`).
4. [x] Change password and verify redirect to `/doctor/dashboard`.
5. [x] View appointment request from Flow 1 and click **Confirm Appointment** (status changes to `confirmed`).
6. [x] Create a Medical Record for the completed appointment.
7. [x] Mark appointment as `completed`.

### Flow 3: Patient Cancellation & 24h Restriction
1. [x] Log in as Patient and view a `scheduled` or `confirmed` appointment > 24 hours away.
2. [x] Click **Cancel Appointment** and verify status changes to `cancelled`.
3. [x] Attempt to cancel an appointment starting in < 24 hours — verify button is disabled or returns error.

### Flow 4: Security & Error Handling Verification
1. [x] Attempt to access `/admin/dashboard` while logged in as a Patient — verify redirect to Patient Dashboard.
2. [x] Attempt Admin access to medical record endpoints — verify 403 Forbidden.
3. [x] Trigger invalid route `/api/invalid-route` — verify structured JSON error response with `X-Request-Id`.

