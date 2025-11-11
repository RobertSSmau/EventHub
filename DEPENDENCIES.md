# 📦 EventHub Dependencies

## Production (23)

**Auth & Security**
- `argon2` - Password hashing with Argon2 algorithm
- `jsonwebtoken` - JWT token generation and verification
- `helmet` - HTTP security headers middleware
- `cors` - Cross-Origin Resource Sharing
- `accesscontrol` - Role-Based Access Control (RBAC)

**Database**
- `sequelize` - PostgreSQL ORM
- `pg` + `pg-hstore` - PostgreSQL driver and serialization

**Redis**
- `ioredis` - Redis client for token blacklist (Upstash)

**Rate Limiting**
- `express-rate-limit` - Rate limiting middleware
- `rate-limit-redis` - Redis store for rate limiting

**Validation**
- `joi` - Schema validation
- `celebrate` - Joi middleware for Express
- `validator` - String validation utilities

**Email**
- `nodemailer` - Email sending (Gmail SMTP)

**Server**
- `express` - Web framework
- `express-async-errors` - Async error handling
- `compression` - GZIP compression
- `morgan` - HTTP request logger

**API Documentation**
- `swagger-jsdoc` - Generate Swagger/OpenAPI from JSDoc
- `swagger-ui-express` - Swagger UI for API docs

**Configuration**
- `dotenv-safe` - Environment variable validation

**Utils**
- `node-fetch` - HTTP client

## Development (1)
- `nodemon` - Auto-restart on file changes

---

## Installation

```bash
npm install
```

## Environment Variables

Required variables in `.env`:
```env
PORT=3000
DATABASE_URL=postgresql://user:pass@host:5432/eventhub
JWT_SECRET=your-secret-key
REDIS_URL=redis://host:6379
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
```

## Total Dependencies: 24

**Production:** 23  
**Development:** 1
DB_HOST=
DB_PORT=
DB_NAME=
DB_USER=
DB_PASS=
JWT_SECRET=
REDIS_URL=  # Optional (fallback in-memory)
```
