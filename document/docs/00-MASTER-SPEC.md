# Healthcare Appointment Management System — Master Specification

**Version:** 1.1  
**Status:** Approved specification with resolved explicit user decisions (D1–D19)  
**Purpose:** Single source of truth for human developers and AI coding agents.

## 1. Approved Stack & Dependencies
- Frontend: React.js
- Styling: Tailwind CSS
- Backend: Node.js + Express.js
- Database: MongoDB + Mongoose
- API style: REST
- Language: JavaScript
- Authentication: JWT in httpOnly cookie (`SameSite=Strict`, `Secure` in production, 1 day expiry)
- Password Hashing: Argon2 (10 to 128 characters password policy)
- Validation: Explicit server-side validation using `zod`
- Version Control: Git

### Approved New Dependencies
- **Backend / Utility**: `zod`, `cookie-parser`
- **Testing**: `jest`, `supertest`, `vitest`, `@testing-library/react`, `@testing-library/user-event`, `jsdom`
- **Linting & Formatting**: `eslint`, `prettier`

No framework, database, language, authentication provider, or major dependency may be substituted without approval.

## 2. Product Scope
The system manages:
- Patient accounts and profiles
- Doctor accounts, profiles, and specializations
- Doctor availability
- Appointment booking and status management
- Medical records
- Notifications
- Administrator management and dashboards
- System/Clinic configuration endpoint (`GET /api/config`)

## 3. User Roles
- Patient
- Doctor
- Administrator

## 4. Source-of-Truth Rules
1. This specification and its linked documents override assumptions made by an AI agent.
2. Explicit User Decisions (D1–D19) override all prior TBDs or ambiguous documentation.
3. Never invent unspecified business rules.
4. Do not silently add features.
5. Do not change API contracts without updating `07-API-SPECIFICATION.md`.
6. Do not change database structure without updating `06-DATABASE-DESIGN.md`.
7. Security requirements are mandatory.
8. Every protected backend route must enforce authentication and appropriate authorization.
9. Medical information must not be exposed to users outside their permitted scope.

## 5. Explicit Out of Scope Unless Approved
- Online payments
- Insurance claims
- Pharmacy/inventory
- Laboratory management
- Hospital billing
- Telemedicine/video consultation
- Public patient-doctor chat
- SMS/WhatsApp/Email/Push provider integration (D11)
- External EHR interoperability
- AI diagnosis
- AI-generated medical advice
- Multi-tenant clinic management
- Mobile native applications
- Appointment rescheduling in v1 (D4 - cancel & rebook)
- Medical record attachments in v1 (D8)
- Password reset / forgot password in v1 (D9)
- Doctor leave / holiday exceptions in v1 (D12)
- Notification reminders / SMS / Email (D5, D11)

## 6. Requirement Priority
- MUST: required for release
- SHOULD: desirable but not release-blocking unless promoted
- MAY: optional

## 7. Resolved Decisions (D1–D19)

- **D1 (Slot Duration & Booking Window)**: Slot duration is 30 minutes, with no buffer time. Bookable from the current time up to 60 days ahead.
- **D2 (Initial Booking Status)**: Bookings are created in `scheduled` status. The doctor (own) or admin confirms it.
- **D3 (Cancellation Rules)**: Patients may cancel only 24 hours or more before the appointment start time. Doctors (own) and admins may cancel any time before the appointment is completed.
- **D4 (No Rescheduling in v1)**: Rescheduling is not supported in v1 (patients/doctors must cancel and rebook). Endpoints `PUT /appointments/:id` and `DELETE /appointments/:id` are removed. Cancellation is performed via `PATCH /appointments/:id/status`.
- **D5 (Notifications & Reminders)**: No scheduled reminders in v1. In-app notifications only, generated for events: `booked`, `confirmed`, `cancelled`, `completed`, `no_show`.
- **D6 (Admin Medical Access Restriction)**: Administrators can NOT read, create, or modify medical records.
- **D7 (Clinic Timezone & Date Model)**: Single clinic timezone specified via environment variable `CLINIC_TIMEZONE` (default `Asia/Kolkata`). `appointmentDate` is stored as a String `"YYYY-MM-DD"` in that timezone. Times are strings `"HH:mm"` in that timezone.
- **D8 (No Attachments in v1)**: Medical record attachments are removed from v1. The `attachments` field is removed everywhere.
- **D9 (Password Reset & Change Flow)**: Password reset is removed in v1 (`/auth/forgot-password`, `/auth/reset-password`, and `resetToken` fields are removed). Added `POST /auth/change-password`.
- **D10 (Hosting & Packaging)**: Hosting is provider-neutral. In production, Express serves the built client as a single deployable unit. A `Dockerfile` and `docker-compose.yml` are provided.
- **D11 (No External Messaging)**: No email, SMS, or push notifications in v1.
- **D12 (No Doctor Leave in v1)**: Doctor leave or holiday exceptions are not supported in v1.
- **D13 (User Creation & Bootstrapping)**: Only admins create doctor accounts. Patients self-register. The first admin is created exclusively via the `create-admin` script.
- **D14 (Admin Capability Scope)**: Admins cannot book appointments. Admins may edit doctor profile fields (excluding availability), and may change appointment status according to the state machine.
- **D15 (Clinical Relationship Scope)**: A "clinical relationship" means the doctor has at least one non-cancelled appointment with that patient. A doctor may read only medical records THEY authored and a limited patient profile (without address).
- **D16 (Authentication & Cookie Policy)**: JWT stored in an `httpOnly` cookie (`SameSite=Strict`, `Secure` in production, 1 day expiry, no refresh token). Logout clears the cookie. Unsafe HTTP methods must pass an `Origin` check against `FRONTEND_ORIGIN`. Password policy: 10 to 128 characters.
- **D17 (Doctor Credential Onboarding)**: A doctor account created by an admin receives a temporary password and `mustChangePassword=true`.
- **D18 (Clinic Configuration Endpoint)**: Clinic details (name, phone, address, hours, emergency number, currency, timezone, slot minutes, cancellation cutoff, booking window) come from environment variables and are exposed via a public `GET /api/config`. Values must never be fabricated.
- **D19 (Medical Record Constraints)**: One medical record per appointment (`appointmentId` unique). A record can be created only when the appointment status is `confirmed` or `completed`. It is editable only by its original author.
