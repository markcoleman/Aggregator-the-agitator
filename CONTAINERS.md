# Container Support

## Overview

The FDX Resource API provides comprehensive container support for development and production deployments. This includes:

- DevContainer for VS Code development
- Docker Compose configurations for local development
- Multi-stage Dockerfile for production builds
- Reverse proxy with Traefik
- Mock authentication service for testing

## DevContainer

### What is DevContainer?

DevContainers provide a consistent development environment using Docker containers. This ensures all developers work with the same tools, dependencies, and configurations.

### Features

- **Pre-configured Environment**: Node.js 20, pnpm, Git, GitHub CLI
- **VS Code Extensions**: TypeScript, ESLint, Prettier, JSON support
- **Automatic Setup**: Dependencies installed on container creation
- **Port Forwarding**: Automatic forwarding of port 3000

### Usage

1. Install VS Code and the "Dev Containers" extension
2. Open the project in VS Code
3. Click "Reopen in Container" when prompted (or use Command Palette)
4. Wait for container to build and dependencies to install
5. Start developing!

### Configuration

Located in `.devcontainer/devcontainer.json`:

```json
{
  "name": "FDX Resource API Development",
  "image": "mcr.microsoft.com/devcontainers/typescript-node:20",
  "features": {
    "ghcr.io/devcontainers/features/git:1": {},
    "ghcr.io/devcontainers/features/github-cli:1": {}
  },
  "postCreateCommand": "corepack enable && pnpm install",
  "forwardPorts": [3000]
}
```

### Benefits

- ✅ No local Node.js installation required
- ✅ Consistent environment across team
- ✅ Isolated from host system
- ✅ Easy onboarding for new developers
- ✅ Works on Windows, Mac, and Linux

## Docker Compose

### Services

The project includes multiple Docker Compose services:

#### 1. Production API (`fdx-api`)

Production-ready service with optimized build:

```bash
docker-compose up fdx-api
```

Features:
- Multi-stage build (builder → production)
- Minimal image size
- Non-root user for security
- Health checks
- Automatic restart

#### 2. Development API (`fdx-api-dev`)

Development service with hot reload:

```bash
docker-compose --profile dev up fdx-api-dev
```

Features:
- Source code mounted from host
- Hot reload with `pnpm dev`
- Debug logging
- Port 3001 (separate from production)

#### 3. Traefik Reverse Proxy (`traefik`)

Reverse proxy for routing and load balancing:

```bash
docker-compose --profile proxy up traefik
```

Features:
- Automatic service discovery
- Dashboard at http://traefik.localhost:8080
- Access logs
- Load balancing

Access services:
- API: http://api.localhost
- Dev API: http://dev.api.localhost
- Traefik Dashboard: http://traefik.localhost:8080

#### 4. Mock Auth Server (`mock-auth`)

Mock authentication server for testing:

```bash
docker-compose --profile mock up mock-auth
```

Features:
- Provides test JWTs
- JWKS endpoint
- Lightweight Node.js service

### Common Commands

```bash
# Start production service
docker-compose up -d

# Start development service
docker-compose --profile dev up

# Start all services including proxy
docker-compose --profile dev --profile proxy --profile mock up

# Stop all services
docker-compose down

# View logs
docker-compose logs -f fdx-api

# Rebuild containers
docker-compose up --build

# Run in background
docker-compose up -d

# Stop and remove volumes
docker-compose down -v
```

## Dockerfile

### Multi-Stage Build

The Dockerfile uses multi-stage builds for optimal image size:

#### Stage 1: Builder

```dockerfile
FROM node:20-alpine AS builder
RUN corepack enable pnpm
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
```

#### Stage 2: Production

```dockerfile
FROM node:20-alpine AS production
RUN corepack enable pnpm
RUN addgroup -g 1001 -S app && adduser -S app -u 1001 -G app
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --production
COPY --from=builder /app/dist ./dist
COPY openapi.yaml ./
RUN chown -R app:app /app
USER app
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

### Benefits

- ✅ Minimal image size (only production dependencies)
- ✅ Security (non-root user)
- ✅ Fast builds (layer caching)
- ✅ Health checks built-in
- ✅ Metadata labels

## Environment Variables

### Production

```bash
# Server
PORT=3000
HOST=0.0.0.0
NODE_ENV=production
LOG_LEVEL=info

# Cache
CACHE_ENABLED=true
CACHE_TTL_SECONDS=60

# JWT
JWT_ISSUER=https://your-auth-server.com
JWT_AUDIENCE=fdx-resource-api
JWKS_URI=https://your-auth-server.com/.well-known/jwks.json
```

### Development

```bash
# Server
PORT=3000
HOST=0.0.0.0
NODE_ENV=development
LOG_LEVEL=debug

# Cache
CACHE_ENABLED=true
CACHE_TTL_SECONDS=60

# JWT (mock)
JWT_ISSUER=https://mock-fdx-auth.example.com
JWT_AUDIENCE=fdx-resource-api
JWKS_URI=https://mock-fdx-auth.example.com/.well-known/jwks.json
```

## Health Checks

### Docker Health Check

Built into Dockerfile:

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { 
    process.exit(res.statusCode === 200 ? 0 : 1) 
  })" || exit 1
```

### Kubernetes Readiness Probe

```yaml
readinessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 10
```

### Kubernetes Liveness Probe

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 15
  periodSeconds: 20
```

## Networking

### Docker Compose Network

All services share a bridge network:

```yaml
networks:
  fdx-network:
    driver: bridge
    name: fdx-network
```

Services can communicate using service names:
- `fdx-api` accessible at `http://fdx-api:3000`
- `mock-auth` accessible at `http://mock-auth:3000`

### Port Mapping

- `3000` → Production API
- `3001` → Development API
- `3002` → Mock Auth Server
- `80` → Traefik (HTTP)
- `8080` → Traefik Dashboard

## Volumes

### Named Volumes

```yaml
volumes:
  node_modules:
    name: fdx-api-node-modules
```

Persists `node_modules` across container restarts.

### Bind Mounts (Development)

```yaml
volumes:
  - ./src:/app/src:ro  # Read-only source code
  - ./test:/app/test:ro  # Read-only tests
```

Enables hot reload in development.

## Security Best Practices

1. **Non-root User**: Production container runs as user `app` (UID 1001)
2. **Read-only Mounts**: Source code mounted read-only in development
3. **Minimal Base Image**: Alpine Linux for smaller attack surface
4. **No Secrets in Image**: All secrets via environment variables
5. **Health Checks**: Automatic container restart on failure

## Production Deployment

### Kubernetes

Example deployment manifest:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: fdx-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: fdx-api
  template:
    metadata:
      labels:
        app: fdx-api
    spec:
      containers:
      - name: fdx-api
        image: fdx-resource-api:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: CACHE_ENABLED
          value: "true"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
```

### Docker Swarm

```bash
docker stack deploy -c docker-compose.yml fdx-api
```

### Cloud Run (GCP)

```bash
gcloud run deploy fdx-api \
  --image gcr.io/project/fdx-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs fdx-api

# Check container status
docker-compose ps

# Rebuild from scratch
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

### Port Already in Use

```bash
# Find process using port
lsof -i :3000

# Or change port in docker-compose.yml
ports:
  - "3001:3000"  # Map to different host port
```

### Permission Denied

```bash
# Fix file ownership
chown -R $USER:$USER .

# Or run with sudo (not recommended)
sudo docker-compose up
```

### Slow Performance

1. Check Docker resources (CPU, Memory)
2. Use BuildKit for faster builds:
   ```bash
   DOCKER_BUILDKIT=1 docker build .
   ```
3. Enable BuildKit in docker-compose:
   ```bash
   COMPOSE_DOCKER_CLI_BUILD=1 docker-compose build
   ```

## Best Practices

1. **Use .dockerignore**: Exclude unnecessary files from build context
2. **Layer Caching**: Order Dockerfile commands from least to most frequently changing
3. **Multi-stage Builds**: Keep production images minimal
4. **Health Checks**: Always include health checks
5. **Graceful Shutdown**: Handle SIGTERM for graceful shutdown
6. **Logging**: Log to stdout/stderr (not files)
7. **Secrets Management**: Use Docker secrets or orchestrator-specific solutions
8. **Resource Limits**: Set memory and CPU limits

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [DevContainers Documentation](https://containers.dev/)
- [Traefik Documentation](https://doc.traefik.io/traefik/)
