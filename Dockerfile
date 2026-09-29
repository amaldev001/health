# Multi-stage Dockerfile for Healthcare Appointment Management System

# Stage 1: Build Frontend SPA
FROM node:20-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: Production Server
FROM node:20-alpine AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=5000

# Install server production dependencies
COPY server/package*.json ./server/
RUN cd server && npm ci --only=production

# Copy server code
COPY server/ ./server/

# Copy built frontend from Stage 1 into client/dist for Express static serving
COPY --from=client-builder /app/client/dist ./client/dist

EXPOSE 5000

# Run server entry point
CMD ["node", "server/src/server.js"]
