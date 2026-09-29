# Medical Records Specification

## 1. Purpose
Store clinical healthcare diagnosis and treatment details associated with a patient visit.

## 2. Record Fields (D8 - Attachments Removed)
- `patientId` (ObjectId, ref: Patient)
- `doctorId` (ObjectId, ref: Doctor - original author)
- `appointmentId` (ObjectId, ref: Appointment - unique D19)
- `diagnosis` (String, required)
- `symptoms` (String)
- `treatment` (String)
- `prescription` (String)
- `notes` (String)
- `createdAt` / `updatedAt` (Date)

*(Note: Medical record attachments are removed in v1 D8)*

## 3. Creation & Modification Rules (D6, D19)
- **One Record per Appointment (D19)**: Enforced via unique index on `appointmentId`.
- **Creation Timing (D19)**: A medical record can be created ONLY when the associated appointment status is `confirmed` or `completed`.
- **Author Only Modification (D19)**: A medical record is editable strictly by its original authoring doctor (`doctorId`).
- **Admin Restriction (D6)**: Administrators can NOT read, create, or modify medical records under any circumstances.

## 4. Access & Clinical Relationship Scope (D6, D15)
- **Patient Access**: Patients may view all medical records belonging to their own patient account (`patientId`).
- **Doctor Access (D15)**: A doctor may read ONLY medical records that THEY authored (`doctorId`).
- **Clinical Relationship Definition (D15)**: A doctor has a "clinical relationship" with a patient if they have at least one non-cancelled appointment with that patient. A doctor with a clinical relationship may view a limited patient profile (name, gender, DOB, phone - EXCLUDING home address).
- **Admin Access (D6)**: Denied (`403 FORBIDDEN`).
