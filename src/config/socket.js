/**
 * Socket.IO configuration and setup
 * Real-time chat functionality
 */

import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import Conversation from '../models/chat/conversation.model.js';
import Message from '../models/chat/message.model.js';
import { enrichMessages } from '../dto/chat.dto.js';

let io = null;

// Store active users: userId -> socketId
const activeUsers = new Map();

/**
 * Initialize Socket.IO server
 */
export function initSocketIO(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
  });

  // Authentication middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.username = decoded.username || 'User';
      
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`✅ User ${socket.userId} connected (${socket.id})`);
    
    // Register user as online
    activeUsers.set(socket.userId, socket.id);
    
    // Emit online status to all users
    io.emit('user:online', { 
      userId: socket.userId,
      username: socket.username 
    });

    // Join user's personal room
    socket.join(`user:${socket.userId}`);

    // ===================
    // CONVERSATION EVENTS
    // ===================

    // Join a conversation
    socket.on('conversation:join', async (data) => {
      try {
        const conversationId = typeof data === 'string' ? data : data.conversationId;
        
        console.log(`🔍 Joining conversation: ${conversationId}`);
        
        const conversation = await Conversation.findById(conversationId);
        
        if (!conversation) {
          return socket.emit('error', { message: 'Conversation not found' });
        }

        // Check if user is participant
        if (!conversation.participants.includes(socket.userId)) {
          return socket.emit('error', { message: 'Not authorized' });
        }

        socket.join(`conversation:${conversationId}`);
        console.log(`✅ User ${socket.userId} joined conversation ${conversationId}`);
      } catch (error) {
        console.error('Error joining conversation:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // Leave a conversation
    socket.on('conversation:leave', (data) => {
      const conversationId = typeof data === 'string' ? data : data.conversationId;
      socket.leave(`conversation:${conversationId}`);
      console.log(`User ${socket.userId} left conversation ${conversationId}`);
    });

    // ===================
    // MESSAGE EVENTS
    // ===================

    // Send a message
    socket.on('message:send', async (data) => {
      try {
        const { conversationId, content, type = 'text' } = data;

        const conversation = await Conversation.findById(conversationId);
        
        if (!conversation) {
          return socket.emit('error', { message: 'Conversation not found' });
        }

        if (!conversation.participants.includes(socket.userId)) {
          return socket.emit('error', { message: 'Not authorized' });
        }

        // Create message
        const message = await Message.create({
          conversationId,
          senderId: socket.userId,
          content,
          type,
        });

        // Update conversation last message
        conversation.lastMessage = {
          content,
          senderId: socket.userId,
          timestamp: message.createdAt,
        };

        // Increment unread count for other participants
        await conversation.incrementUnread(socket.userId);
        await conversation.save();

        // Enrich message with sender info
        const [enriched] = await enrichMessages([message]);

        // Emit to all participants in the conversation
        io.to(`conversation:${conversationId}`).emit('message:new', {
          message: enriched,
          conversation: {
            _id: conversation._id,
            lastMessage: conversation.lastMessage,
            updatedAt: conversation.updatedAt,
          },
        });

        // Send push notification to offline users
        conversation.participants.forEach((userId) => {
          if (userId !== socket.userId && !activeUsers.has(userId)) {
            // TODO: Send push notification
            console.log(`📧 Send push notification to user ${userId}`);
          }
        });

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // Mark message as read
    socket.on('message:read', async (data) => {
      try {
        const { messageId, conversationId } = data;

        const message = await Message.findById(messageId);
        if (!message) {
          return socket.emit('error', { message: 'Message not found' });
        }

        await message.markAsReadBy(socket.userId);

        // Notify sender
        io.to(`conversation:${conversationId}`).emit('message:read', {
          messageId,
          readBy: socket.userId,
        });

        // Reset unread count for this user
        const conversation = await Conversation.findById(conversationId);
        if (conversation) {
          await conversation.markAsRead(socket.userId);
        }

      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // User is typing
    socket.on('typing:start', (data) => {
      const { conversationId } = data;
      socket.to(`conversation:${conversationId}`).emit('typing:start', {
        userId: socket.userId,
        username: socket.username,
      });
    });

    // User stopped typing
    socket.on('typing:stop', (data) => {
      const { conversationId } = data;
      socket.to(`conversation:${conversationId}`).emit('typing:stop', {
        userId: socket.userId,
      });
    });

    // ===================
    // DISCONNECT
    // ===================

    socket.on('disconnect', () => {
      console.log(`❌ User ${socket.userId} disconnected`);
      activeUsers.delete(socket.userId);
      
      // Emit offline status
      io.emit('user:offline', { userId: socket.userId });
    });
  });

  console.log('✅ Socket.IO initialized');
  return io;
}

/**
 * Get Socket.IO instance
 */
export function getIO() {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
}

/**
 * Get active users
 */
export function getActiveUsers() {
  return Array.from(activeUsers.keys());
}

/**
 * Check if user is online
 */
export function isUserOnline(userId) {
  return activeUsers.has(userId);
}
