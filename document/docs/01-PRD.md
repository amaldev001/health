# Product Requirements Document (PRD)

## 1. Product Overview
A web-based healthcare appointment management platform connecting patients, doctors, and administrators through secure role-based interfaces.

## 2. Problem
Healthcare appointment processes can be fragmented across calls, messages, and manual records. The system centralizes doctor availability, appointment scheduling, patient information, medical records, and administrative management.

## 3. Goals
### MUST
- Provide secure registration and login.
- Separate patient, doctor, and administrator capabilities.
- Allow patients to find doctors and book appointments.
- Allow doctors to manage availability and appointments.
- Maintain appointment history.
- Maintain medical records with access controls.
- Provide administrator management tools.
- Provide REST APIs backed by MongoDB.

## 4. Non-Goals
See master specification. No feature outside approved scope may be introduced without a documented change request.

## 5. User Journeys
### Patient
Register → Login → Complete profile → Find doctor → View availability → Select slot → Book → View status → Attend → View resulting medical record.

### Doctor
Login → Complete profile → Configure specialization/availability → View appointments → Manage appointment status → View permitted patient context → Create/update medical record.

### Administrator
Login → Dashboard → Manage users/doctors/patients/specializations/appointments → Monitor system state.

## 6. Success Criteria
- Core workflows work end-to-end.
- Unauthorized role access is blocked.
- Appointment double booking is prevented.
- Invalid input is rejected consistently.
- Medical records are access controlled.
- Critical API and UI flows have automated/manual test coverage.
- Production configuration does not contain secrets in source control.

## 7. Personas
### Patient
Needs simple doctor discovery, availability, booking, and record access.

### Doctor
Needs an efficient schedule and patient/record workflow.

### Administrator
Needs system-level management and operational visibility.
