# Deployment Specification

## 1. Production Deployment Model (D10)
- **Single Deployable Unit**: Hosting is provider-neutral. In production, Express.js serves the built client static files (`client/dist`) and API routes from a single Node.js process (D10).
- **Containerization**: Provided via `Dockerfile` and `docker-compose.yml`.

## 2. Environment Variables Reference (NAMES ONLY)

| Variable Name | Description | Required | Default / Example Name |
|---|---|:---:|---|
| `NODE_ENV` | Runtime environment (`development`, `production`, `test`) | Yes | `production` |
| `PORT` | HTTP server listening port | Yes | `5000` |
| `MONGODB_URI` | MongoDB connection string | Yes | Name placeholder |
| `JWT_SECRET` | Secret key for JWT signing | Yes | Name placeholder |
| `FRONTEND_ORIGIN` | Allowed origin for CORS & CSRF checks (D16) | Yes | Name placeholder |
| `CLINIC_NAME` | Name of clinic (D18) | Yes | Name placeholder |
| `CLINIC_PHONE` | Primary clinic phone (D18) | Yes | Name placeholder |
| `CLINIC_ADDRESS` | Physical address (D18) | Yes | Name placeholder |
| `CLINIC_HOURS` | Working hours display (D18) | Yes | Name placeholder |
| `CLINIC_EMERGENCY_PHONE` | Emergency contact (D18) | Yes | Name placeholder |
| `CLINIC_CURRENCY` | Currency code (D18) | Yes | `USD` |
| `CLINIC_TIMEZONE` | Clinic timezone identifier (D7, D18) | Yes | `Asia/Kolkata` |
| `SLOT_DURATION_MINUTES` | Appointment duration in minutes (D1, D18) | Yes | `30` |
| `CANCELLATION_CUTOFF_HOURS` | Minimum advance hours for patient cancellation (D3, D18) | Yes | `24` |
| `BOOKING_WINDOW_DAYS` | Maximum days in advance to book (D1, D18) | Yes | `60` |
| `ADMIN_NAME` | Initial administrator name for `create-admin` script (D13) | Script | Name placeholder |
| `ADMIN_EMAIL` | Initial administrator email for `create-admin` script (D13) | Script | Name placeholder |
| `ADMIN_PASSWORD` | Initial administrator password for `create-admin` script (D13) | Script | Name placeholder |

## 3. Production Build & Docker Instructions

### Option A: Docker Compose Deployment
Spin up MongoDB and the full-stack multi-stage built application in production mode:
```bash
docker-compose up --build -d
```
The application will be accessible at `http://localhost:5000`.

### Option B: Node.js Manual Deployment
```bash
# 1. Build client SPA assets
npm run build

# 2. Run initial admin creation script (if fresh DB)
npm run create-admin

# 3. Start server in production mode
NODE_ENV=production npm start
```

## 4. SPA Fallback & Static Asset Serving (D10)
In production, Express serves static assets directly from `client/dist`. Any non-API request (`GET` requests not prefixed with `/api`) falls back to returning `client/dist/index.html` to support HTML5 History Mode routing in single-page applications.

## 5. Operations & Lifecycle Management
- **Health Check Endpoint**: `GET /api/health` returns HTTP 200 with system timestamp & database status.
- **Graceful Shutdown**: Server handles `SIGTERM` and `SIGINT` signals by closing active HTTP connections and disconnecting Mongoose database pools cleanly before exiting.
- **Bootstrapping**: Fresh database setups run `npm run create-admin` once to seed the first administrator account (D13).
