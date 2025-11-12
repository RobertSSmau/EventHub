# 🔔 Notifiche Real-Time - EventHub

## 📋 Panoramica

EventHub implementa **3 tipi di notifiche real-time** tramite **Socket.IO**:

1. **Iscrizione a eventi** → Notifica al creatore dell'evento
2. **Cancellazione iscrizione** → Notifica al creatore dell'evento  
3. **Nuove segnalazioni** → Notifica a tutti gli admin

---

## 🚀 Implementazione Tecnica

### Architettura

```
Client (Frontend)
    ↓
Socket.IO Connection (JWT Auth)
    ↓
Personal Room: user:${userId}
    ↓
Server emette eventi specifici
```

### File coinvolti

- **`src/config/socket.js`** - Inizializzazione Socket.IO + gestione connessioni
- **`src/controllers/registration.controller.js`** - Notifiche iscrizioni
- **`src/services/report.service.js`** - Notifiche segnalazioni

---

## 📡 EVENTO 1: Nuova Iscrizione Evento

### Trigger
Quando un utente si iscrive a un evento tramite `POST /api/registrations/:eventId`

### Destinatario
Creatore dell'evento

### Socket Event
```javascript
'event:new_registration'
```

### Payload
```json
{
  "eventId": 5,
  "eventTitle": "Concerto Rock 2025",
  "user": {
    "id": 12,
    "username": "mario_rossi",
    "email": "mario@example.com"
  },
  "registeredAt": "2025-11-12T10:30:00.000Z",
  "currentParticipants": 25,
  "capacity": 100
}
```

### Esempio Client (JavaScript)
```javascript
socket.on('event:new_registration', (data) => {
  console.log(`📢 Nuova iscrizione da ${data.user.username}!`);
  console.log(`Evento: ${data.eventTitle}`);
  console.log(`Partecipanti: ${data.currentParticipants}/${data.capacity}`);
  
  // Mostra notifica toast
  showNotification({
    title: 'Nuova Iscrizione!',
    message: `${data.user.username} si è iscritto a ${data.eventTitle}`,
    type: 'success'
  });
  
  // Aggiorna UI contatore partecipanti
  updateEventParticipants(data.eventId, data.currentParticipants);
});
```

---

## 📡 EVENTO 2: Cancellazione Iscrizione

### Trigger
Quando un utente cancella l'iscrizione tramite `DELETE /api/registrations/:eventId`

### Destinatario
Creatore dell'evento

### Socket Event
```javascript
'event:unregistration'
```

### Payload
```json
{
  "eventId": 5,
  "eventTitle": "Concerto Rock 2025",
  "user": {
    "id": 12,
    "username": "mario_rossi"
  },
  "currentParticipants": 24,
  "capacity": 100
}
```

### Esempio Client (JavaScript)
```javascript
socket.on('event:unregistration', (data) => {
  console.log(`📢 ${data.user.username} ha cancellato l'iscrizione`);
  
  showNotification({
    title: 'Cancellazione Iscrizione',
    message: `${data.user.username} non parteciperà più a ${data.eventTitle}`,
    type: 'warning'
  });
  
  updateEventParticipants(data.eventId, data.currentParticipants);
});
```

---

## 📡 EVENTO 3: Nuova Segnalazione (Admin Only)

### Trigger
Quando un utente segnala un evento tramite `POST /api/reports`

### Destinatari
**Tutti gli utenti con ruolo ADMIN**

### Socket Event
```javascript
'report:new'
```

### Payload
```json
{
  "reportId": 8,
  "reason": "inappropriate_content",
  "description": "Contenuto offensivo nella descrizione evento",
  "reporter": {
    "id": 15,
    "username": "luca_verdi"
  },
  "event": {
    "id": 23,
    "title": "Evento Sospetto",
    "event_date": "2025-12-01T18:00:00.000Z",
    "location": "Milano"
  },
  "createdAt": "2025-11-12T11:45:00.000Z"
}
```

### Esempio Client (React/Vue)
```javascript
socket.on('report:new', (data) => {
  console.log(`🚨 Nuova segnalazione #${data.reportId}`);
  
  // Badge notifica nell'admin panel
  incrementReportBadge();
  
  // Notifica visiva
  showAdminNotification({
    title: '🚨 Nuova Segnalazione',
    message: `${data.reporter.username} ha segnalato "${data.event.title}"`,
    reason: data.reason,
    actionUrl: `/admin/reports/${data.reportId}`,
    priority: 'high'
  });
  
  // Suono di notifica (opzionale)
  playNotificationSound();
  
  // Aggiorna lista segnalazioni in tempo reale
  addReportToList(data);
});
```

---

## 🔌 Setup Client (Frontend)

### 1. Connessione Socket.IO

```javascript
import io from 'socket.io-client';

// Connessione con autenticazione JWT
const token = localStorage.getItem('jwt_token');

const socket = io('http://localhost:3000', {
  auth: {
    token: token
  },
  transports: ['websocket', 'polling']
});

// Gestione connessione
socket.on('connect', () => {
  console.log('✅ Connected to EventHub Socket.IO');
  console.log('Socket ID:', socket.id);
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from server');
});

socket.on('error', (error) => {
  console.error('Socket error:', error);
});
```

### 2. Join Personal Room (automatico)

Il server automaticamente assegna ogni utente alla sua stanza personale:

```javascript
// Server-side (già implementato in socket.js)
socket.join(`user:${socket.userId}`);
```

Non serve fare nulla lato client!

### 3. Ascoltare tutti gli eventi

```javascript
// Iscrizioni eventi
socket.on('event:new_registration', handleNewRegistration);
socket.on('event:unregistration', handleUnregistration);

// Segnalazioni (solo per admin)
socket.on('report:new', handleNewReport);

// Chat (già implementato)
socket.on('message:new', handleNewMessage);
socket.on('typing:start', handleTypingStart);
socket.on('typing:stop', handleTypingStop);
```

---

## 🎯 Esempi Pratici

### React Hook personalizzato

```javascript
// hooks/useEventNotifications.js
import { useEffect } from 'react';
import { useSocket } from './useSocket';
import { toast } from 'react-toastify';

export function useEventNotifications() {
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    // Nuova iscrizione
    socket.on('event:new_registration', (data) => {
      toast.success(
        `🎉 ${data.user.username} si è iscritto a ${data.eventTitle}!`,
        {
          position: 'top-right',
          autoClose: 5000,
          onClick: () => navigateTo(`/events/${data.eventId}`)
        }
      );
    });

    // Cancellazione
    socket.on('event:unregistration', (data) => {
      toast.warning(
        `${data.user.username} ha cancellato l'iscrizione da ${data.eventTitle}`
      );
    });

    return () => {
      socket.off('event:new_registration');
      socket.off('event:unregistration');
    };
  }, [socket]);
}
```

### Vue.js Composable

```javascript
// composables/useReportNotifications.js
import { onMounted, onUnmounted } from 'vue';
import { useSocket } from './useSocket';
import { useToast } from 'vue-toastification';

export function useReportNotifications() {
  const socket = useSocket();
  const toast = useToast();

  const handleNewReport = (data) => {
    toast.error(
      `🚨 Nuova segnalazione da ${data.reporter.username}`,
      {
        timeout: 0, // Non chiudere automaticamente
        action: {
          text: 'Visualizza',
          onClick: () => router.push(`/admin/reports/${data.reportId}`)
        }
      }
    );
  };

  onMounted(() => {
    if (socket) {
      socket.on('report:new', handleNewReport);
    }
  });

  onUnmounted(() => {
    if (socket) {
      socket.off('report:new', handleNewReport);
    }
  });
}
```

---

## 🧪 Testing Notifiche

### Test manuale con Browser Console

```javascript
// 1. Connetti Socket.IO
const socket = io('http://localhost:3000', {
  auth: { token: 'YOUR_JWT_TOKEN' }
});

// 2. Ascolta tutti gli eventi
socket.onAny((eventName, ...args) => {
  console.log(`📡 Evento: ${eventName}`, args);
});

// 3. Testa iscrizione evento
fetch('http://localhost:3000/api/registrations/5', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
});
// → Aspettati evento 'event:new_registration'
```

### Test con Postman + Socket.IO Client

1. **Scarica:** Socket.IO Client Chrome Extension
2. **Connetti:** `ws://localhost:3000?token=YOUR_JWT`
3. **Esegui API:** POST `/api/registrations/5`
4. **Verifica:** Ricevi evento `event:new_registration`

---

## 📊 Monitoring Notifiche

### Server Logs

```bash
📢 Notified creator 7 of new registration to event 5
📢 Notified creator 7 of unregistration from event 5
📢 Notified 2 admin(s) of new report #8
```

### Debug Mode

```javascript
// Abilita debug Socket.IO
localStorage.debug = 'socket.io-client:socket';

// Ricarica pagina e controlla console
```

---

## 🔒 Sicurezza

### Autenticazione JWT obbligatoria

```javascript
// socket.js - Middleware auth (già implementato)
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication required'));
  
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  socket.userId = decoded.id;
  next();
});
```

### Stanze private per utente

Solo l'utente con `userId = 7` riceve eventi inviati a `user:7`

### Notifiche admin verificate

```javascript
// Verifica ruolo ADMIN prima di inviare
const adminUsers = await User.findAll({ where: { role: 'ADMIN' } });
```

---

## 🚀 Deployment Considerations

### Variabili ambiente

```env
# .env
CLIENT_URL=https://eventhub-frontend.vercel.app
```

### CORS Socket.IO

```javascript
// socket.js
cors: {
  origin: process.env.CLIENT_URL,
  methods: ['GET', 'POST'],
  credentials: true
}
```

### Load Balancing (Redis Adapter)

Per deployment multi-istanza (es. Render con autoscaling):

```javascript
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));
```

---

## 📚 Eventi Socket.IO Completi

| Evento | Destinatario | Trigger |
|--------|--------------|---------|
| `event:new_registration` | Creatore evento | POST /api/registrations/:eventId |
| `event:unregistration` | Creatore evento | DELETE /api/registrations/:eventId |
| `report:new` | Admin | POST /api/reports |
| `message:new` | Partecipanti chat | Socket 'message:send' |
| `message:read` | Sender messaggio | Socket 'message:read' |
| `typing:start` | Partecipanti chat | Socket 'typing:start' |
| `typing:stop` | Partecipanti chat | Socket 'typing:stop' |
| `user:online` | Tutti | Socket connect |
| `user:offline` | Tutti | Socket disconnect |

---

## ✅ Checklist Implementazione Frontend

- [ ] Installare `socket.io-client`
- [ ] Creare hook/composable per Socket.IO
- [ ] Implementare autenticazione JWT
- [ ] Gestire riconnessione automatica
- [ ] Ascoltare eventi notifiche
- [ ] Implementare UI toast/banner
- [ ] Aggiornare UI in tempo reale
- [ ] Testare con utenti multipli
- [ ] Gestire errori connessione
- [ ] Implementare fallback REST API

---

**🎉 Le notifiche real-time sono ora completamente implementate!**
