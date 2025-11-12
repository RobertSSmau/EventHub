# 📦 EventHub Dependencies

Questo documento fornisce istruzioni complete per installare tutte le dipendenze del progetto EventHub (Backend + Frontend) su una nuova macchina.

---

## 🚀 Setup Completo per Nuova Macchina

### Prerequisiti

Prima di iniziare, assicurati di avere installato:

1. **Node.js** (v18.x o superiore)
   - Scarica da: https://nodejs.org/
   - Verifica: `node --version` e `npm --version`

2. **Git**
   - Scarica da: https://git-scm.com/
   - Verifica: `git --version`

3. **PostgreSQL** (v14 o superiore)
   - Scarica da: https://www.postgresql.org/download/

4. **MongoDB** (o account MongoDB Atlas)
   - Cloud: https://www.mongodb.com/atlas
   - Local: https://www.mongodb.com/try/download/community

5. **Redis** (o account Upstash)
   - Cloud: https://upstash.com/
   - Local Windows: https://github.com/microsoftarchive/redis/releases

---

## 📥 Clonazione del Repository

```bash
git clone https://github.com/RobertSSmau/EventHub.git
cd EventHub
```

---

## 🔧 Backend (Node.js) - Setup

### 1. Installazione Dipendenze Backend

Dalla directory principale del progetto:

```bash
npm install
```

### 2. Configurazione Environment Variables

Crea un file `.env` nella directory principale del progetto con le seguenti variabili:

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

# Redis (Rate Limiting & Token Blacklist)
REDIS_URL=redis://host:6379

# Email (Gmail SMTP)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password

# Client (CORS & Socket.IO)
CLIENT_URL=http://localhost:4200
```

### 3. Setup Database

Esegui le migrazioni SQL per creare le tabelle:

```bash
# Connettiti al tuo database PostgreSQL e esegui:
psql -U your-user -d eventhub -f DDL.sql
psql -U your-user -d eventhub -f migrations/001_add_email_verified.sql
psql -U your-user -d eventhub -f migrations/002_update_reports_table.sql
```

### 4. Avvio Backend

```bash
# Modalità sviluppo (con auto-restart)
npm run dev

# Modalità produzione
npm start
```

Il backend sarà disponibile su `http://localhost:3000`

---

## 🎨 Frontend (Angular) - Setup

### 1. Installazione Angular CLI (se non già installata)

```bash
npm install -g @angular/cli
```

Verifica: `ng version`

### 2. Navigazione nella Directory Frontend

```bash
cd eventhub-frontend
```

### 3. Installazione Dipendenze Frontend

```bash
npm install
```

### 4. Configurazione Environment (se necessario)

Modifica i file in `src/environments/` se devi cambiare l'URL del backend:

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000'
};
```

### 5. Avvio Frontend

```bash
# Development server
npm start
# oppure
ng serve
```

Il frontend sarà disponibile su `http://localhost:4200`

---

## 📋 Backend Dependencies (26)

### Production (25)

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

### Development (1)
- `nodemon` - Auto-restart on file changes

---

## 📋 Frontend Dependencies (Angular)

### Production (7)
- `@angular/common` - Angular common modules
- `@angular/compiler` - Angular template compiler
- `@angular/core` - Angular core framework
- `@angular/forms` - Angular forms module
- `@angular/platform-browser` - Browser platform for Angular
- `@angular/router` - Angular routing module
- `rxjs` - Reactive extensions for JavaScript
- `socket.io-client` - Socket.IO client for real-time communication
- `tslib` - TypeScript runtime library
- `zone.js` - Execution context for Angular

### Development (10)
- `@angular/build` - Angular build tools
- `@angular/cli` - Angular CLI
- `@angular/compiler-cli` - Angular compiler CLI
- `@types/jasmine` - TypeScript definitions for Jasmine
- `jasmine-core` - Jasmine testing framework
- `karma` - Test runner
- `karma-chrome-launcher` - Karma Chrome launcher
- `karma-coverage` - Code coverage for Karma
- `karma-jasmine` - Jasmine adapter for Karma
- `karma-jasmine-html-reporter` - HTML reporter for Jasmine
- `typescript` - TypeScript compiler

---

## 🔄 Workflow Completo di Setup

### Setup Sequenziale (Consigliato)

```bash
# 1. Clona il repository
git clone https://github.com/RobertSSmau/EventHub.git
cd EventHub

# 2. Installa dipendenze backend
npm install

# 3. Configura .env (vedi sezione sopra)
# Crea manualmente il file .env con le tue credenziali

# 4. Setup database PostgreSQL
# Esegui DDL.sql e le migrazioni

# 5. Avvia backend
npm run dev

# 6. In un nuovo terminale, installa dipendenze frontend
cd eventhub-frontend
npm install

# 7. Avvia frontend
npm start
```

---

## ✅ Verifica Installazione

### Backend
- Apri `http://localhost:3000` nel browser
- Dovresti vedere il messaggio di benvenuto o la documentazione API
- Verifica Swagger: `http://localhost:3000/api-docs`

### Frontend
- Apri `http://localhost:4200` nel browser
- L'applicazione Angular dovrebbe caricarsi correttamente

### Test di Connessione
- Verifica che il frontend possa comunicare con il backend
- Controlla la console del browser per eventuali errori CORS

---

## 🐛 Troubleshooting

### Problemi Comuni

**Errore: Cannot find module**
```bash
# Pulisci e reinstalla
rm -rf node_modules package-lock.json
npm install
```

**Errore CORS**
- Verifica che `CLIENT_URL` nel `.env` backend corrisponda all'URL del frontend

**Errore Database Connection**
- Verifica le credenziali nel `.env`
- Assicurati che PostgreSQL sia in esecuzione
- Controlla che il database esista

**Errore Angular CLI**
```bash
# Reinstalla Angular CLI globalmente
npm uninstall -g @angular/cli
npm install -g @angular/cli@latest
```

---

## 📊 Totale Dipendenze

**Backend:** 26 (25 production + 1 development)  
**Frontend:** 17 (7 production + 10 development)  
**Totale Progetto:** 43 dipendenze
```
