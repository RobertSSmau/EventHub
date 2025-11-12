# 🎉 EventHub

[![Tests](https://img.shields.io/badge/tests-45%20passing-success)](https://github.com/RobertSSmau/EventHub)
[![Coverage](https://img.shields.io/badge/coverage-32.8%25-yellow)](./COVERAGE.md)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-ISC-blue)](./LICENSE)

> Platform per la gestione e partecipazione a eventi con notifiche real-time

## 🚀 Features

- ✅ **Autenticazione JWT** - Sistema completo di registrazione, login e logout
- ✅ **Gestione Eventi** - Creazione, modifica, eliminazione e approvazione eventi
- ✅ **Iscrizioni** - Sistema di registrazione agli eventi con controllo capacità
- ✅ **Notifiche Real-time** - Socket.IO per aggiornamenti istantanei
- ✅ **Chat** - Sistema di messaggistica tra utenti
- ✅ **Moderazione** - Sistema di report e gestione utenti
- ✅ **Admin Panel** - Dashboard per amministratori
- ✅ **API Documentation** - Swagger/OpenAPI integrato

## 📊 Test Coverage

**45/45 test passing** ✅

| Metric | Coverage |
|--------|----------|
| Statements | 32.8% |
| Branches | 20.92% |
| Functions | 25.8% |
| Lines | 33.18% |

Per dettagli completi vedi [COVERAGE.md](./COVERAGE.md)

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL (Sequelize) + MongoDB (Mongoose)
- **Cache/Queue**: Redis (Upstash)
- **Real-time**: Socket.IO
- **Authentication**: JWT + Argon2
- **Validation**: Celebrate/Joi
- **Testing**: Jest + Supertest
- **Documentation**: Swagger

## 📦 Installation

```bash
# Clone repository
git clone https://github.com/RobertSSmau/EventHub.git
cd EventHub

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
npm run migrate

# Start development server
npm run dev
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 📚 API Documentation

Una volta avviato il server, la documentazione API è disponibile a:
- **Swagger UI**: http://localhost:3000/api/docs

## 🏗️ Project Structure

```
EventHub/
├── src/
│   ├── config/          # Database, Redis, Socket.IO config
│   ├── controllers/     # Route handlers
│   ├── middlewares/     # Auth, rate limiting, roles
│   ├── models/          # Sequelize & Mongoose models
│   ├── routes/          # Express routes
│   ├── services/        # Business logic
│   ├── utils/           # Helper functions
│   └── app.js          # Express app setup
├── __tests__/          # Test utilities
├── coverage/           # Coverage reports
├── migrations/         # Database migrations
└── server.js          # Entry point
```

## 🔒 Security Features

- ✅ JWT Authentication
- ✅ Password hashing with Argon2
- ✅ Rate limiting per endpoint
- ✅ Token blacklist on logout
- ✅ Role-based access control
- ✅ Input validation with Joi
- ✅ Helmet security headers
- ✅ CORS configuration

## 📈 Development

```bash
# Start dev server with auto-reload
npm run dev

# Run linter
npm run lint

# Format code
npm run format
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

ISC License - see LICENSE file for details

## 👤 Author

**Robert S. Smau**

- GitHub: [@RobertSSmau](https://github.com/RobertSSmau)

---

**Status**: Work in Progress 🚧