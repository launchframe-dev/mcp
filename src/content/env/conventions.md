# Environment Variable Conventions

## Single Centralized `.env`

All environment variables live in **one file**: `infrastructure/.env`

Docker Compose mounts it into every container via `env_file:` — **never create per-service `.env` files**.

## Variable Naming

Variables are **canonical** (no service-specific prefixes like `REACT_APP_`, `VITE_`, or `NEXT_PUBLIC_`).
The `docker-compose.yml` files map canonical names to the appropriate prefixed versions for each service.

Example mapping in docker-compose:
```yaml
environment:
  - VITE_API_BASE_URL=${API_BASE_URL}
  - NEXT_PUBLIC_PRIMARY_DOMAIN=${PRIMARY_DOMAIN}
```

## Key Variables Reference

### Application
```
NODE_ENV=production
APP_NAME=
PRIMARY_DOMAIN=
```

### Database (PostgreSQL)
```
DB_HOST=database
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=
DB_DATABASE=
DATABASE_URL=postgresql://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_DATABASE}
```

### Redis
```
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_URL=redis://${REDIS_HOST}:${REDIS_PORT}
```

### Service URLs & Ports
```
BACKEND_PORT=4000
API_BASE_URL=http://localhost:4000
BACKEND_API_URL=http://backend:4000

ADMIN_FRONTEND_PORT=3001
ADMIN_BASE_URL=http://localhost:3001

CUSTOMERS_FRONTEND_PORT=3000
FRONTEND_BASE_URL=http://localhost:3000

WEBSITE_PORT=8080
WEBSITE_BASE_URL=http://localhost:8080
```

### Authentication & Security
```
BETTER_AUTH_SECRET=          # min 32 chars, generate: openssl rand -base64 32
INITIAL_CREDITS=100          # credits granted to new users
BULL_ADMIN_TOKEN=            # Bull Board dashboard access
```

### Email
```
RESEND_API_KEY=              # production email (Resend)
MAIL_HOST=                   # SMTP host (dev: Mailtrap)
MAIL_USER=
MAIL_PASSWORD=
MAIL_FROM=noreply@${PRIMARY_DOMAIN}
```

### Payments (Polar.sh)
```
POLAR_ACCESS_TOKEN=
POLAR_SUCCESS_URL=${ADMIN_BASE_URL}/payments/success?checkout_id={CHECKOUT_ID}
POLAR_WEBHOOK_SECRET=
# POLAR_ENVIRONMENT=sandbox  # defaults to 'sandbox' in dev, 'production' in prod
```

### Google
```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:4000/auth/google/callback
GOOGLE_ANALYTICS_ID=
GOOGLE_CLOUD_STORAGE_BUCKET=
```

### Monitoring
```
BACKEND_SENTRY_DSN=
ADMIN_FRONTEND_SENTRY_DSN=
CUSTOMERS_PORTAL_SENTRY_DSN=
MIXPANEL_PROJECT_TOKEN=
```

### Real-time
```
PUSHER_KEY=
PUSHER_CLUSTER=
```

## Adding a New Variable

1. Add it to `infrastructure/base/.env.example` with a comment
2. Add it to `infrastructure/.env` (your local copy, never committed)
3. Reference it in the relevant `docker-compose.yml` `environment:` section if a prefix is needed
4. Access in NestJS via `process.env.VAR_NAME` or via `ConfigService`

## Rules

- **NEVER** commit `.env` — it is gitignored
- **NEVER** create per-service `.env` files
- All secrets (auth, DB, API keys) go in `infrastructure/.env` only
- Use `base/.env.example` as the template — it has all variables with placeholder values
