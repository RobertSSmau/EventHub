# OAuth2 Google Login - Fix Report

## 🔴 Problemi Identificati

### 1. **CORS Configuration Incompleta**
- **Problema**: `app.js` aveva `app.use(cors())` generico senza configurazione specifica
- **Impatto**: Cookies di sessione di Passport non venivano trasmessi dal frontend al backend
- **Root Cause**: Browser blocca i cookies cross-origin se non configurato `credentials: true` in CORS

### 2. **Session Cookie Attributes Mancanti**
- **Problema**: Cookie di sessione non avevano `sameSite: 'lax'`
- **Impatto**: Durante il redirect da Google OAuth, la sessione veniva persa
- **Root Cause**: `sameSite: 'strict'` (default) blocca i cookies in redirect cross-site

### 3. **Timeout nel Frontend**
- **Problema**: Nessun timeout nel componente `auth-callback`
- **Impatto**: Se Redis falliva, il componente rimaneva in loading infinito
- **Root Cause**: Mancava error handling e timeout protection

## ✅ Soluzioni Implementate

### 1. **CORS Configuration Completa** (`src/app.js`)
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:4200',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

**Cosa fa**:
- Permette cookies su cross-origin requests
- Specifica l'URL frontend consentito
- Configura gli header CORS corretti

### 2. **Session Cookie Attributes** (`src/app.js`)
```javascript
app.use(session({
  secret: process.env.JWT_SECRET || 'fallback-secret-for-sessions',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',  // ⬅️ CRITICO per OAuth redirect
    maxAge: 24 * 60 * 60 * 1000
  }
}));
```

**Cosa fa**:
- `sameSite: 'lax'`: Permette cookies in redirect (ma protegge da CSRF)
- `httpOnly: true`: Protegge da XSS attacks
- `secure: false` in dev, `true` in prod

### 3. **Logging Migliorato** (`src/controllers/auth.controller.js`)
- Aggiunto logging dettagliato in `googleAuthSuccess()`
- Aggiunto try-catch e error reporting
- Log della URL di redirect per debugging

### 4. **Timeout Protection** (`eventhub-frontend/.../auth-callback.ts`)
```typescript
const timeoutHandle = setTimeout(() => {
  console.error('OAuth data fetch timeout after 10 seconds');
  this.status = 'error';
  this.errorMessage = 'Login process timed out. Please try again.';
  setTimeout(() => {
    this.router.navigate(['/login']);
  }, 3000);
}, 10000);
```

**Cosa fa**:
- Se fetch impiega più di 10 secondi, mostra errore
- Previene il caricamento infinito
- Permette all'utente di riprovare

### 5. **Migliorato Error Handling nel Frontend**
- Aggiunto `errorMessage` property
- Mostrato nel template
- Debug info migliorato

## 🧪 Come Testare

### Setup:
```bash
cd c:\Users\Robert Work\Desktop\NodeJS\EventHub

# 1. Verificare .env
echo $env:FRONTEND_URL  # Deve essere http://localhost:4200
echo $env:GOOGLE_CLIENT_ID  # Deve esistere
echo $env:GOOGLE_CLIENT_SECRET  # Deve esistere

# 2. Riavviare il backend
npm start

# 3. In un'altra terminale, riavviare il frontend
cd eventhub-frontend
ng serve
```

### Test OAuth Flow:
1. Apri `http://localhost:4200/login`
2. Clicca "Login with Google"
3. **Aspettati**:
   - Redirect a Google
   - Dopo consent: redirect a `http://localhost:4200/auth/callback?session=...`
   - Console logs dettagliati
   - Redirect a dashboard dopo ~500ms
   - **NON** caricamento infinito

### Debug Console (Browser DevTools):
```
✅ Corrisponde a:
- AuthCallback component initialized
- Session ID from URL: present (oauth_...)
- Fetching OAuth data for session: oauth_...
- OAuth data received successfully: { token: '...', user: {...} }
- Authentication data stored, redirecting...
- Redirecting to: /dashboard

❌ Se vedi:
- Session ID from URL: missing
- Error fetching OAuth data
- [timeout error]
→ Vedi "Troubleshooting" sotto
```

### Debug Server Logs:
```
✅ Backend deve mostrare:
- Google OAuth route called
- Google OAuth callback route called
- Google OAuth callback received: { profileId: '...', email: '...' }
- Storing OAuth data in Redis with sessionId: oauth_...
- OAuth data stored successfully in Redis
- OAuth success - redirecting to: http://localhost:4200/auth/callback?session=...

❌ Se vedi errori:
- "Redis error" → Verificare REDIS_URL in .env
- "No user found" → Verificare Passport strategy
```

## 🔧 Troubleshooting

### "Missing session ID" Error
**Causa**: Google OAuth redirect non funziona
**Soluzione**:
```bash
# Verificare la URL di callback in Google Console
# https://console.cloud.google.com/
# Authorized redirect URIs deve contenere:
# http://localhost:3000/api/auth/google/callback
```

### "Session expired" Error
**Causa**: Redis timeout (> 5 min) o Redis non disponibile
**Soluzione**:
```bash
# Verificare Redis
redis-cli ping  # Deve rispondere PONG

# Verificare REDIS_URL in .env
echo $env:REDIS_URL

# Aumentare timeout in auth.controller.js se necessario
await redis.setex(sessionId, 600, JSON.stringify(authData)); // 10 minuti
```

### "Authentication failed" Error
**Causa**: Passport non autentica l'utente
**Soluzione**:
```bash
# Verificare GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET
echo $env:GOOGLE_CLIENT_ID
echo $env:GOOGLE_CLIENT_SECRET

# Verificare che siano corretti in Google Console
```

### "Redirecting to login page" (3 sec timeout)
**Causa**: `/auth/oauth-data/:session` fallisce
**Soluzione**:
```bash
# Verificare che getOAuthData sia in routing
# src/routes/auth.routes.js: router.get('/oauth-data/:session', getOAuthData);

# Verificare che session ID sia corretto nella URL
# Browser: http://localhost:4200/auth/callback?session=oauth_...
```

## 📊 Flow Diagram

```
1. User clicks "Login with Google"
   ↓
2. Frontend: window.location.href = 'http://localhost:3000/api/auth/google'
   ↓
3. Backend: Passport Google OAuth flow
   ↓
4. User grants permission to Google
   ↓
5. Google redirects: 'http://localhost:3000/api/auth/google/callback?code=...'
   ↓
6. Backend Passport verifies and stores user in req.user
   ↓
7. Backend: generateToken, store in Redis with sessionId
   ↓
8. Backend: res.redirect('http://localhost:4200/auth/callback?session=...')
   ↓
9. Frontend: Extract sessionId from URL
   ↓
10. Frontend: GET /auth/oauth-data/{sessionId}
   ↓
11. Backend: Retrieve from Redis, delete session
   ↓
12. Frontend: localStorage.setItem('token'), navigate to dashboard
   ✅ Success!
```

## 📝 Checklist Verifica

- [ ] CORS configurato con `credentials: true`
- [ ] Cookie `sameSite: 'lax'` impostato
- [ ] FRONTEND_URL nel .env = `http://localhost:4200`
- [ ] GOOGLE_CLIENT_ID e SECRET nel .env
- [ ] GOOGLE_REDIRECT_URI = `http://localhost:3000/api/auth/google/callback`
- [ ] Redis funziona (`redis-cli ping`)
- [ ] Backend riavviato dopo cambiamenti
- [ ] Frontend riavviato con `ng serve`
- [ ] No errors in console browser
- [ ] No errors in server logs
- [ ] Login OAuth completa in < 10 secondi

## 🔄 Prossimi Passi (Recommended)

1. **Aggiungere refresh token** per sessioni lunghe
2. **Implementare PKCE** per OAuth security
3. **Aggiungere rate limiting** su `/auth/oauth-data/:session`
4. **Setup email verification** per OAuth users
5. **Testare su mobile** con popup OAuth
