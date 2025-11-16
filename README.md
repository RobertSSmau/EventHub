# EventHub

Event management platform with real-time chat and admin moderation.

## Quick Start

### Prerequisites
- Node.js 18+, npm 9+
- PostgreSQL 14+, MongoDB, Redis

### Installation

```bash
# Clone and install backend
git clone https://github.com/RobertSSmau/EventHub.git
cd EventHub
npm install

# Configure environment
cp .env.example .env

# Edit .env with your database credentials

# Start backend
npm run dev          # Development
npm start            # Production
```

```bash
# Setup frontend
cd eventhub-frontend
npm install
ng serve --proxy-config proxy.conf.json
```

Backend: http://localhost:3000  
Frontend: http://localhost:4200  
API Docs: http://localhost:3000/api/docs

## Features

### User Management
- Email/password registration with verification
- Google OAuth2 integration
- JWT authentication (24h expiry)
- Password reset via email
- Role-based access: USER, ADMIN

### Events
- Create, edit, delete events
- Capacity management
- Admin approval workflow (PENDING → APPROVED/REJECTED)
- Filter by category, location, date
- Participant registration/cancellation

### Chat & Notifications
- Real-time messaging via Socket.IO
- Group conversations (events) and direct messages
- Persistent storage (MongoDB)
- Notification system with read/unread status

### Admin Features
- User blocking/unblocking
- Event approval/rejection
- Report management (users/events)
- View all users with pagination

## Tech Stack

Backend: Express, PostgreSQL (Sequelize), MongoDB (Mongoose), Redis, Socket.IO, JWT, Argon2  
Frontend: Angular 20, TypeScript, Bootstrap 5, Socket.IO Client  
Security: Helmet, CORS, Rate Limiting, Password Hashing


## Token Management

Tokens are blacklisted on logout via Redis with TTL matching JWT expiration. Blacklist checked on every authenticated request and WebSocket connection.

## Documentation

For detailed architecture, dependencies, and features, see [DOCUMENTATION.md](DOCUMENTATION.md).
