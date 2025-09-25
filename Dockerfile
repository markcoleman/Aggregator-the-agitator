# FDX Resource API Dockerfile
# Multi-stage build for optimized production image

# Build stage
FROM node:20-alpine AS builder

# Install pnpm via corepack
RUN corepack enable pnpm

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Production stage
FROM node:20-alpine AS production

# Install pnpm via corepack
RUN corepack enable pnpm

# Create app user for security
RUN addgroup -g 1001 -S app && \
    adduser -S app -u 1001 -G app

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install only production dependencies
RUN pnpm install --frozen-lockfile --production

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Copy any additional files needed at runtime
COPY openapi.yaml ./

# Change ownership to app user
RUN chown -R app:app /app

# Switch to app user
USER app

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Start the application
CMD ["node", "dist/server.js"]

# Metadata
LABEL \
  org.opencontainers.image.title="FDX Resource API" \
  org.opencontainers.image.description="FDX-aligned REST API for financial data aggregation" \
  org.opencontainers.image.version="1.0.0" \
  org.opencontainers.image.authors="Mark Coleman" \
  org.opencontainers.image.url="https://github.com/markcoleman/Aggregator-the-agitator" \
  org.opencontainers.image.source="https://github.com/markcoleman/Aggregator-the-agitator" \
  org.opencontainers.image.vendor="Mark Coleman" \
  org.opencontainers.image.licenses="MIT"