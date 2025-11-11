# EventHub Chat - Frontend Integration Guide

## Overview
EventHub chat utilizza un approccio **ibrido**:
- **Socket.IO** per messaggi real-time
- **REST API** per conversazioni, history, e operazioni CRUD

## 🚀 Quick Start

### 1. Installazione Client
```bash
npm install socket.io-client
```

### 2. Connessione Socket.IO

```javascript
import { io } from 'socket.io-client';

// Dopo il login, usa il JWT token
const token = localStorage.getItem('token');

const socket = io('http://localhost:3001', {
  auth: { token },
  autoConnect: false
});

// Connetti
socket.connect();

// Eventi di connessione
socket.on('connect', () => {
  console.log('✅ Connected to chat');
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
});
```

### 3. Eventi Socket.IO

#### **Join Conversation**
```javascript
// Prima di iniziare a chattare, join alla conversazione
socket.emit('conversation:join', {
  conversationId: '507f1f77bcf86cd799439011'
});
```

#### **Inviare Messaggi**
```javascript
socket.emit('message:send', {
  conversationId: '507f1f77bcf86cd799439011',
  content: 'Ciao!',
  type: 'text' // 'text', 'image', 'file', 'system'
});
```

#### **Ricevere Messaggi**
```javascript
socket.on('message:new', (data) => {
  const { message, conversation } = data;
  
  // message include:
  // - _id
  // - content
  // - type
  // - sender: { id, username, email }
  // - createdAt
  // - isEdited
  
  console.log('📩 Nuovo messaggio da:', message.sender.username);
  console.log('Contenuto:', message.content);
  
  // Aggiorna la UI
  addMessageToChat(message);
});
```

#### **Indicatori di Typing**
```javascript
// Invia "sta scrivendo..."
socket.emit('typing:start', {
  conversationId: '507f1f77bcf86cd799439011'
});

// Ricevi "X sta scrivendo..."
socket.on('typing:start', ({ userId, username, conversationId }) => {
  showTypingIndicator(username);
});

// Stop typing
socket.emit('typing:stop', {
  conversationId: '507f1f77bcf86cd799439011'
});

socket.on('typing:stop', ({ userId, conversationId }) => {
  hideTypingIndicator();
});
```

#### **Read Receipts**
```javascript
// Marca messaggio come letto
socket.emit('message:read', {
  messageId: '507f191e810c19729de860ea'
});

// Ricevi conferma lettura
socket.on('message:read', ({ messageId, userId }) => {
  markMessageAsRead(messageId, userId);
});
```

#### **Online/Offline Status**
```javascript
socket.on('user:online', ({ userId, username }) => {
  updateUserStatus(userId, true);
});

socket.on('user:offline', ({ userId }) => {
  updateUserStatus(userId, false);
});
```

#### **Message Edited/Deleted**
```javascript
socket.on('message:edited', ({ message }) => {
  updateMessageInUI(message);
});

socket.on('message:deleted', ({ messageId }) => {
  removeMessageFromUI(messageId);
});
```

---

## 📡 REST API Endpoints

### **Get Conversations List**
```javascript
const response = await fetch('http://localhost:3001/api/chat/conversations', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const conversations = await response.json();

// Ogni conversazione include:
// - _id
// - type: 'direct' | 'event_group'
// - participants: [{ id, username, email }]
// - displayName: (nome visualizzato)
// - otherUser: (solo per direct chat)
// - lastMessage: { content, senderId, timestamp }
// - unreadCount: (numero messaggi non letti)
// - updatedAt
```

### **Create Direct Conversation**
```javascript
const response = await fetch('http://localhost:3001/api/chat/conversations/direct', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    otherUserId: 42
  })
});
const conversation = await response.json();
```

### **Join Event Group Chat**
```javascript
const response = await fetch('http://localhost:3001/api/chat/conversations/event/123', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const conversation = await response.json();
```

### **Get Message History**
```javascript
// Con paginazione
const response = await fetch(
  'http://localhost:3001/api/chat/conversations/507f.../messages?limit=50',
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);
const { messages, hasMore } = await response.json();

// Carica messaggi più vecchi
const beforeDate = messages[0].createdAt;
const olderMessages = await fetch(
  `http://localhost:3001/api/chat/conversations/507f.../messages?limit=50&before=${beforeDate}`,
  { headers: { 'Authorization': `Bearer ${token}` } }
);
```

### **Mark Conversation as Read**
```javascript
await fetch('http://localhost:3001/api/chat/conversations/507f.../read', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### **Edit Message**
```javascript
await fetch('http://localhost:3001/api/chat/messages/507f...', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    content: 'Messaggio modificato'
  })
});
```

### **Delete Message**
```javascript
await fetch('http://localhost:3001/api/chat/messages/507f...', {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### **Check Online Status**
```javascript
const response = await fetch(
  'http://localhost:3001/api/chat/online?userIds=1,2,3',
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);
const onlineStatus = await response.json();
// [{ userId: 1, isOnline: true }, ...]
```

---

## 🎨 React Example (Complete Chat Component)

```javascript
import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

function ChatComponent({ conversationId, token }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    // Connect Socket.IO
    const socket = io('http://localhost:3001', {
      auth: { token }
    });
    socketRef.current = socket;

    // Join conversation
    socket.emit('conversation:join', { conversationId });

    // Load message history
    fetch(`http://localhost:3001/api/chat/conversations/${conversationId}/messages`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setMessages(data.messages));

    // Listen for new messages
    socket.on('message:new', ({ message }) => {
      setMessages(prev => [...prev, message]);
    });

    // Listen for typing
    socket.on('typing:start', ({ username }) => {
      setIsTyping(username);
    });

    socket.on('typing:stop', () => {
      setIsTyping(false);
    });

    return () => {
      socket.emit('conversation:leave', { conversationId });
      socket.disconnect();
    };
  }, [conversationId, token]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    socketRef.current.emit('message:send', {
      conversationId,
      content: newMessage,
      type: 'text'
    });

    setNewMessage('');
  };

  const handleTyping = () => {
    socketRef.current.emit('typing:start', { conversationId });

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current.emit('typing:stop', { conversationId });
    }, 2000);
  };

  return (
    <div className="chat">
      <div className="messages">
        {messages.map(msg => (
          <div key={msg._id}>
            <strong>{msg.sender.username}:</strong> {msg.content}
          </div>
        ))}
        {isTyping && <div className="typing">{isTyping} sta scrivendo...</div>}
      </div>
      
      <input
        value={newMessage}
        onChange={(e) => {
          setNewMessage(e.target.value);
          handleTyping();
        }}
        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
      />
      <button onClick={handleSendMessage}>Invia</button>
    </div>
  );
}
```

---

## ⚙️ Configuration

### Environment Variables (.env)
```bash
# Backend
PORT=3001
MONGODB_URL=mongodb://localhost:27017/eventhub_chat
JWT_SECRET=your_secret_key
CLIENT_URL=http://localhost:3000
```

### CORS & Socket.IO
Il server è già configurato per accettare connessioni da `CLIENT_URL`.

---

## 📊 Data Flow

```
┌─────────────┐                    ┌─────────────┐
│   Frontend  │                    │   Backend   │
└─────────────┘                    └─────────────┘
       │                                  │
       │  1. Connect Socket.IO            │
       ├─────────────────────────────────►│
       │     (auth: { token })            │
       │                                  │
       │  2. GET /conversations           │
       ├─────────────────────────────────►│
       │◄─────────────────────────────────┤
       │    [list of conversations]       │
       │                                  │
       │  3. conversation:join            │
       ├─────────────────────────────────►│
       │                                  │
       │  4. GET /messages?limit=50       │
       ├─────────────────────────────────►│
       │◄─────────────────────────────────┤
       │    { messages, hasMore }         │
       │                                  │
       │  5. message:send                 │
       ├─────────────────────────────────►│
       │                                  │
       │  6. message:new (broadcast)      │
       │◄─────────────────────────────────┤
       │                                  │
```

---

## 🔧 Troubleshooting

### Socket.IO non si connette
- Verifica che il token JWT sia valido
- Controlla la console per errori CORS
- Assicurati che il backend sia running su `http://localhost:3001`

### Messaggi non arrivano
- Verifica di aver fatto `conversation:join` prima di inviare
- Controlla la console backend per errori MongoDB

### Typing indicators non funzionano
- Assicurati di chiamare `typing:stop` dopo 2-3 secondi
- Verifica che i listener siano attivi

---

## 🎯 Best Practices

1. **Always join before chatting**: `conversation:join` prima di inviare messaggi
2. **Cleanup on unmount**: `socket.disconnect()` quando il componente viene smontato
3. **Lazy load messages**: usa `before` per paginazione infinita
4. **Debounce typing**: invia `typing:start` max ogni 500ms
5. **Mark as read**: quando l'utente vede i messaggi, chiama `POST /read`
6. **Handle offline**: gestisci `connect_error` e mostra UI offline

---

## 📚 API Reference Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chat/conversations` | Lista conversazioni |
| POST | `/api/chat/conversations/direct` | Crea chat 1-to-1 |
| POST | `/api/chat/conversations/event/:id` | Join group chat |
| GET | `/api/chat/conversations/:id/messages` | History con paginazione |
| POST | `/api/chat/conversations/:id/messages` | Invia messaggio (REST) |
| POST | `/api/chat/conversations/:id/read` | Marca come letto |
| PATCH | `/api/chat/messages/:id` | Modifica messaggio |
| DELETE | `/api/chat/messages/:id` | Elimina messaggio |
| GET | `/api/chat/online?userIds=1,2,3` | Online status |

---

## Socket.IO Events Reference

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `conversation:join` | Client → Server | `{ conversationId }` | Join room |
| `conversation:leave` | Client → Server | `{ conversationId }` | Leave room |
| `message:send` | Client → Server | `{ conversationId, content, type }` | Invia messaggio |
| `message:new` | Server → Client | `{ message, conversation }` | Nuovo messaggio |
| `message:read` | Both | `{ messageId }` / `{ messageId, userId }` | Read receipt |
| `message:edited` | Server → Client | `{ message }` | Messaggio modificato |
| `message:deleted` | Server → Client | `{ messageId }` | Messaggio eliminato |
| `typing:start` | Both | `{ conversationId }` / `{ userId, username, conversationId }` | Typing indicator |
| `typing:stop` | Both | `{ conversationId }` / `{ userId, conversationId }` | Stop typing |
| `user:online` | Server → Client | `{ userId, username }` | User online |
| `user:offline` | Server → Client | `{ userId }` | User offline |

---

Buon coding! 🚀
