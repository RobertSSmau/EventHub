# EventHub Chat - Feature Documentation

## 📝 Overview

EventHub chat è un sistema di messaggistica real-time che supporta:
- **Chat dirette** (1-to-1 tra utenti)
- **Chat di gruppo** (basate su eventi)
- **Messaggistica real-time** con Socket.IO
- **REST API** per conversazioni e history
- **Architettura ibrida**: MongoDB per messaggi, PostgreSQL per utenti

---

## 🏗️ Architecture

### Hybrid Database Strategy
```
┌──────────────────┐         ┌──────────────────┐
│   PostgreSQL     │         │     MongoDB      │
├──────────────────┤         ├──────────────────┤
│ - Users          │         │ - Conversations  │
│ - Events         │         │ - Messages       │
│ - Registrations  │         │                  │
│ - Reports        │         │                  │
└──────────────────┘         └──────────────────┘
        │                            │
        └────────────┬───────────────┘
                     │
              ┌──────▼──────┐
              │    DTOs     │
              │  (Bridge)   │
              └─────────────┘
```

**Rationale:**
- **MongoDB** per chat: schema flessibile, performance elevate per real-time
- **PostgreSQL** per dati strutturati: utenti, eventi, relazioni
- **DTOs** enrichiscono messaggi MongoDB con dati utente PostgreSQL

---

## 🗂️ File Structure

```
src/
├── config/
│   ├── mongodb.js          # MongoDB connection management
│   └── socket.js           # Socket.IO server + event handlers
├── models/
│   └── chat/
│       ├── conversation.model.js  # Conversation schema (Mongoose)
│       └── message.model.js       # Message schema (Mongoose)
├── dto/
│   └── chat.dto.js         # MessageDTO, ConversationDTO (enrichment)
├── controllers/
│   └── chat.controller.js  # REST API logic
└── routes/
    └── chat.routes.js      # REST endpoints + validation

docs/
└── CHAT_FRONTEND_GUIDE.md  # Frontend integration guide
```

---

## 📦 Dependencies

```json
{
  "socket.io": "^4.8.1",        // Real-time bidirectional communication
  "mongoose": "^8.9.4"          // MongoDB ODM
}
```

---

## 🔧 Configuration

### Environment Variables
```bash
# MongoDB connection string
MONGODB_URL=mongodb://localhost:27017/eventhub_chat

# Client URL for CORS and Socket.IO
CLIENT_URL=http://localhost:3000
```

### MongoDB Setup Options

#### Option 1: Local MongoDB
```bash
# Install MongoDB locally
# Windows: Download from mongodb.com
# Mac: brew install mongodb-community
# Linux: sudo apt install mongodb

# Start MongoDB
mongod --dbpath C:\data\db
```

#### Option 2: MongoDB Atlas (Free Tier)
1. Vai su [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Crea account gratuito
3. Crea cluster (M0 Free)
4. Ottieni connection string
5. Aggiungi al `.env`: `MONGODB_URL=mongodb+srv://user:pass@cluster.mongodb.net/eventhub_chat`

---

## 📊 Data Models

### Conversation Schema (MongoDB)
```javascript
{
  type: 'direct' | 'event_group',
  participants: [userId1, userId2, ...],  // PostgreSQL user IDs
  eventId: Number,                        // For event_group type
  name: String,                           // Group name (optional)
  lastMessage: {
    content: String,
    senderId: Number,
    timestamp: Date
  },
  unreadCount: Map<String, Number>,       // userId -> unread count
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `participants` (multikey)
- `eventId`
- `type`
- `updatedAt` (descending)

### Message Schema (MongoDB)
```javascript
{
  conversationId: ObjectId,
  senderId: Number,                       // PostgreSQL user ID
  content: String,
  type: 'text' | 'image' | 'file' | 'system',
  fileUrl: String,                        // For image/file types
  readBy: [userId1, userId2, ...],
  isEdited: Boolean,
  isDeleted: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `conversationId` + `createdAt` (descending) - per paginazione
- `senderId`

---

## 🎯 Features

### ✅ Implemented

#### Real-time Messaging (Socket.IO)
- ✅ JWT authentication middleware
- ✅ Connection/disconnection tracking
- ✅ Active users Map (userId → socketId)
- ✅ Room-based messaging (conversation rooms)
- ✅ Message sending and broadcasting
- ✅ Typing indicators (`typing:start`, `typing:stop`)
- ✅ Read receipts (`message:read`)
- ✅ Online/offline status broadcasting
- ✅ Message editing/deletion events

#### REST API
- ✅ `GET /conversations` - Lista conversazioni con paginazione
- ✅ `POST /conversations/direct` - Crea/trova chat 1-to-1
- ✅ `POST /conversations/event/:id` - Join group chat evento
- ✅ `GET /conversations/:id/messages` - History con paginazione
- ✅ `POST /conversations/:id/messages` - Invia messaggio (alternativa REST)
- ✅ `POST /conversations/:id/read` - Marca come letto
- ✅ `PATCH /messages/:id` - Modifica messaggio
- ✅ `DELETE /messages/:id` - Elimina messaggio (soft delete)
- ✅ `GET /online?userIds=1,2,3` - Check online status

#### Data Transfer Objects (DTOs)
- ✅ `MessageDTO` - Enrichisce messaggi MongoDB con dati utente PostgreSQL
- ✅ `ConversationDTO` - Include participants info, displayName, unreadCount
- ✅ Batch optimization con Map per O(1) lookup
- ✅ Integrazione Socket.IO + REST API

#### Models & Methods
**Conversation Model:**
- ✅ `findOrCreateDirect(userId1, userId2)` - Trova o crea chat diretta
- ✅ `findOrCreateEventGroup(eventId, name)` - Trova o crea group chat
- ✅ `addParticipant(userId)` - Aggiungi partecipante
- ✅ `incrementUnread(excludeUserId)` - Incrementa unread per tutti tranne mittente
- ✅ `markAsRead(userId)` - Reset unread count

**Message Model:**
- ✅ `markAsReadBy(userId)` - Aggiungi a readBy array
- ✅ `editContent(newContent)` - Modifica contenuto
- ✅ `softDelete()` - Soft delete (isDeleted = true)

---

## 🔐 Security

### Authentication
- **Socket.IO**: JWT token in handshake (`auth.token`)
- **REST API**: Bearer token in Authorization header
- Middleware `verifyToken` su tutte le routes

### Authorization
- Verifiche partecipanti su tutte le operazioni
- Solo mittente può editare/eliminare messaggi
- Conversazioni accessibili solo ai partecipanti

### Input Validation
- Celebrate + Joi su tutte le routes
- Max content length: 5000 caratteri
- Type validation per enum (message type, conversation type)

---

## 🚀 Usage Examples

### Backend Setup
```javascript
// server.js (già configurato)
import { createServer } from 'http';
import app from './src/app.js';
import { connectMongoDB } from './src/config/mongodb.js';
import { initSocketIO } from './src/config/socket.js';

const server = createServer(app);
await connectMongoDB();
initSocketIO(server);
server.listen(PORT);
```

### Frontend Socket.IO Connection
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001', {
  auth: { token: localStorage.getItem('token') }
});

socket.on('connect', () => console.log('Connected'));
socket.emit('conversation:join', { conversationId: '...' });
socket.emit('message:send', { conversationId: '...', content: 'Hi!' });
socket.on('message:new', ({ message }) => console.log(message));
```

### Frontend REST API
```javascript
// Lista conversazioni
const conversations = await fetch('/api/chat/conversations', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json());

// Carica history
const { messages, hasMore } = await fetch(
  '/api/chat/conversations/123/messages?limit=50',
  { headers: { 'Authorization': `Bearer ${token}` } }
).then(r => r.json());
```

Vedi `docs/CHAT_FRONTEND_GUIDE.md` per esempi completi React.

---

## 📈 Performance Optimizations

### Database Indexes
- **MongoDB**: Compound index `conversationId + createdAt DESC` per paginazione efficiente
- **MongoDB**: Multikey index su `participants` per query veloci

### Batch Queries (DTOs)
- `MessageDTO.fromMessages()` fetches tutti gli utenti in una query
- Crea Map per O(1) lookup invece di N queries

### Socket.IO Rooms
- Messaging room-based riduce broadcast overhead
- Solo partecipanti ricevono messaggi (non global broadcast)

### Pagination
- `?limit=50&before=timestamp` per lazy loading
- Default 50 messaggi, max 100

---

## 🧪 Testing Strategy

### Manual Testing Checklist
- [ ] Connessione Socket.IO con JWT valido
- [ ] Connessione rifiutata con JWT invalido
- [ ] Crea conversazione diretta tra 2 utenti
- [ ] Join event group chat
- [ ] Invia messaggio via Socket.IO
- [ ] Ricevi messaggio real-time
- [ ] Typing indicators funzionano
- [ ] Read receipts aggiornano UI
- [ ] Online/offline status corretto
- [ ] Carica history con paginazione
- [ ] Modifica messaggio
- [ ] Elimina messaggio (soft delete)
- [ ] Unread count accurato
- [ ] Multiple tabs stessa chat sincronizzate

### Unit Testing (TODO)
```javascript
// Example test structure
describe('Chat Controller', () => {
  test('creates direct conversation', async () => {
    const res = await request(app)
      .post('/api/chat/conversations/direct')
      .set('Authorization', `Bearer ${token}`)
      .send({ otherUserId: 2 });
    
    expect(res.status).toBe(201);
    expect(res.body.type).toBe('direct');
  });
});
```

---

## 📚 API Documentation

### Swagger Integration
Tutte le routes hanno commenti Swagger:
```javascript
/**
 * @swagger
 * /api/chat/conversations:
 *   get:
 *     summary: Get all conversations
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of conversations
 */
```

Accedi a Swagger UI su: `http://localhost:3001/api-docs`

---

## 🐛 Known Issues & Limitations

### Current Limitations
1. **File uploads**: Schema supporta `fileUrl`, ma upload non implementato
   - TODO: Integra multer/cloudinary per image/file uploads
2. **Message search**: Nessuna ricerca full-text
   - TODO: Aggiungi text index MongoDB
3. **Push notifications**: Nessuna notifica quando offline
   - TODO: Integra Firebase/OneSignal
4. **Video/Voice calls**: Non supportato
   - TODO: Integra WebRTC

### Potential Improvements
- [ ] Message reactions (emoji)
- [ ] Message threading (risposte)
- [ ] User blocking
- [ ] Media gallery per chat
- [ ] Export chat history
- [ ] Voice messages
- [ ] GIF support
- [ ] Link previews
- [ ] Message forwarding

---

## 🔄 Migration Path

### From PostgreSQL to Hybrid (Completed)
1. ✅ Installato Socket.IO + mongoose
2. ✅ Creato MongoDB config
3. ✅ Definiti schemas Conversation + Message
4. ✅ Implementato Socket.IO server
5. ✅ Creato DTO system per enrichment
6. ✅ Implementato REST API
7. ✅ Aggiornato server.js con HTTP server

### Next Steps (If Scaling)
- Redis per Socket.IO adapter (multi-server deployment)
- MongoDB sharding per scalabilità
- CDN per media files
- Message queue (RabbitMQ) per reliable delivery

---

## 📖 References

- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Frontend Guide: `docs/CHAT_FRONTEND_GUIDE.md`

---

**Feature Status**: ✅ Complete & Ready for Testing

**Branch**: `feature/chat`

**Next Steps**: 
1. Aggiungi `MONGODB_URL` al tuo `.env`
2. Avvia MongoDB (locale o Atlas)
3. Testa con frontend client
4. Deploy! 🚀
