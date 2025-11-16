/**
 * Chat Service
 * Business logic for chat operations
 */

import Conversation from '../models/chat/conversation.model.js';
import Message from '../models/chat/message.model.js';
import { enrichMessages, enrichConversations } from '../dto/chat.dto.js';
import { Event, Registration } from '../models/index.js';
import { getIO } from '../config/socket.js';

/**
 * Get all conversations for a user
 */
export async function getUserConversations(userId) {
  const conversations = await Conversation.find({
    participants: userId,
  })
    .sort({ updatedAt: -1 })
    .limit(50);

  return enrichConversations(conversations, userId);
}

/**
 * Create or get direct conversation between two users
 */
export async function createDirectConversation(userId, otherUserId) {
  if (userId === otherUserId) {
    throw new Error('Cannot chat with yourself');
  }

  const conversation = await Conversation.findOrCreateDirect(userId, otherUserId);
  const [enriched] = await enrichConversations([conversation], userId);

  return {
    conversation: enriched,
    isNew: conversation.participants.length === 2,
  };
}

/**
 * Create or get event group conversation
 */
export async function createEventGroupConversation(userId, eventId) {
  // Verify event exists
  const event = await Event.findByPk(eventId);
  if (!event) {
    throw new Error('Event not found');
  }

  // Check if user is registered for the event
  const registration = await Registration.findOne({
    where: { user_id: userId, event_id: eventId },
  });
  if (!registration) {
    throw new Error('You must be registered for this event to join the chat');
  }

  // Get all registered users for this event
  const registrations = await Registration.findAll({
    where: { event_id: eventId },
    attributes: ['user_id'],
  });

  // Extract user IDs
  const participantIds = registrations.map(reg => reg.user_id);

  // Need at least 2 participants for a conversation
  if (participantIds.length < 2) {
    throw new Error('Cannot create event chat: not enough participants');
  }

  // Get or create conversation
  let conversation = await Conversation.findOne({
    type: 'event_group',
    eventId: parseInt(eventId),
  });

  if (!conversation) {
    conversation = await Conversation.create({
      type: 'event_group',
      eventId: parseInt(eventId),
      name: event.title,
      participants: participantIds,
    });
  } else {
    // Update participants list if needed
    const currentParticipants = new Set(conversation.participants);
    const newParticipants = participantIds.filter(id => !currentParticipants.has(id));
    
    if (newParticipants.length > 0) {
      conversation.participants.push(...newParticipants);
      // Initialize unread count for new participants
      newParticipants.forEach(userId => {
        conversation.unreadCount.set(userId.toString(), 0);
      });
      await conversation.save();
    }
  }

  const [enriched] = await enrichConversations([conversation], userId);
  return enriched;
}

/**
 * Get messages for a conversation with pagination
 */
export async function getConversationMessages(userId, conversationId, options = {}) {
  const { limit = 50, before } = options;

  // Verify user is participant
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw new Error('Conversation not found');
  }

  if (!conversation.participants.includes(userId)) {
    throw new Error('Not authorized');
  }

  // Build query
  const query = { conversationId, isDeleted: false };
  if (before) {
    query.createdAt = { $lt: new Date(before) };
  }

  const messages = await Message.find(query)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

  const enriched = await enrichMessages(messages.reverse());

  return {
    messages: enriched,
    hasMore: messages.length === parseInt(limit),
  };
}

/**
 * Send a message to a conversation
 */
export async function sendMessage(userId, conversationId, content, type = 'text') {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw new Error('Conversation not found');
  }

  if (!conversation.participants.includes(userId)) {
    throw new Error('Not authorized');
  }

  // Create message
  const message = await Message.create({
    conversationId,
    senderId: userId,
    content,
    type,
  });

  // Update conversation
  conversation.lastMessage = {
    content,
    senderId: userId,
    timestamp: message.createdAt,
  };
  await conversation.incrementUnread(userId);
  await conversation.save();

  const [enriched] = await enrichMessages([message]);

  // Emit via Socket.IO if available
  emitSocketEvent(`conversation:${conversationId}`, 'message:new', {
    message: enriched,
    conversation: {
      _id: conversation._id,
      lastMessage: conversation.lastMessage,
      updatedAt: conversation.updatedAt,
    },
  });

  return enriched;
}

/**
 * Mark conversation as read
 */
export async function markConversationAsRead(userId, conversationId) {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw new Error('Conversation not found');
  }

  if (!conversation.participants.includes(userId)) {
    throw new Error('Not authorized');
  }

  await conversation.markAsRead(userId);

  // Mark all messages as read
  await Message.updateMany(
    {
      conversationId,
      senderId: { $ne: userId },
      readBy: { $ne: userId },
    },
    {
      $addToSet: { readBy: userId },
    }
  );

  // Emit event
  emitSocketEvent(`conversation:${conversationId}`, 'conversation:read', {
    conversationId,
    userId,
  });

  return { success: true };
}

/**
 * Delete a message (soft delete)
 */
export async function deleteMessage(userId, messageId) {
  const message = await Message.findById(messageId);
  if (!message) {
    throw new Error('Message not found');
  }

  // Only sender can delete
  if (message.senderId !== userId) {
    throw new Error('Not authorized');
  }

  await message.softDelete();

  // Emit event
  emitSocketEvent(`conversation:${message.conversationId}`, 'message:deleted', {
    messageId: message._id,
  });

  return { success: true };
}

/**
 * Edit a message
 */
export async function editMessage(userId, messageId, newContent) {
  const message = await Message.findById(messageId);
  if (!message) {
    throw new Error('Message not found');
  }

  // Only sender can edit
  if (message.senderId !== userId) {
    throw new Error('Not authorized');
  }

  await message.editContent(newContent);

  const [enriched] = await enrichMessages([message]);

  // Emit event
  emitSocketEvent(`conversation:${message.conversationId}`, 'message:edited', {
    message: enriched,
  });

  return enriched;
}

/**
 * Helper to emit Socket.IO events safely
 */
function emitSocketEvent(room, event, data) {
  try {
    const io = getIO();
    io.to(room).emit(event, data);
  } catch (error) {
    console.warn('Socket.IO not available:', error.message);
  }
}
