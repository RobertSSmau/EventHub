# 📦 EventHub Dependencies

## Production (25)

**Auth & Security**
- `argon2` - Password hashing with Argon2 algorithm
- `jsonwebtoken` - JWT token generation and verification
- `helmet` - HTTP security headers middleware
- `cors` - Cross-Origin Resource Sharing
- `accesscontrol` - Role-Based Access Control (RBAC)

**Database**
- `sequelize` - PostgreSQL ORM
- `pg` + `pg-hstore` - PostgreSQL driver and serialization
- `mongoose` - MongoDB ODM for chat messages and conversations

**Redis**
- `ioredis` - Redis client for token blacklist (Upstash)

**Rate Limiting**
- `express-rate-limit` - Rate limiting middleware
- `rate-limit-redis` - Redis store for rate limiting

**Real-time Communication**
- `socket.io` - WebSocket library for real-time chat

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
# Server
PORT=3000
NODE_ENV=development

# PostgreSQL Database
DB_HOST=your-postgres-host
DB_PORT=5432
DB_NAME=eventhub
DB_USER=your-user
DB_PASS=your-password
DB_SSL=true

# MongoDB (Chat)
MONGODB_URL=mongodb+srv://user:pass@cluster.mongodb.net/eventhub_chat

# JWT
JWT_SECRET=your-secret-key

# Redis (Rate Limiting)
REDIS_URL=redis://host:6379

# Email
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password

# Client (CORS & Socket.IO)
CLIENT_URL=http://localhost:3000
```

## Total Dependencies: 26

**Production:** 25  
**Development:** 1
JWT_SECRET=
REDIS_URL=  # Optional (fallback in-memory)
```
