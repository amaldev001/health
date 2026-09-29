# Requirements Traceability Matrix

| Requirement ID | Requirement Description | Backend Files | Frontend Files | Tests | Documentation |
|---|---|---|---|---|---|
| **AUTH-01** | Register Patient | `authController.js`, `User.js`, `Patient.js` | `RegisterPage.jsx` | Integration / Auth Tests | `07-API`, `10-AUTH` |
| **AUTH-02** | User Login | `authController.js`, `User.js` | `LoginPage.jsx` | Integration / Auth Tests | `07-API`, `10-AUTH` |
| **AUTH-03** | User Logout | `authController.js` | `Navbar.jsx` | Integration / Auth Tests | `07-API`, `10-AUTH` |
| **AUTH-04** | Role-Based Authorization | `auth.js`, `rbac.js` | `App.jsx` (ProtectedRoute) | Integration / RBAC Tests | `04-ROLES`, `10-AUTH` |
| **AUTH-05** | Password Hashing (Argon2) | `User.js`, `create-admin.js` | N/A | Password Hashing Tests | `10-AUTH`, `15-SECURITY` |
| **AUTH-06** | Change Password | `authController.js` | `App.jsx` (`/change-password`) | Password Change Tests | `07-API`, `10-AUTH` |
| **DOC-01** | Doctor Profile | `doctorController.js`, `Doctor.js` | `DoctorDashboard.jsx` | Doctor Profile Tests | `06-DB`, `07-API` |
| **DOC-02** | Specialization Management & Active Doctor Guard | `specializationController.js` | `AdminDashboard.jsx` | Specialization Tests | `06-DB`, `07-API` |
| **DOC-03** | Doctor Availability Schedule | `doctorController.js`, `availabilityService.js` | `DoctorDashboard.jsx` | Availability Tests | `07-API`, `11-SCHEDULING` |
| **DOC-04** | Doctor Appointments View | `appointmentController.js` | `DoctorDashboard.jsx` | Appointment Tests | `07-API`, `11-SCHEDULING` |
| **PAT-01** | Patient Profile | `patientController.js`, `Patient.js` | `PatientDashboard.jsx` | Patient Profile Tests | `06-DB`, `07-API` |
| **PAT-02** | Doctor DB Search & Discovery | `doctorController.js`, `searchUtil.js` | `DoctorsPage.jsx`, `LandingPage.jsx` | Doctor Search Tests | `07-API`, `08-FRONTEND` |
| **PAT-03** | Appointment Booking | `appointmentController.js` | `BookingModal.jsx` | Booking Tests | `07-API`, `11-SCHEDULING` |
| **PAT-04** | Appointment History View | `appointmentController.js` | `PatientDashboard.jsx` | History Tests | `07-API`, `08-FRONTEND` |
| **APT-01** | Availability & Past Slot Validation | `availabilityService.js` | `BookingModal.jsx` | Slot Generation Tests | `07-API`, `11-SCHEDULING` |
| **APT-02** | Double-Booking Prevention | `appointmentController.js`, `Appointment.js` | `BookingModal.jsx` | Double Booking Tests | `06-DB`, `11-SCHEDULING` |
| **APT-03** | Status Management State Machine | `appointmentController.js` | `DoctorDashboard.jsx`, `PatientDashboard.jsx` | State Machine Tests | `07-API`, `11-SCHEDULING` |
| **APT-04** | Appointment Cancellation (>=24h) | `appointmentController.js` | `PatientDashboard.jsx`, `DoctorDashboard.jsx` | Cancellation Tests | `07-API`, `11-SCHEDULING` |
| **MR-01** | Create Medical Record | `medicalRecordController.js`, `MedicalRecord.js` | `MedicalRecordModal.jsx` | Record Creation Tests | `06-DB`, `12-RECORDS` |
| **MR-02** | View Medical Record (Author / Patient) | `medicalRecordController.js` | `PatientDashboard.jsx` | Record Access Scope Tests | `04-ROLES`, `12-RECORDS` |
| **MR-03** | Update Medical Record (Author only) | `medicalRecordController.js` | `MedicalRecordModal.jsx` | Record Modification Tests | `04-ROLES`, `12-RECORDS` |
| **NOT-01** | In-App Event Notifications & Unread Count | `notificationController.js`, `Notification.js` | `Navbar.jsx` (Notification Dropdown) | Notification Tests | `07-API`, `13-NOTIFICATIONS` |
| **ADM-01** | Admin Dashboard & Parallel Queries | `adminController.js` | `AdminDashboard.jsx` | Admin Dashboard Tests | `07-API`, `08-FRONTEND` |
| **ADM-02** | User Management & Admin Guard Toggle | `adminController.js` | `AdminDashboard.jsx` | User Management Tests | `07-API`, `08-FRONTEND` |
| **ADM-03** | Admin Doctor Onboarding | `doctorController.js` | `AdminDashboard.jsx` | Doctor Onboarding Tests | `07-API`, `10-AUTH` |
| **ADM-04** | Admin Specialization Management | `specializationController.js` | `AdminDashboard.jsx` | Specialization Tests | `07-API`, `08-FRONTEND` |
| **SYS-01** | Public Clinic Configuration (`GET /config`) | `app.js` | `Navbar.jsx`, `Footer.jsx` | Config Endpoint Tests | `07-API`, `18-DEPLOYMENT` |
| **NFR-SEC-01** | Zod Input Validation & NoSQL Injection Protection | `validators/*.js`, `commonValidator.js` | `API.js` | Validation Tests | `14-VALIDATION`, `15-SECURITY` |
| **NFR-SEC-02** | Standardized Error Handling & Request Correlation Logger | `errorHandler.js`, `requestLogger.js`, `AppError.js` | `API.js` | Error Handler Tests | `14-VALIDATION` |
| **NFR-PERF-01** | MongoDB Compound Partial Unique & Lookup Indexing | `Appointment.js`, `MedicalRecord.js`, `Doctor.js`, `Specialization.js` | N/A | DB Index Tests | `06-DB` |
| **NFR-AVAIL-01** | Docker Containerization & Single Deployable | `app.js`, `Dockerfile` | `dist/` build files | Packaging Tests | `05-ARCH`, `18-DEPLOYMENT` |
| **NFR-COMP-01** | Clinic Timezone Date Normalization | `availabilityService.js`, `Appointment.js` | `BookingModal.jsx` | Date Normalization Tests | `06-DB`, `11-SCHEDULING` |
