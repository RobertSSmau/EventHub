# 🧪 Test Guide - EventHub Frontend

## ✅ Server Status Check

### Frontend
- URL: http://localhost:4200
- Status: 🟢 RUNNING

### Backend
- URL: http://localhost:3000
- Status: 🟢 RUNNING (già avviato)

---

## 📝 Test Scenarios

### 1. Test Health Check Backend
Verifica che il backend risponda:

```bash
# PowerShell
Invoke-WebRequest -Uri "http://localhost:3000/api/health" -Method GET
```

**Expected Response:**
```json
{
  "status": "ok",
  "message": "EventHub API running"
}
```

---

### 2. Test Register Flow (Frontend → Backend)

**Steps:**
1. Apri `http://localhost:4200`
2. Click su "Register here"
3. Compila il form:
   - Username: `testuser`
   - Email: `test@example.com`
   - Password: `password123`
   - Confirm Password: `password123`
4. Click "Register"

**Expected:**
- ✅ Success animation appare
- ✅ Redirect automatico a `/events` dopo 1.5s
- ✅ Token salvato in localStorage
- ✅ User creato nel database

**Check localStorage (Browser DevTools):**
```
F12 → Application → Local Storage → http://localhost:4200
- token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
- user: {"id":1,"username":"testuser","email":"test@example.com",...}
```

---

### 3. Test Login Flow

**Steps:**
1. Logout (se loggato) - clear localStorage
2. Vai su `http://localhost:4200/login`
3. Inserisci credenziali:
   - Email: `test@example.com`
   - Password: `password123`
4. Click "Login"

**Expected:**
- ✅ Redirect a `/events`
- ✅ Token salvato in localStorage
- ✅ No errori nella console

---

### 4. Test Error Handling

#### Test 1: Invalid Credentials
1. Login con password sbagliata
2. **Expected**: Messaggio errore rosso "Invalid credentials" o simile

#### Test 2: Email già esistente (Register)
1. Prova a registrare stesso user due volte
2. **Expected**: Messaggio errore "Email already exists" o simile

#### Test 3: Password troppo corta
1. Register con password "123"
2. **Expected**: Messaggio "Password must be at least 6 characters"

#### Test 4: Password mismatch
1. Register con password diverse
2. **Expected**: Campo rosso "Passwords do not match"

---

### 5. Test Protected Route

**Steps:**
1. Logout (clear localStorage)
2. Prova ad andare direttamente su `http://localhost:4200/events`

**Expected:**
- ✅ Redirect automatico a `/login`
- ✅ AuthGuard funziona correttamente

---

### 6. Test Network Calls (DevTools)

**Browser DevTools → Network Tab:**

#### Durante Register:
```
POST http://localhost:3000/api/auth/register
Request Headers:
  Content-Type: application/json
Request Body:
  {
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }
Response:
  {
    "token": "eyJhbG...",
    "user": { ... }
  }
```

#### Durante Login:
```
POST http://localhost:3000/api/auth/login
Request Headers:
  Content-Type: application/json
Request Body:
  {
    "email": "test@example.com",
    "password": "password123"
  }
```

---

## 🔍 Common Issues & Solutions

### Issue 1: CORS Error
**Error:** `Access to fetch at 'http://localhost:3000/api/auth/login' from origin 'http://localhost:4200' has been blocked by CORS`

**Solution:** Verifica che il backend abbia CORS abilitato:
```javascript
// src/app.js
app.use(cors());
```

---

### Issue 2: Connection Refused
**Error:** `Failed to fetch` o `ERR_CONNECTION_REFUSED`

**Solution:** 
- Verifica che backend sia in esecuzione sulla porta 3000
- Check: `http://localhost:3000/api/health`

---

### Issue 3: Token non aggiunto alle richieste
**Issue:** Richieste protette falliscono con 401

**Solution:** Verifica che `jwtInterceptor` sia configurato in `app.config.ts`

---

## 🎯 Quick Test Commands

### Test Backend Health
```powershell
curl http://localhost:3000/api/health
```

### Test Register API (direttamente)
```powershell
$body = @{
    username = "testuser2"
    email = "test2@example.com"
    password = "password123"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/auth/register" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"
```

### Test Login API (direttamente)
```powershell
$body = @{
    email = "test2@example.com"
    password = "password123"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/auth/login" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"
```

---

## ✅ Test Checklist

- [ ] Frontend carica su localhost:4200
- [ ] Backend risponde su localhost:3000/api/health
- [ ] Register form appare correttamente
- [ ] Validazione password funziona
- [ ] Registrazione crea user nel DB
- [ ] Token salvato in localStorage dopo register
- [ ] Success animation funziona
- [ ] Redirect a /events dopo register
- [ ] Login form funziona
- [ ] Login con credenziali valide funziona
- [ ] Error handling per credenziali invalide
- [ ] AuthGuard protegge route /events
- [ ] Logout pulisce localStorage
- [ ] Styling responsive funziona su mobile

---

## 🚀 Next Steps After Tests Pass

1. Implementare **Event List Component**
2. Implementare **Event Service**
3. Implementare **Chat Component** con Socket.IO
4. Implementare **Admin Dashboard**
5. Aggiungere **Email Verification Flow**

---

**Buon testing! 🎉**
