# Frontend Specification

## 1. Application Routes

### Public Routes
- `/` — Landing Page (honestly presents clinic data, doctors, specializations)
- `/login` — User Sign-In
- `/register` — Patient Self-Registration (D13)
- `/change-password` — Authenticated Password Change (D9)
- `/doctors` — Specialist Doctor Directory & Search
- `/privacy` — Privacy Policy
- `/terms` — Terms of Service
- `/*` — 404 Not Found Page

### Patient Protected Routes (`/patient-dashboard`)
- Appointment Schedule & History
- Doctor Discovery & Booking Modal
- Clinical Medical Records History View
- In-App Notifications Dropdown

### Doctor Protected Routes (`/doctor-dashboard`)
- Physician Consultation Schedule & Patient Management
- State Machine Status Controls (`confirm`, `cancel`, `complete`, `no_show`)
- Medical Record Generator Modal (for confirmed/completed visits D19)
- Weekly Working Availability Editor Modal

### Admin Protected Routes (`/admin`)
- Operations Control Panel & System Metrics Overview
- User Directory & Account Status Toggle (`/admin/users`)
- Doctor Account Onboarding Modal (`/admin/doctors` D13, D17)
- Specialization Manager Modal (`/admin/specializations`)
- Global System Appointments Log (`/admin/appointments`)

---

## 2. Mandatory Page States (Loading, Empty, Error)

Every data-dependent page and component must implement explicit, dedicated UI states:

1. **Loading State**: Displays skeleton shimmer or loading spinner while API request is in-flight.
2. **Empty State**: Displays clear, honest empty state messaging when zero items exist in database.
   - **Landing Specializations**: `"No specializations available yet."`
   - **Landing Doctors**: `"No doctors available yet."`
   - **Doctor Directory**: `"No doctors available yet."`
   - **Patient Appointments**: `"You have no appointments. Find a doctor to book one."`
   - **Patient Medical Records**: `"No medical records available yet."`
   - **Doctor Schedule**: `"No appointments scheduled yet."`
   - **Admin Appointments Log**: `"No appointments in system yet."`
   - **Admin User Directory**: `"No users registered yet."`
   - **Admin Specializations Catalog**: `"No specializations created yet."`
3. **Error State**: Displays user-friendly error alert box with retry button when API returns an error response.
4. **Form Validation Feedback**: Inline Zod validation messages for missing or malformed inputs.
5. **Success Feedback**: Notification banner or toast notification when operations complete successfully.

---

## 3. Frontend Security Principles
- Route guards improve UX but NEVER replace backend server-side authorization.
- JWT tokens are handled automatically via `httpOnly` cookies (`SameSite=Strict`).
- Unsafe requests send `Origin` header matching `FRONTEND_ORIGIN` (D16).
- Doctors with `mustChangePassword=true` are redirected to `/change-password` on login (D17).
