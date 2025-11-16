# Production Checklist

## 🔔 Socket.IO Real-Time Notifications (CRITICAL - FIXED!)
**Status**: ✅ Risolto - Vedi `SOCKET_FIXES.md` per dettagli

**Cosa è stato fixato:**
1. **CORS configurato correttamente** - `src/config/socket.js` ora usa `FRONTEND_URL` fallback
2. **Socket si connette al login** - `auth.ts` chiama `socketService.connect()` dopo login
3. **Socket si disconnette al logout** - `auth.ts` chiama `socketService.disconnect()` al logout
4. **Socket initializer affidabile** - Legge localStorage direttamente

**Per testare:**
- Vedi `SOCKET_FIXES.md` sezione "🧪 Come Testare"
- Assicurati che `FRONTEND_URL` sia settato nel `.env`

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
- [x] ✅ **FIXATO** - Socket CORS usa `FRONTEND_URL` con fallback
- [ ] Cambia `FRONTEND_URL` dal `.env` al dominio production
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
