# Environment Configuration Guide

This document describes all environment variables used by Wrench Cloud and how to configure them properly.

## Quick Start

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in the required variables (see [Required Variables](#required-variables) below)

3. Start the application:
   ```bash
   pnpm dev
   ```

## Startup Validation

The application validates environment variables at startup and will **fail fast** if required variables are missing. This prevents the application from starting in an invalid state.

### Behavior by Environment

| Environment | Missing Required | Behavior |
|-------------|------------------|----------|
| Production  | Yes | Exit with error code 1 |
| Development | Yes | Log warning, continue (for debugging) |
| Any         | No  | Start normally |

### Error Messages

When required variables are missing, you'll see a detailed error message:

```
╔════════════════════════════════════════════════════════════════════╗
║                    ENVIRONMENT CONFIGURATION ERROR                  ║
╠════════════════════════════════════════════════════════════════════╣
║ The application cannot start due to missing required configuration.║
║                                                                    ║
║ Missing required environment variables:                            ║
║   • NEXT_PUBLIC_SUPABASE_URL                                       ║
║   • SUPABASE_SERVICE_ROLE_KEY                                      ║
╚════════════════════════════════════════════════════════════════════╝
```

## Required Variables

These variables **must** be set for the application to function:

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | `https://abc123.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key | `eyJhbGciOiJIUzI1...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) | `eyJhbGciOiJIUzI1...` |

### Getting Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Settings** → **API**
4. Copy the values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

> ⚠️ **Security Warning**: Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client. This key bypasses Row Level Security.

## Optional Variables

These variables enable additional features but are not required for basic operation:

### Application Settings

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_APP_URL` | Public URL of the application | `http://localhost:3000` |
| `NODE_ENV` | Environment mode | `development` |

### Supabase Storage (S3-compatible)

For file upload functionality:

| Variable | Description | Required for |
|----------|-------------|--------------|
| `SUPABASE_S3_ACCESS_KEY` | S3 access key ID | File uploads |
| `SUPABASE_S3_SECRET_KEY` | S3 secret access key | File uploads |
| `SUPABASE_S3_ENDPOINT` | S3 endpoint URL | File uploads |
| `SUPABASE_REGION` | AWS region | File uploads |

### Payment Processing (Razorpay)

For payment integration:

| Variable | Description | Exposed to Client |
|----------|-------------|-------------------|
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay public key | Yes |
| `RAZORPAY_KEY_SECRET` | Razorpay secret key | No |

### Communication (Twilio)

For WhatsApp invoice delivery:

| Variable | Description |
|----------|-------------|
| `TWILIO_ACCOUNT_SID` | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |
| `TWILIO_WHATSAPP_FROM` | WhatsApp sender number (e.g., `+14155238886`) |

## Health Check Endpoints

The application provides health check endpoints for monitoring and orchestration:

### GET /api/health

Full health check including database connectivity.

```bash
# Basic check
curl http://localhost:3000/api/health

# Verbose output (includes detailed check results)
curl http://localhost:3000/api/health?verbose=true
```

**Response (200 OK)**:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-06T12:00:00.000Z",
  "version": "1.0.0",
  "environment": "production",
  "uptime": 3600,
  "checks": [
    { "name": "environment", "status": "healthy" },
    { "name": "database", "status": "healthy" }
  ]
}
```

**Response (503 Service Unavailable)**:
```json
{
  "status": "unhealthy",
  "timestamp": "2026-01-06T12:00:00.000Z",
  "version": "1.0.0",
  "environment": "production",
  "uptime": 0,
  "checks": [
    { "name": "environment", "status": "unhealthy" },
    { "name": "database", "status": "unhealthy" }
  ]
}
```

### GET /api/ready

Lightweight readiness check (only validates configuration).

```bash
curl http://localhost:3000/api/ready
```

**Response (200 OK)**:
```json
{
  "ready": true,
  "timestamp": "2026-01-06T12:00:00.000Z"
}
```

### HEAD Requests

Both endpoints support HEAD requests for minimal overhead:

```bash
# Just check status code
curl -I http://localhost:3000/api/health
curl -I http://localhost:3000/api/ready
```

## Kubernetes Configuration

Example Kubernetes deployment configuration:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mechanix
spec:
  template:
    spec:
      containers:
        - name: mechanix
          image: mechanix:latest
          ports:
            - containerPort: 3000
          env:
            - name: NEXT_PUBLIC_SUPABASE_URL
              valueFrom:
                secretKeyRef:
                  name: supabase-secrets
                  key: url
            - name: NEXT_PUBLIC_SUPABASE_ANON_KEY
              valueFrom:
                secretKeyRef:
                  name: supabase-secrets
                  key: anon-key
            - name: SUPABASE_SERVICE_ROLE_KEY
              valueFrom:
                secretKeyRef:
                  name: supabase-secrets
                  key: service-role-key
          livenessProbe:
            httpGet:
              path: /api/health
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 30
          readinessProbe:
            httpGet:
              path: /api/ready
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 10
```

## Docker Configuration

Example Docker Compose configuration:

```yaml
version: '3.8'
services:
  mechanix:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/ready"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
```

## Type-Safe Environment Access

For type-safe access to environment variables in your code, use the `env` object:

```typescript
import { env } from '@/lib/env'

// Required variables (guaranteed to exist after validation)
const supabaseUrl = env.SUPABASE_URL

// Optional feature checks
if (env.hasRazorpayConfig) {
  // Payment processing is available
}

if (env.hasTwilioConfig) {
  // WhatsApp notifications are available
}

// Environment checks
if (env.isDevelopment) {
  console.log('Running in development mode')
}
```

## Troubleshooting

### Application won't start

1. Check that all required variables are set
2. Verify variable names are correct (case-sensitive)
3. Check for trailing whitespace in values
4. Run the health check: `curl http://localhost:3000/api/health?verbose=true`

### Database connection fails

1. Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
2. Check that Supabase project is running
3. Verify network connectivity to Supabase
4. Check the health endpoint for detailed error messages

### Missing optional features

Check which optional configurations are missing:
```bash
curl http://localhost:3000/api/health?verbose=true | jq '.checks'
```
