# Stage 1: Builder
FROM node:22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache python3 make g++

# Build args
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

# Copy the entire workspace configuration
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY apps/web/package*.json ./apps/web/
COPY packages/domain/package*.json ./packages/domain/
COPY packages/shared-types/package*.json ./packages/shared-types/

# Copy repo
COPY . .

# Install and build
RUN npm ci
RUN npm run build -w apps/web

# Stage 2: Runner (Nginx)
FROM nginx:alpine AS runner

# Copy the custom nginx configuration
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built static files
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
