# Production Checklist

## Security

### Email Verification (IMPORTANT!)
**File**: `src/controllers/auth.controller.js`
- [ ] **Rimuovi** commenti da `sendVerificationEmail()` nella funzione `register()`
- [ ] **Rimuovi** commenti dal check `if (!user.email_verified)` nella funzione `login()`
- [ ] Cambia `email_verified: true` → `email_verified: false` in `register()`

### Content Security Policy
**File**: `src/app.js`
- [ ] **Rimuovi** `'unsafe-inline'` da `script-src` e `script-src-attr`
- [ ] **Rimuovi** `cdn.socket.io` (carica Socket.IO localmente)
- [ ] Usa nonce o hash per inline scripts

### CORS
**File**: `src/config/socket.js` e `src/app.js`
- [ ] Cambia `CLIENT_URL` da `http://localhost:3000` al dominio production
- [ ] Aggiungi solo domini specifici, mai `*`

## Environment Variables

### .env Production
```bash
NODE_ENV=production
CLIENT_URL=https://tuo-dominio.com
MONGODB_URL=mongodb+srv://...  # Atlas production cluster
REDIS_URL=rediss://...          # Production Redis
JWT_SECRET=...                  # Genera uno nuovo, lungo e casuale
DB_SSL=true                     # Sempre true in production
```

## Database

### MongoDB Atlas
- [ ] Whitelist IP: Rimuovi `0.0.0.0/0`, aggiungi solo IP server production
- [ ] Cluster: Passa da M0 (free) a M2+ se necessario
- [ ] Backup: Attiva backup automatici

### PostgreSQL
- [ ] SSL obbligatorio (`DB_SSL=true`)
- [ ] Connection pooling configurato

## Performance

### Socket.IO Scaling (se multi-server)
- [ ] Aggiungi Redis adapter per Socket.IO
```js
import { createAdapter } from '@socket.io/redis-adapter';
io.adapter(createAdapter(pubClient, subClient));
```

## Monitoring
- [ ] Aggiungi logging production (Winston, Pino)
- [ ] Error tracking (Sentry)
- [ ] Uptime monitoring

## Files da NON committare
- [ ] `test-chat.html` (è solo per test locale)
- [ ] `.env` (mai committare!)

## Deploy
- [ ] `npm run build` se hai build step
- [ ] `NODE_ENV=production npm start`
- [ ] Health check: `GET /api/health`
