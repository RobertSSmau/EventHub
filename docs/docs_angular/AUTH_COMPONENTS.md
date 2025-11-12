# 🔐 Auth Components - Documentazione

## ✅ Componenti Implementati

### 1. **Login Component** (`features/auth/login/`)

**Features:**
- ✅ Form con validazione email e password
- ✅ Gestione errori dal backend
- ✅ Loading state durante la chiamata API
- ✅ Redirect automatico a `/events` dopo login
- ✅ Link a registrazione
- ✅ Design responsive con gradient background

**Campi:**
- Email (required, formato email)
- Password (required)

**API Endpoint:**
```typescript
POST /api/auth/login
Body: { email: string, password: string }
Response: { token: string, user: User }
```

---

### 2. **Register Component** (`features/auth/register/`)

**Features:**
- ✅ Form completo di registrazione
- ✅ Validazione username, email, password
- ✅ Conferma password con match validation
- ✅ Password minimo 6 caratteri
- ✅ Feedback visivo real-time (✓ passwords match)
- ✅ Success animation dopo registrazione
- ✅ Auto-login dopo registrazione
- ✅ Redirect automatico a `/events`
- ✅ Link a login
- ✅ Design responsive

**Campi:**
- Username (required, min 3 caratteri)
- Email (required, formato email)
- Password (required, min 6 caratteri)
- Confirm Password (required, deve matchare)

**Validazioni Real-time:**
- ❌ Password troppo corta → messaggio errore rosso
- ❌ Password non matchano → messaggio errore rosso
- ✅ Password matchano → messaggio verde con checkmark

**API Endpoint:**
```typescript
POST /api/auth/register
Body: { username: string, email: string, password: string }
Response: { token: string, user: User }
```

---

## 🎨 Design System

### Colori
- **Primary Gradient**: `#667eea → #764ba2`
- **Text**: `#2d3748` (dark), `#718096` (gray)
- **Error**: `#e53e3e` (red background: `#fff5f5`)
- **Success**: `#38a169` (green)
- **Border**: `#e2e8f0` (default), `#667eea` (focus)

### Componenti UI
- **Input Fields**: Border 2px, border-radius 8px, focus con shadow
- **Buttons**: Gradient background, hover lift effect
- **Cards**: White background, border-radius 16px, box-shadow
- **Responsive**: Mobile-friendly (padding ridotto < 480px)

---

## 🔄 Flusso Autenticazione

### Login Flow
```
1. User inserisce credenziali
2. Click su "Login"
3. AuthService.login() → API call
4. Backend risponde con token + user
5. Token salvato in localStorage
6. User salvato in localStorage
7. currentUser$ Observable aggiornato
8. Redirect a /events
```

### Register Flow
```
1. User compila form
2. Validazione real-time (password match, lunghezza)
3. Click su "Register"
4. AuthService.register() → API call
5. Backend crea user e risponde con token
6. Token + user salvati (auto-login)
7. Success animation mostrata
8. Dopo 1.5s redirect a /events
```

---

## 🛡️ Sicurezza

### Token Management
- Token JWT salvato in `localStorage`
- Aggiunto automaticamente a ogni richiesta via `JwtInterceptor`
- Header: `Authorization: Bearer <token>`

### Logout
```typescript
authService.logout() // Rimuove token + user da localStorage
```

---

## 📱 Responsive Design

### Mobile (< 480px)
- Padding ridotto: 24px → 40px
- Font size ridotto per h1

### Desktop
- Card centrata verticalmente e orizzontalmente
- Max-width: 420px (login), 450px (register)
- Gradient full-screen background

---

## 🧪 Test Manuali

### Test Login
1. Apri `http://localhost:4200/login`
2. Inserisci email/password validi
3. Verifica redirect a `/events`
4. Verifica token in localStorage (DevTools → Application → Local Storage)

### Test Register
1. Apri `http://localhost:4200/register`
2. Compila tutti i campi
3. Testa validazione password (< 6 caratteri)
4. Testa password mismatch
5. Verifica success animation
6. Verifica auto-login e redirect

### Test Error Handling
1. Inserisci credenziali errate
2. Verifica messaggio errore rosso
3. Verifica che il form rimanga compilato
4. Verifica loading state durante chiamata

---

## 📦 Dipendenze

```typescript
// Services
import { AuthService } from '../../../core/services/auth';

// Models
import { LoginRequest, RegisterRequest, User, AuthResponse } 
  from '../../../shared/models/user.model';

// Angular
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
```

---

## 🚀 Prossimi Passi

- [ ] Email verification flow
- [ ] Password reset/forgot password
- [ ] Social login (Google, GitHub)
- [ ] Remember me checkbox
- [ ] Show/hide password toggle
- [ ] Better error messages (field-specific)
- [ ] Loading spinner animation

---

## 📸 Screenshots

### Login
- Clean form con 2 campi
- Gradient background
- Link to register

### Register
- 4 campi con validazione
- Real-time feedback
- Success animation con checkmark icon
- Auto-redirect dopo successo
