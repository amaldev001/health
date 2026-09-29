# Known Limitations and Future Scope Register

This document records deliberate functional boundaries in v1 of the Healthcare Appointment Management System and outlines features deferred to future releases.

---

## 1. Deferred Features & Future Scope

| ID | Capability / Feature | Current Status in v1 | Proposed Future Scope |
|---|---|---|---|
| **LIM-001** | Appointment Reminders | No scheduled reminders in v1 (D5). In-app event notifications only. | Cron background job sending pre-appointment reminders (e.g. 24h & 2h before start time). |
| **LIM-002** | Password Reset via Email | Removed in v1 (D9). Authenticated password change (`/auth/change-password`) supported. | Self-service password reset using email token delivery provider (e.g. SendGrid, AWS SES). |
| **LIM-003** | Direct Appointment Rescheduling | Rescheduling removed in v1 (D4). Patients/doctors must cancel and book a new slot. | Direct appointment slot rescheduling endpoint with atomic availability migration. |
| **LIM-004** | Medical Record File Attachments | Removed in v1 (D8). Clinical records store text diagnosis, symptoms, treatment, prescription, notes. | Encrypted file upload storage (AWS S3 / Azure Blob) for lab reports & imaging attachments. |
| **LIM-005** | Doctor Leave & Holiday Exceptions | Excluded in v1 (D12). Doctor availability follows a weekly recurring schedule. | Specific date range block-outs for doctor vacation, holidays, or emergency leave. |
| **LIM-006** | External Notifications | Excluded in v1 (D11). In-app notification center only. | Multi-channel messaging integration (Email, SMS, WhatsApp, Web Push). |
| **LIM-007** | Enterprise Audit Trail | Standard request logging. No immutable audit trail collection. | Dedicated append-only clinical audit log tracking all access and modifications to medical data. |
| **LIM-008** | Regulatory & Legal Compliance Review | Self-contained security controls (Argon2, httpOnly JWT, RBAC, Zod). | Qualified legal, HIPAA, and GDPR compliance audit and formal security certification before live deployment. |
| **LIM-009** | Automated Database Backups | Containerized MongoDB instance. | Automated snapshot backups and point-in-time disaster recovery configuration. |
