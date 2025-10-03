# FTS Backend API Dockerfile
# Multi-stage build untuk optimal production deployment

# Stage 1: Build Stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies untuk build)
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npm run prisma:generate

# Build TypeScript ke JavaScript
RUN npm run build:ts

# Stage 2: Production Stage
FROM node:18-alpine AS production

# Install dumb-init dan curl untuk health check
RUN apk add --no-cache dumb-init curl

# Create app user untuk security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev && npm cache clean --force

# Copy built application dari builder stage
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nodejs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

# Create necessary directories
RUN mkdir -p uploads logs && chown -R nodejs:nodejs uploads logs

# Switch ke non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check (gunakan curl untuk simplicity)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start application dengan dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]