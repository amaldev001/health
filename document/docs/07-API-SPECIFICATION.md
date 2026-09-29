# REST API Specification

**Base path:** `/api`

---

## Standard Pagination Contract

All collection listing endpoints (`GET /doctors`, `GET /patients`, `GET /appointments`, `GET /medical-records`, `GET /notifications`, `GET /admin/users`) support standard pagination query parameters:
- `page` (Integer, default: 1, min: 1)
- `limit` (Integer, default: 20, min: 1, max: 100)

**Standard Paginated Success Response Wrapper:**
```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3
  }
}
```

---

## Standard Error Response Contract

Error codes are standardized to match `14-VALIDATION-ERROR-HANDLING.md`:
- `VALIDATION_ERROR` (400 Bad Request)
- `AUTHENTICATION_REQUIRED` (401 Unauthorized)
- `INVALID_CREDENTIALS` (401 Unauthorized)
- `FORBIDDEN` (403 Forbidden)
- `NOT_FOUND` (404 Not Found)
- `CONFLICT` (409 Conflict - e.g. slot unavailable, duplicate email/name)
- `RATE_LIMITED` (429 Too Many Requests)
- `INTERNAL_ERROR` (500 Internal Server Error)

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input parameters.",
    "details": [
      { "field": "email", "message": "Invalid email address format." }
    ]
  },
  "requestId": "req-1726770000000-a1b2c"
}
```

---

## Public & System Configuration

### `GET /config`
- **Description**: Returns public clinic parameters (D18). No authentication required.
- **Request Query**: None
- **Request Body**: None
- **Success Response** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "clinicName": "HealthPulse Care",
      "phone": "+1 (555) 019-2831",
      "address": "100 Healthcare Way",
      "hours": "Mon-Fri 08:00-18:00",
      "emergencyPhone": "+1 (555) 911-0000",
      "currency": "USD",
      "timezone": "Asia/Kolkata",
      "slotDurationMinutes": 30,
      "cancellationCutoffHours": 24,
      "bookingWindowDays": 60
    }
  }
  ```

---

## Authentication

### `POST /auth/register`
- **Description**: Self-registration for Patient accounts only (D13). Sets `httpOnly` JWT cookie (D16).
- **Request Body**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "Password123!",
    "phone": "+15551234567",
    "gender": "Female",
    "dateOfBirth": "1994-05-12"
  }
  ```
- **Success Response** (201 Created): Sets `token` cookie.
  ```json
  {
    "success": true,
    "data": {
      "user": { "id": "60d...", "name": "Jane Doe", "email": "jane@example.com", "role": "patient" },
      "patientProfile": { "_id": "60d...", "phone": "+15551234567" }
    }
  }
  ```
- **Error Codes**: `VALIDATION_ERROR` (400), `CONFLICT` (409).

### `POST /auth/login`
- **Description**: Authenticates user and sets 1-day `httpOnly` JWT cookie (D16).
- **Request Body**:
  ```json
  {
    "email": "jane@example.com",
    "password": "Password123!"
  }
  ```
- **Success Response** (200 OK): Sets `token` cookie.
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "60d...",
        "name": "Jane Doe",
        "email": "jane@example.com",
        "role": "patient",
        "mustChangePassword": false
      }
    }
  }
  ```
- **Error Codes**: `VALIDATION_ERROR` (400), `INVALID_CREDENTIALS` (401), `FORBIDDEN` (403 - account inactive).

### `POST /auth/logout`
- **Description**: Clears `token` httpOnly cookie (D16).
- **Success Response** (200 OK):
  ```json
  { "success": true, "message": "Logged out successfully." }
  ```

### `GET /auth/me`
- **Description**: Returns authenticated user identity and associated role profile.
- **Success Response** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "user": { "id": "60d...", "name": "Jane Doe", "email": "jane@example.com", "role": "patient" },
      "patientProfile": { "_id": "60d..." }
    }
  }
  ```
- **Error Codes**: `AUTHENTICATION_REQUIRED` (401).

### `POST /auth/change-password`
- **Description**: Authenticated user changes own password (D9, D16).
- **Request Body**:
  ```json
  {
    "currentPassword": "OldPassword123!",
    "newPassword": "NewPassword123!"
  }
  ```
- **Success Response** (200 OK):
  ```json
  { "success": true, "message": "Password changed successfully." }
  ```
- **Error Codes**: `VALIDATION_ERROR` (400), `AUTHENTICATION_REQUIRED` (401), `INVALID_CREDENTIALS` (401).

---

## Specializations

### `GET /specializations`
- **Description**: List active specializations sorted by name. Public.
- **Success Response** (200 OK): Returns array of Specialization objects.

### `POST /specializations`
- **Description**: Admin creates specialization. Case-insensitive unique check using collation index.
- **Request Body**: `{ "name": "Dermatology", "description": "Skin and hair care" }`
- **Error Codes**: `VALIDATION_ERROR` (400), `AUTHENTICATION_REQUIRED` (401), `FORBIDDEN` (403), `CONFLICT` (409).

### `PUT /specializations/:id`
- **Description**: Admin updates specialization. Deactivation is blocked (409 CONFLICT) if active doctors use it.

### `DELETE /specializations/:id`
- **Description**: Admin deactivates specialization. Blocked (409 CONFLICT) if active doctors use it.

---

## Doctors & Availability

### `GET /doctors`
- **Description**: Database-level search & filter for doctors. Query params: `specializationId`, `search`, `includeInactive` (Admin only), `page`, `limit`.
- **Success Response** (200 OK): Paginated doctor profiles.

### `GET /doctors/:id`
- **Description**: Details for a specific doctor profile. Public view excludes email, phone, and isActive.

### `POST /doctors`
- **Description**: Admin creates doctor user account + profile + temp password + `mustChangePassword=true` (D13, D17).

### `PUT /doctors/:id`
- **Description**: Doctor edits own profile fields; Admin edits profile fields (not availability) (D14).

### `GET /doctors/:id/availability`
- **Description**: View doctor's weekly recurring availability schedule.

### `PUT /doctors/:id/availability`
- **Description**: Doctor updates own weekly availability schedule (D14). Admin denied. Validates max 3 windows/day, 30-min alignment, start before end, and no overlapping windows.

### `GET /doctors/:id/available-slots?date=YYYY-MM-DD`
- **Description**: Calculates 30-min candidate slots for `date` in clinic timezone `CLINIC_TIMEZONE` (D1, D7). Past slots on current day are excluded.

### `GET /doctors/:id/patients`
- **Description**: Doctor views patient list with whom they have an active clinical relationship (D15). Paginated.

---

## Patients

### `GET /patients`
- **Description**: Admin views system patient directory with database search (name, email, phone) and pagination. Query params: `search`, `page`, `limit`.

### `GET /patients/:id`
- **Description**: Patient views self (full); Doctor views limited profile (no address) if clinical relation exists (D15); Admin views full.

### `PUT /patients/:id`
- **Description**: Patient edits own profile; Admin edits.

---

## Appointments

### `POST /appointments`
- **Description**: Patient books appointment in `scheduled` status (D2, D14).

### `GET /appointments`
- **Description**: List appointments (Patient sees own; Doctor sees assigned; Admin sees all). Query params: `status`, `from` (YYYY-MM-DD), `to` (YYYY-MM-DD), `page`, `limit`.

### `GET /appointments/:id`
- **Description**: View single appointment details.

### `PATCH /appointments/:id/status`
- **Description**: Transition appointment status according to state machine (D2, D3, D4).

---

## Medical Records

### `POST /medical-records`
- **Description**: Doctor creates medical record for a `confirmed` or `completed` appointment (D6, D19). Admin 403.

### `GET /medical-records`
- **Description**: Patient reads own records; Doctor reads authored records (D6, D15). Paginated. Query params: `page`, `limit`. Admin 403.

### `GET /medical-records/:id`
- **Description**: Single medical record view (Patient own / Doctor authored). Admin 403.

### `GET /patients/:id/medical-records`
- **Description**: Patient history view (Patient own / Doctor authored history D15). Paginated. Admin 403.

### `PUT /medical-records/:id`
- **Description**: Editable strictly by original authoring doctor (D6, D19). Admin 403.

---

## Notifications

### `GET /notifications`
- **Description**: Authenticated user views own in-app notifications with pagination and `unreadCount`. Query params: `page`, `limit`.

### `PATCH /notifications/:id/read`
- **Description**: Mark notification as read. Ownership verified.

### `PATCH /notifications/read-all`
- **Description**: Mark all user notifications as read. Ownership verified.

---

## Admin Operations

### `GET /admin/dashboard`
- **Description**: Returns real database counts (users, doctors, patients, specializations, appointments, `no_show` appointments, `today's appointments`) executed in parallel via `Promise.all` & recent log.

### `GET /admin/users`
- **Description**: Paginated list of all system users. Query params: `page`, `limit`.

### `PATCH /admin/users/:id/status`
- **Description**: Admin activates or deactivates user account (`{ "isActive": false }`). Cannot deactivate self or last active admin. Deactivating a doctor user also deactivates the doctor profile.
