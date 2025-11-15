# EventHub

A full-stack event management platform enabling users to create events, register for events, communicate via real-time chat, and receive instant notifications. Includes administrative capabilities for content moderation.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Technology Stack](#technology-stack)
- [Backend Dependencies](#backend-dependencies)
- [Backend Features](#backend-features)
- [Frontend Architecture](#frontend-architecture)
- [Redis Configuration](#redis-configuration)
- [Authentication & Authorization](#authentication--authorization)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)

---

## Architecture Overview

EventHub is a three-layer architecture with four database systems:

**Frontend (Angular 20)** - Authentication & Authorization Guards, Event Management UI, Real-time Chat & Notifications, Admin Dashboard

**Backend (Node.js/Express)** - REST API with JWT Authentication, Rate Limiting (Redis-backed), Email Verification & Password Reset, OAuth2 Google Integration, WebSocket (Socket.IO) for Real-time

**Databases:**
- PostgreSQL: Users, Events, Registrations, Reports, Chat Conversations
- MongoDB: Chat Messages, Notifications (document store)
- Redis: Rate Limiting Counters, Token Blacklist, Sessions
- SendGrid: Email Service

---

## Technology Stack

### Backend
- Node.js 18+ runtime
- Express 4.21 framework
- PostgreSQL 14+ via Sequelize ORM
- MongoDB 5+ via Mongoose
- Redis via ioredis
- JWT authentication with Argon2 hashing
- Passport.js OAuth2 (Google)
- Socket.IO 4.8 for real-time communication
- Joi validation with Celebrate middleware
- SendGrid for email delivery
- Helmet for security headers

### Frontend
- Angular 20 with TypeScript 5.9
- Bootstrap 5.3 UI components
- Socket.IO Client for real-time features
- Angular CLI build tool

---

## Backend Dependencies

### Core Libraries

| Package | Purpose |
|---------|---------|
| express | HTTP server framework |
| jsonwebtoken | JWT token creation and verification |
| argon2 | Password hashing (ASIC resistant) |
| sequelize | PostgreSQL ORM with query builder |
| mongoose | MongoDB document mapper |
| ioredis | Redis client with connection pooling |
| socket.io | Real-time bidirectional WebSocket |
| passport + passport-google-oauth20 | OAuth2 Google authentication |
| @sendgrid/mail | Transactional email service |

### Rate Limiting & Security

| Package | Purpose |
|---------|---------|
| express-rate-limit | Request rate limiting middleware |
| rate-limit-redis | Redis-backed rate limit store |
| helmet | Security headers (CSP, X-Frame-Options, etc) |
| cors | Cross-origin resource sharing |
| compression | HTTP response compression |

### Validation & Utilities

| Package | Purpose |
|---------|---------|
| celebrate + joi | Request validation with error handling |
| validator | String validation library |
| dotenv-safe | Environment variable schema validation |
| morgan | HTTP request logging |
| express-session | Session management for OAuth |
| express-async-errors | Global async error handler |
| swagger-jsdoc + swagger-ui-express | OpenAPI documentation |

---

## Backend Features

### Authentication System

**Registration**
- Username and email validation
- Password policy: 8+ chars, uppercase, lowercase, digit, special character
- SendGrid email verification with 24-hour token expiration
- Development mode: auto-verify if SendGrid not configured
- Prevents duplicate emails

**Login**
- Email and password verification
- Email verification required before access
- OAuth users cannot use classic login (redirects to Google)
- Automatic account linking for existing emails + Google ID

**Logout**
- Token blacklisting via Redis with TTL matching JWT expiration
- Fallback to in-memory Set if Redis unavailable
- Revocation checked on every request and WebSocket connection

**Password Recovery**
- Forgot password generates 1-hour expiring reset token
- Email link directs to frontend reset form
- Password reset with validation

**Email Verification**
- Initial token sent on registration
- Resend endpoint for new tokens
- 24-hour expiration per token

### Event Management

**Event Lifecycle**
- Status: PENDING (admin review), APPROVED (public), REJECTED
- Creator controls editing/deletion
- Admins can approve, reject, or delete any event
- Capacity enforcement with capacity+1 check
- Soft delete via CASCADE foreign keys

**Event Operations**
- Create with title, description, category, location, date, capacity, image
- Edit (creator or admin)
- Delete (creator or admin)
- List with filters: category (LIKE), location (LIKE), date range
- Pagination: limit, offset parameters
- Creator-only view: `/events/mine`

**Participants**
- View all registered users for event
- Paginated participant list
- Automatic participant count

### Registration Management

**Registration Flow**
- Verify event is APPROVED and not at capacity
- Check for duplicate registration
- Create registration record with timestamp
- Trigger real-time notification to event creator
- Persist notification to MongoDB

**Cancellation**
- Remove registration with automatic cleanup
- Notify event creator of cancellation
- Recalculate capacity

**Rate Limiting**
- 20 registrations per hour per authenticated user
- Returns HTTP 429 if exceeded

### Chat & Real-time

**Conversations**
- Event conversations: group chat for all event participants
- Direct conversations: 1-on-1 messaging
- Auto-create on first message
- Messages stored in MongoDB for persistence
- Participants list with last activity timestamp

**Messages**
- Text messages with sender, timestamp, optional attachments
- Message history with pagination (limit, before cursor)
- Soft delete capability
- Real-time broadcasting via Socket.IO rooms

**WebSocket Events**
- `conversation:join` - Subscribe to room updates
- `conversation:leave` - Unsubscribe from room
- `message:send` - Broadcast to conversation
- `message:delete` - Remove message
- `user:online` / `user:offline` - Presence tracking
- `user:typing` - Real-time typing indicators

### Notifications

**Types**
- registration: User registered for event
- unregistration: User canceled registration
- report: Event/user reported (admin notification)
- custom: Admin-triggered notifications

**Features**
- Real-time Socket.IO delivery
- Persistent MongoDB storage
- Read/unread status tracking
- Pagination support
- Enriched with contextual data (event names, usernames, etc)

**Endpoints**
- GET /api/notifications - List with filters
- PUT /api/notifications/:id/read - Mark as read
- GET /api/notifications/count - Unread count

### Reports

**Report Creation**
- Report either user OR event (mutual exclusivity validation)
- Reason text field (required)
- Optional description field
- Prevents duplicate active reports on same target

**Status Workflow**
- PENDING: Initial state
- REVIEWED: Admin acknowledged
- RESOLVED: Action taken (user blocked, event rejected)
- DISMISSED: False report

**Admin Resolution**
- Update status with admin notes
- Notes visible to reporter
- Delete reports

**Rate Limiting**
- 50 reports per hour per user
- Prevents spam reports

### Admin Dashboard

**User Management**
- List all users with pagination (username, email, role, blocked status)
- Block user for policy violations
- Unblock previously blocked user
- Prevent admin blocking other admins

**Event Moderation**
- List pending events
- Approve event (changes status to APPROVED, becomes public)
- Reject event with optional reason
- Delete events

**Report Resolution**
- View all reports (user and event)
- Filter by status
- Resolve with notes
- View reporter and reported entity details

---

## Frontend Architecture

### Route Structure

```
/login                           - Public login form
/register                        - Public registration form
/auth/callback                   - OAuth redirect handler
/auth/verify-email/:token        - Email verification link
/events                          - Public event listing
/dashboard                       - User dashboard (protected)
/admin                           - Admin panel (protected + ADMIN role required)
/chat                            - Chat interface (protected)
```

### Core Components

**Authentication Module**
- Login form with email/password
- Google OAuth button
- Register form with validation
- Email verification form
- Password reset flow

**Events Module**
- Event list with search/filter
- Event creation form
- Event detail page
- Participant list
- Register/unregister buttons
- Admin approval/rejection interface

**Dashboard Module**
- User dashboard: My Created Events, My Registered Events
- Admin dashboard: User Management, Event Moderation, Report Resolution

**Chat Module**
- Conversation list
- Real-time message display
- Message input field
- Participant list with online status
- Typing indicators

### Authentication Guards

```typescript
authGuard: Checks token in localStorage, redirects to login if missing
adminGuard: Checks user.role === 'ADMIN', redirects to events if not
```

### HTTP Communication

All API requests include:
- Base URL from environment.ts
- Authorization header: `Bearer <jwt_token>`
- Content-Type: application/json
- Error interceptor handling 401, 403, 404, 500

### WebSocket Configuration

```typescript
const socket = io(socketUrl, {
  auth: { token: localStorage.getItem('jwt_token') },
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5
});
```

---

## Redis Configuration

### Connection Management

**Initialization**
```javascript
new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 50, 2000),
  tls: isRediss ? { rejectUnauthorized: false } : undefined
});
```

**Graceful Fallback**
- If Redis unavailable: use in-memory Map/Set
- Rate limiting falls back to per-process in-memory (not distributed)
- Token blacklist falls back to JavaScript Set
- Warnings logged to console

### Rate Limiting

**Limiters**
| Limiter | Window | Limit | Key |
|---------|--------|-------|-----|
| authLimiter | 15 min | 15 | IP address |
| generalLimiter | 15 min | 100 | IP address |
| eventCreationLimiter | 24 hours | 10 | user ID |
| registrationLimiter | 1 hour | 20 | user ID |
| reportLimiter | 1 hour | 50 | user ID |
| emailLimiter | 1 hour | 3 | IP address |
| logoutLimiter | 1 hour | 30 | IP address |

**Behavior**
- HTTP 429 response when exceeded
- Retry-After header with seconds until reset
- Counter resets automatically after window
- Failed requests count toward limit

### Token Blacklist

**Mechanism**
1. On logout: `addToBlacklist(token)` stores with Redis key `blacklist:<token>`
2. TTL = JWT exp timestamp - current time (auto-delete)
3. Every request checks: `isBlacklisted(token)`
4. Check performed in auth middleware AND Socket.IO authentication

**Verification Points**
- REST API: `src/middlewares/auth.middleware.js`
- WebSocket: `src/config/socket.js` authentication middleware
- Prevents token reuse after logout, even if client retains token

**Example**
```
JWT issued: exp = 1731704400 (2 hours from now)
User logs out now: 1731697200
Redis entry: blacklist:<token> with TTL 7200 seconds
After 2 hours: Key automatically deleted
Token cannot be used anymore
```

---

## Authentication & Authorization

### JWT Token

**Structure**
```javascript
{
  id: 1,
  username: "john_doe",
  email: "john@example.com",
  role: "USER", // or "ADMIN"
  iat: 1731697200,
  exp: 1731783600  // 24 hours from issuance
}
```

**Algorithm:** HS256 (HMAC SHA-256)
**Secret:** process.env.JWT_SECRET (required in production)
**Expiration:** 24 hours

### Role-Based Access Control

**USER Role**
- Create events
- Register for events
- Chat with other users
- Create reports
- View own notifications

**ADMIN Role**
- All USER permissions
- Approve/reject/delete any event
- Block/unblock users
- Resolve reports
- View all users

**Middleware Implementation**
```javascript
export function checkRole(requiredRole) {
  return (req, res, next) => {
    if (req.user.role !== requiredRole) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
}
```

### OAuth2 Google

**Flow**
1. Frontend: GET /api/auth/google (redirects to Google consent)
2. User: Authorize app in Google
3. Google: Redirect to /api/auth/google/callback?code=...
4. Backend: Exchange code for access token
5. Backend: Fetch user profile from Google
6. Backend: Find or create user, link Google ID
7. Frontend: Redirect with JWT token in URL or header

**Account Linking**
- If email exists: update with google_id and provider='google'
- If new email: create user with provider='google'
- OAuth users always: email_verified=true, password_hash=null

**Preventing Mixed Auth**
```javascript
if (!user.password_hash) {
  return res.status(400).json({
    message: 'This account uses OAuth. Please login with Google.'
  });
}
```

---

## Installation

### Prerequisites
- Node.js 18+
- npm 9+
- PostgreSQL 14+
- MongoDB (Atlas or local)
- Redis (Upstash or local)

### Backend

1. Clone and install
```bash
git clone https://github.com/RobertSSmau/EventHub.git
cd EventHub
npm install
```

2. Create .env file (see Environment Variables)

3. Initialize database
```bash
createdb eventhub
psql -U postgres -d eventhub -f SCHEMA.sql
```

4. Start
```bash
npm run dev      # Development
npm start        # Production
```

Server runs on http://localhost:3000
Swagger docs: http://localhost:3000/api/docs

### Frontend

1. Install
```bash
cd eventhub-frontend
npm install
```

2. Start development
```bash
ng serve --proxy-config proxy.conf.json
```

App runs on http://localhost:4200

---

## Environment Variables

### Backend (.env)

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=eventhub
DB_USER=postgres
DB_PASS=postgres
DB_SSL=false

MONGODB_URL=mongodb://localhost:27017/eventhub_chat

JWT_SECRET=your-very-secret-key-minimum-32-characters-long

REDIS_URL=redis://localhost:6379

SENDGRID_API_KEY=SG.your-key-here
EMAIL_USER=noreply@eventhub.com

GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

FRONTEND_URL=http://localhost:4200
```

### Frontend (environment.ts)

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  socketUrl: 'http://localhost:3000'
};
```

---

## Running the Application

### Development

**Backend**
```bash
npm run dev
# Runs with nodemon auto-restart
# http://localhost:3000
# http://localhost:3000/api/docs (Swagger)
```

**Frontend**
```bash
cd eventhub-frontend
ng serve --proxy-config proxy.conf.json
# http://localhost:4200
# API calls proxied to http://localhost:3000
```

### Production

**Backend**
```bash
npm start
# http://0.0.0.0:3000 (all network interfaces)
```

**Frontend**
```bash
ng build --configuration production
# Output in dist/eventhub-frontend/browser/
# Deploy static files to hosting (Vercel, Netlify, S3)
```

---

## API Documentation

Full API reference at: http://localhost:3000/api/docs

### Authentication Endpoints
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/verify-email/:token
- POST /api/auth/resend-verification
- POST /api/auth/forgot-password
- POST /api/auth/reset-password
- GET /api/auth/google
- GET /api/auth/google/callback

### Event Endpoints
- GET /api/events (list with filters)
- POST /api/events (create)
- GET /api/events/:id
- PUT /api/events/:id (update)
- DELETE /api/events/:id
- GET /api/events/mine
- PATCH /api/events/:id/approve (admin)
- PATCH /api/events/:id/reject (admin)
- GET /api/events/:id/participants

### Registration Endpoints
- POST /api/registrations/:eventId
- DELETE /api/registrations/:eventId
- GET /api/registrations/mine

### Chat Endpoints
- GET /api/chat/conversations
- POST /api/chat/conversations/direct
- POST /api/chat/conversations/event/:eventId
- GET /api/chat/conversations/:id/messages
- POST /api/chat/conversations/:id/messages

### Admin Endpoints
- GET /api/users
- PATCH /api/users/:id/block
- PATCH /api/users/:id/unblock

---

## Deployment

### Backend (Render, Railway, Heroku)

1. Connect GitHub repo to platform
2. Set production environment variables
3. Build command: `npm install`
4. Start command: `npm start`
5. Deploy

### Frontend (Vercel, Netlify, AWS S3)

**Vercel**
- Connect GitHub repo
- Build: `ng build --configuration production`
- Output: `dist/eventhub-frontend/browser`

**Netlify**
- Build: `ng build --configuration production`
- Deploy dist folder
- Add netlify.toml redirect rule for SPA

**AWS S3**
- Build: `ng build --configuration production`
- Upload dist to S3
- Configure CloudFront for CDN

### Databases

- PostgreSQL: AWS RDS, Azure Database, Railway
- MongoDB: MongoDB Atlas cloud
- Redis: Upstash or Redis Cloud

---

## License

ISC
