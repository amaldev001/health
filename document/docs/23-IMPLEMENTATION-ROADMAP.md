# Implementation Roadmap

## Phase 0 — Specification
- Freeze requirements.
- Resolve critical TBDs.
- Approve architecture.

## Phase 1 — Repository Setup
- React app
- Express app
- Tailwind
- MongoDB/Mongoose
- Environment configuration
- Git

## Phase 2 — Backend Foundation
- Express configuration
- MongoDB connection
- Error handling
- Validation
- Logging
- Security middleware

## Phase 3 — Authentication/RBAC
- Registration
- Login
- Logout
- Password hashing
- Authentication middleware
- Role middleware
- Protected frontend routes

## Phase 4 — Doctor/Patient Management
- Models
- APIs
- Profiles
- Specializations

## Phase 5 — Availability
- Doctor schedule
- Available-slot calculation
- Validation

## Phase 6 — Appointments
- Booking
- Conflict prevention
- Status machine
- Cancellation
- History

## Phase 7 — Medical Records
- Create
- Read
- Update
- Access control

## Phase 8 — Notifications
- In-app notifications
- Read/unread
- Appointment event generation

## Phase 9 — Dashboards
- Patient
- Doctor
- Admin

## Phase 10 — QA/Security
- Integration tests
- Authorization tests
- End-to-end critical flows
- Security review

## Phase 11 — Deployment
- Staging
- Production
- Monitoring
- Backup/recovery verification

## Gate Rule
Do not start the next phase if a previous phase has unresolved critical defects or undocumented contract changes.
