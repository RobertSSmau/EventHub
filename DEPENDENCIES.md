# 📦 Dipendenze EventHub

## Production (20)

**Auth & Security**
- `argon2` - Hash password
- `jsonwebtoken` - JWT tokens
- `helmet` - HTTP security headers
- `cors` - CORS
- `accesscontrol` - RBAC

**Database**
- `sequelize` - ORM PostgreSQL
- `pg` + `pg-hstore` - PostgreSQL driver

**Redis**
- `ioredis` - Token blacklist (Upstash)

**Validation**
- `joi` + `celebrate` - Input validation
- `validator` - String validation

**Server**
- `express` - Web framework
- `express-async-errors` - Async error handling
- `compression` - GZIP
- `morgan` - Request logger

**Docs**
- `swagger-jsdoc` + `swagger-ui-express` - API docs

**Config**
- `dotenv-safe` - Environment variables

**Utils**
- `node-fetch` - HTTP client (test)

## Dev (1)
- `nodemon` - Auto-restart

---

## Setup
```bash
npm install
```

## Env Variables
```bash
PORT=3000
DB_HOST=
DB_PORT=
DB_NAME=
DB_USER=
DB_PASS=
JWT_SECRET=
REDIS_URL=  # Optional (fallback in-memory)
```
