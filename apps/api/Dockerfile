# Stage 1: Builder
FROM node:22-slim AS builder

WORKDIR /app

# Debian/slim generally has pre-built binaries for native modules like bcrypt, 
# so we only install openssl just in case Prisma needs it during generate.
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy the entire workspace configuration
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY apps/web/package*.json ./apps/web/
COPY packages/domain/package*.json ./packages/domain/
COPY packages/shared-types/package*.json ./packages/shared-types/

# Copy the rest of the repository
COPY . .

# Install dependencies for all workspaces
RUN npm ci

# Generate Prisma client and build all workspaces
RUN npm run db:generate
RUN npm run build

# Stage 2: Runner
FROM node:22-slim AS runner

WORKDIR /app

# Install curl for the Docker healthcheck and openssl for Prisma
RUN apt-get update && apt-get install -y curl openssl && rm -rf /var/lib/apt/lists/*

# Copy only the necessary files for production
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/apps/api ./apps/api

# Note: In a heavily scaled production environment, database migrations (`prisma migrate deploy`) 
# should typically be executed as a separate CI/CD step or Init Container rather than on 
# application startup, to prevent race conditions from multiple concurrent api instances.
# For this initial Dockerization, it is kept here for simplicity.
ENV NODE_ENV=production
ENV PORT=4000

# Expose API port
EXPOSE 4000

CMD ["sh", "-c", "npm run db:migrate:deploy && npm start -w apps/api"]
