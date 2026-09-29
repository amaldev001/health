# Healthcare Appointment Management System (MERN)

A production-grade, secure, role-based Healthcare Appointment Management Platform built with Express.js, MongoDB (Mongoose), and React (Vite, TailwindCSS).

---

## 🌟 Key Features & Architectural Decisions

- **Role-Based Access Control (RBAC)**: Supports `patient`, `doctor`, and `admin` roles with strict route and API level guards.
- **Appointment State Machine**: Full appointment lifecycle (`scheduled`, `confirmed`, `completed`, `cancelled`, `no_show`) enforcing valid state transitions (e.g. 24-hour patient cancellation rule).
- **Slot Conflict Prevention**: Partial unique index in MongoDB on active appointment slots preventing double bookings even under heavy concurrent traffic.
- **Secure Authentication**: Argon2 password hashing, HTTP-Only secure JWT cookies, password-change flags (`mustChangePassword`), and strict rate limiters.
- **Data Exposure Protection**: Strict field projection preventing PII/sensitive data exposure in public endpoints and standard error formats with Correlation Request IDs (`X-Request-Id`).
- **Comprehensive Testing**: 100% test coverage for critical backend security flows (Jest + Supertest with `mongodb-memory-server`) and frontend components (Vitest + Testing Library).

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js, MongoDB / Mongoose, Zod (Validation), Argon2, JSON Web Tokens (JWT), Helmet, Express Rate Limit.
- **Frontend**: React 18, Vite, React Router v7, TailwindCSS, Lucide Icons, Axios.
- **Testing**: Jest, Supertest, mongodb-memory-server, Vitest, React Testing Library.
- **Containerization & CI**: Docker, Docker Compose, GitHub Actions CI.

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- **Node.js**: v20+ recommended
- **MongoDB**: Local MongoDB instance running on `mongodb://localhost:27017` or MongoDB Atlas URI

### 2. Environment Setup
Copy `.env.example` in `server/` to `server/.env`:
```bash
cp server/.env.example server/.env
```
Ensure required variables are populated:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/healthcare_db
JWT_SECRET=supersecretjwtkeythatisatleast32characterslongforsecurity
NODE_ENV=development
FRONTEND_ORIGIN=http://localhost:5173
CLINIC_TIMEZONE=UTC
CLINIC_NAME=Healthcare Clinic
CLINIC_PHONE=+1-800-555-0199
CLINIC_ADDRESS=123 Medical Center Blvd
CLINIC_HOURS=09:00-17:00
EMERGENCY_NUMBER=911
CURRENCY=USD
ADMIN_NAME=System Admin
ADMIN_EMAIL=admin@healthcare.com
ADMIN_PASSWORD=AdminPassword123!
```

### 3. Install Dependencies
```bash
# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 4. Create Initial Admin User
```bash
npm run create-admin
```

### 5. Start Development Servers
Run backend and frontend concurrently:
```bash
# Terminal 1 (Backend - Port 5000)
npm run server:dev

# Terminal 2 (Frontend - Port 5173)
npm run client
```

---

## 🐳 Docker Deployment

To spin up the entire application along with MongoDB in Docker:

```bash
docker-compose up --build
```
The application will be accessible at `http://localhost:5000`.

---

## 🧪 Running Tests

### Run All Tests (Backend + Frontend)
From root directory:
```bash
npm test
```

### Backend Tests Only
```bash
npm run test:server
```

### Frontend Tests Only
```bash
npm run test:client
```

---

## 📄 License & Compliance
This project adheres to HIPAA digital security guidelines, strictly preventing PII leakages in API responses and application log files.
