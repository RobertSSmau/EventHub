# EventHub Frontend - Angular Setup

## 🚀 Struttura Progetto

```
src/app/
├── core/
│   ├── services/
│   │   ├── auth.ts          # Gestione autenticazione JWT
│   │   ├── api.ts           # HTTP client wrapper
│   │   └── socket.ts        # Socket.IO per chat real-time
│   ├── guards/
│   │   └── auth-guard.ts    # Protezione route autenticate
│   └── interceptors/
│       └── jwt-interceptor.ts # Aggiungi JWT token alle richieste
├── features/
│   ├── auth/
│   │   ├── login/           # Componente login
│   │   └── register/        # Componente registrazione
│   └── events/
│       └── event-list/      # Lista eventi
└── shared/
    └── models/              # TypeScript interfaces
        ├── user.model.ts
        ├── event.model.ts
        └── chat.model.ts
```

## ✅ Già Implementato

- ✅ **AuthService**: Login, Register, Logout, JWT token management
- ✅ **ApiService**: HTTP client wrapper per chiamate REST
- ✅ **SocketService**: Socket.IO client per chat real-time
- ✅ **JwtInterceptor**: Aggiunge automaticamente token alle richieste
- ✅ **AuthGuard**: Protegge route che richiedono autenticazione
- ✅ **Login Component**: Form di login funzionante
- ✅ **TypeScript Models**: Interfacce per User, Event, Chat

## 🔧 Configurazione Backend

Il backend deve girare su `http://localhost:3000`

File di configurazione: `src/environments/environment.ts`

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  socketUrl: 'http://localhost:3000'
};
```

## 📝 Prossimi Passi

### 1. Implementare Register Component
```bash
# Il componente è già creato, va implementato come login
```

### 2. Implementare Event Service
```bash
ng generate service features/events/services/event --skip-tests
```

### 3. Implementare Event List
- Chiamata GET `/api/events`
- Visualizzazione lista
- Pulsanti di registrazione

### 4. Implementare Chat
```bash
ng generate component features/chat/chat-window --skip-tests
ng generate service features/chat/services/chat --skip-tests
```

## 🏃‍♂️ Come Eseguire

### Sviluppo
```bash
cd eventhub-frontend
ng serve
```
Apri: `http://localhost:4200`

### Build Produzione
```bash
ng build --configuration production
```

## 🔗 Endpoint Backend Disponibili

### Auth
- POST `/api/auth/register`
- POST `/api/auth/login`
- POST `/api/auth/logout`

### Events
- GET `/api/events`
- POST `/api/events`
- GET `/api/events/:id`
- PATCH `/api/events/:id`
- DELETE `/api/events/:id`

### Registrations
- GET `/api/registrations/mine`
- POST `/api/registrations/:eventId`
- DELETE `/api/registrations/:eventId`

### Chat (Socket.IO)
- Event: `sendMessage`
- Event: `message`
- Event: `markAsRead`

### Users (Admin)
- GET `/api/users`
- PATCH `/api/users/:id/block`
- PATCH `/api/users/:id/unblock`

## 🎨 Styling

Il progetto usa SCSS. Stili già implementati per:
- Login form con design moderno
- Responsive design
- Gradient backgrounds

## 📦 Dipendenze Installate

- `socket.io-client`: Client per comunicazione real-time
- Angular 20 (ultima versione)
- TypeScript
- SCSS

## 🔐 Autenticazione Flow

1. User fa login → riceve JWT token
2. Token salvato in localStorage
3. JwtInterceptor aggiunge token a ogni richiesta HTTP
4. AuthGuard protegge route che richiedono auth
5. Socket.IO usa stesso token per connessione

## 💡 Tips

- Il servizio Auth gestisce automaticamente il token
- Usa `authService.currentUser$` Observable per reagire a cambio utente
- Socket si connette solo dopo login
- Tutte le chiamate HTTP passano attraverso ApiService
