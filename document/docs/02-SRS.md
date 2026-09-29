# Software Requirements Specification (SRS)

## 1. Functional Requirements

### Authentication
- FR-AUTH-001 Patient registration MUST be supported.
- FR-AUTH-002 Login MUST validate credentials.
- FR-AUTH-003 Passwords MUST never be stored in plaintext.
- FR-AUTH-004 Protected resources MUST require authentication.
- FR-AUTH-005 Role-restricted resources MUST enforce authorization.
- FR-AUTH-006 Logout MUST invalidate the authenticated session according to the chosen JWT/session strategy.
- FR-AUTH-007 Password reset MUST use a secure, non-disclosing flow when implemented.

### Doctor
- FR-DOC-001 Doctor profile MUST be viewable by authorized users.
- FR-DOC-002 Doctor MUST be able to maintain permitted profile fields.
- FR-DOC-003 Doctor MUST have a specialization.
- FR-DOC-004 Doctor MUST be able to configure availability.
- FR-DOC-005 Doctor MUST view assigned/upcoming appointments.

### Patient
- FR-PAT-001 Patient MUST maintain their own profile.
- FR-PAT-002 Patient MUST search/filter doctors.
- FR-PAT-003 Patient MUST view available appointment slots.
- FR-PAT-004 Patient MUST book appointments.
- FR-PAT-005 Patient MUST view appointment history.
- FR-PAT-006 Patient MUST view medical records they are authorized to access.

### Appointments
- FR-APT-001 Appointment MUST reference a patient and doctor.
- FR-APT-002 Appointment MUST contain date/time and status.
- FR-APT-003 Server MUST validate availability during booking.
- FR-APT-004 System MUST prevent conflicting bookings.
- FR-APT-005 Appointment status changes MUST follow defined transition rules.
- FR-APT-006 Cancellation MUST be authorization checked.

### Medical Records
- FR-MR-001 Medical records MUST reference the patient.
- FR-MR-002 Creating/updating records MUST require appropriate authorization.
- FR-MR-003 Patients MUST not modify doctor-created medical records unless explicitly specified.
- FR-MR-004 Record access MUST be restricted to permitted parties.

### Admin
- FR-ADM-001 Admin MUST access an administrator dashboard.
- FR-ADM-002 Admin MUST manage doctors.
- FR-ADM-003 Admin MUST manage patients/users within approved fields.
- FR-ADM-004 Admin MUST manage specializations.
- FR-ADM-005 Admin MUST manage/view appointments within administrative scope.

### Notifications
- FR-NOT-001 Users MUST be able to retrieve their notifications.
- FR-NOT-002 Notifications MUST have read/unread state.
- FR-NOT-003 Appointment events SHOULD create appropriate in-app notifications.

## 2. Non-Functional Requirements
- NFR-SEC: Security is mandatory.
- NFR-PERF: APIs should return normal CRUD operations promptly under expected project load.
- NFR-REL: Server errors must not expose secrets or stack traces to clients in production.
- NFR-MAINT: Code must be modular and documented.
- NFR-VAL: All client-provided data must be validated server-side.
- NFR-OBS: Production errors should be logged safely without exposing medical data unnecessarily.
