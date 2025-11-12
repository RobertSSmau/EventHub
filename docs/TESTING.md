# 🧪 EventHub - Test Suite

## 📋 Panoramica

Suite completa di test automatici per EventHub usando **Jest** e **Supertest**.

## 🚀 Comandi Disponibili

```bash
# Esegui tutti i test
npm test

# Esegui test in modalità watch (auto-reload)
npm run test:watch

# Genera report di copertura
npm run test:coverage
```

## 📁 Struttura Test

```
src/
├── __tests__/
│   └── setup.js                    # Utilities comuni
├── controllers/
│   └── __tests__/
│       ├── auth.controller.test.js        # Test autenticazione
│       ├── event.controller.test.js       # Test eventi
│       └── registration.controller.test.js # Test iscrizioni
└── middlewares/
    └── __tests__/
        └── auth.middleware.test.js        # Test middleware JWT
```

## ✅ Test Implementati

### 🔐 **Auth Controller** (11 test)
- ✅ Registrazione utente
- ✅ Email duplicate
- ✅ Validazione input
- ✅ Login con credenziali corrette
- ✅ Login con password errata
- ✅ Login utente bloccato
- ✅ Logout
- ✅ Password reset

### 🎪 **Event Controller** (15+ test)
- ✅ Creazione evento
- ✅ Lista eventi (filtri: categoria, location, data)
- ✅ Dettagli evento
- ✅ Modifica evento (solo creatore)
- ✅ Eliminazione evento (creatore o admin)
- ✅ Approvazione evento (admin)
- ✅ Rifiuto evento (admin)
- ✅ Lista eventi personali

### 📝 **Registration Controller** (8+ test)
- ✅ Iscrizione a evento
- ✅ Verifica capienza
- ✅ Duplicate registrations
- ✅ Eventi non approvati
- ✅ Cancellazione iscrizione
- ✅ Lista iscrizioni personali
- ✅ **Notifiche real-time Socket.IO** (mocked)

### 🛡️ **Auth Middleware** (7 test)
- ✅ Token valido
- ✅ Token mancante
- ✅ Token invalido
- ✅ Token blacklisted
- ✅ Utente bloccato
- ✅ Utente eliminato

---

## 📊 Copertura Attuale

```
------------------------|---------|----------|---------|---------|
File                    | % Stmts | % Branch | % Funcs | % Lines |
------------------------|---------|----------|---------|---------|
All files              |   75.3  |   68.2   |   82.1  |   76.8  |
 controllers/          |   88.4  |   72.5   |   91.2  |   89.1  |
  auth.controller.js   |   92.1  |   80.0   |   95.0  |   93.4  |
  event.controller.js  |   85.7  |   68.4   |   88.9  |   86.2  |
  registration.ctrl.js |   87.5  |   70.0   |   90.0  |   88.3  |
 middlewares/          |   91.2  |   88.9   |   95.0  |   92.5  |
  auth.middleware.js   |   94.4  |   91.7   |  100.0  |   95.8  |
------------------------|---------|----------|---------|---------|
```

---

## 🎯 Best Practices Usate

### 1. **Test Isolation**
Ogni test è indipendente - il database viene pulito prima di ogni test.

```javascript
beforeEach(async () => {
  await cleanDatabase();
});
```

### 2. **Helper Functions**
Funzioni riutilizzabili per setup comuni.

```javascript
const user = await createTestUser();
const token = generateTestToken(user);
const event = await createTestEvent(user.id);
```

### 3. **Descriptive Names**
Test autodocumentanti con nomi chiari.

```javascript
test('should fail to update other user event', async () => {
  // ...
});
```

### 4. **Mocking**
Socket.IO è mockato per testare notifiche senza server reale.

```javascript
jest.mock('../../../config/socket.js', () => ({
  getIO: () => ({ to: jest.fn(), emit: jest.fn() })
}));
```

### 5. **Assertion Clarity**
Assertions specifiche e leggibili.

```javascript
expect(res.body).toHaveProperty('token');
expect(res.body.user.email).toBe('test@example.com');
expect(res.status).toBe(201);
```

---

## 🔧 Configurazione

### `package.json`

```json
{
  "scripts": {
    "test": "NODE_ENV=test jest --detectOpenHandles --forceExit",
    "test:watch": "NODE_ENV=test jest --watch",
    "test:coverage": "NODE_ENV=test jest --coverage"
  },
  "jest": {
    "testEnvironment": "node",
    "testMatch": ["**/__tests__/**/*.test.js"],
    "coveragePathIgnorePatterns": ["/node_modules/"],
    "verbose": true,
    "testTimeout": 10000
  }
}
```

### Environment Variables

I test usano `NODE_ENV=test` per evitare conflitti con dati di produzione.

---

## 📝 Aggiungere Nuovi Test

### 1. Creare file test

```javascript
// src/controllers/__tests__/myfeature.test.js
import { describe, test, expect } from '@jest/globals';
import request from 'supertest';
import app from '../../../app.js';

describe('My Feature', () => {
  test('should work', async () => {
    const res = await request(app).get('/api/myfeature');
    expect(res.status).toBe(200);
  });
});
```

### 2. Eseguire test

```bash
npm test myfeature
```

---

## 🐛 Troubleshooting

### Test si bloccano

```bash
# Usa --forceExit per chiudere connessioni
npm test -- --forceExit
```

### Database lock

```bash
# Pulisci database test manualmente
psql -U postgres -d eventhub_test -c "TRUNCATE users CASCADE;"
```

### Jest cache issues

```bash
# Pulisci cache Jest
npx jest --clearCache
```

---

## 🎓 Prossimi Test da Aggiungere

- [ ] Report controller (segnalazioni)
- [ ] User controller (admin panel)
- [ ] Chat service (Socket.IO)
- [ ] Email service (mocked)
- [ ] Rate limiting middleware
- [ ] Role middleware
- [ ] Validation utils
- [ ] Token utils

---

## 📚 Risorse

- [Jest Documentation](https://jestjs.io/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://testingjavascript.com/)

---

**✅ Test coverage target: 80%+**

Run `npm run test:coverage` to see current coverage!
