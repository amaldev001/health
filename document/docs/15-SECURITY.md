# Security Requirements Specification

## 1. Mandatory Core Security Controls
- **HTTPS Enforcement**: Production transport MUST use TLS/HTTPS.
- **Password Protection (D16)**: Passwords MUST be hashed with **Argon2** (`argon2.hash`). Password policy requires 10 to 128 characters.
- **Cookie Security (D16)**: JWT tokens are stored exclusively in `httpOnly`, `SameSite=Strict` cookies (`Secure` flag enabled in production). Token expiry is 1 day.
- **CSRF Protection (D16)**: All state-changing HTTP requests (`POST`, `PUT`, `PATCH`, `DELETE`) verify that the `Origin` header matches `FRONTEND_ORIGIN`.
- **Server-Side RBAC**: Role-based access control is enforced authoritatively on the backend for every protected route.
- **Strict Input Validation**: All untrusted inputs are validated on the server using `zod` schemas before processing.
- **Rate Limiting (D16)**: Rate limiting enforced on authentication endpoints (5 requests / 15 minutes / IP) and API routes (300 requests / 15 minutes / IP).
- **HTTP Security Headers**: Enforced using `helmet` (HSTS, X-Frame-Options, Content-Security-Policy).
- **Injection Protection**: Mongoose query sanitization to prevent NoSQL injection.
- **Secret Management**: Environment variables managed strictly via `.env` / container secrets. No secrets committed to source control.
- **Production Error Handling**: Stack traces and raw database errors sanitized in production responses (`INTERNAL_ERROR`).

## 2. Healthcare Clinical Data Privacy Controls
- **Admin Medical Data Restriction (D6)**: Administrators can NOT read, create, or modify medical records.
- **Author Only Record Editing (D19)**: Medical records can be edited ONLY by their original authoring doctor (`doctorId`).
- **Clinical Relationship Scope (D15)**: Doctors may view medical history ONLY for patients with whom they have an active clinical relationship, and access limited profiles excluding home addresses.
- **Log Privacy**: Medical diagnoses, prescriptions, notes, passwords, and JWT tokens MUST NEVER be logged.

## 3. Onboarding Credential Security (D17)
- Admin-created doctor accounts receive a temporary password and `mustChangePassword=true`.
- On initial login, forced redirection to `/change-password` prevents prolonged use of temporary credentials.
