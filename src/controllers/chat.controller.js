/**
 * Chat Controller
 * REST endpoints for chat functionality
 */

import * as chatService from '../services/chat.service.js';
import { isUserOnline } from '../config/socket.js';

/**
 * Get all conversations for current user
 * GET /api/chat/conversations
 */
export async function getMyConversations(req, res) {
  try {
    const conversations = await chatService.getUserConversations(req.user.id);
    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: 'Error fetching conversations' });
  }
}

/**
 * Get or create direct conversation with another user
 * POST /api/chat/conversations/direct
 */
export async function createDirectConversation(req, res) {
  try {
    const { otherUserId } = req.body;
    const result = await chatService.createDirectConversation(req.user.id, otherUserId);
    
    const statusCode = result.isNew ? 201 : 200;
    res.status(statusCode).json(result.conversation);
  } catch (error) {
    console.error('Error creating conversation:', error);
    const status = error.message === 'Cannot chat with yourself' ? 400 : 500;
    res.status(status).json({ message: error.message });
  }
}

/**
 * Get or create event group conversation
 * POST /api/chat/conversations/event/:eventId
 */
export async function createEventConversation(req, res) {
  try {
    const { eventId } = req.params;
    const conversation = await chatService.createEventGroupConversation(req.user.id, eventId);
    
    res.json(conversation);
  } catch (error) {
    console.error('Error creating event conversation:', error);
    const status = error.message === 'Event not found' ? 404 : 500;
    res.status(status).json({ message: error.message });
  }
}

/**
 * Get messages for a conversation
 * GET /api/chat/conversations/:conversationId/messages
 */
export async function getConversationMessages(req, res) {
  try {
    const { conversationId } = req.params;
    const { limit, before } = req.query;
    
    const result = await chatService.getConversationMessages(
      req.user.id,
      conversationId,
      { limit, before }
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching messages:', error);
    const status = error.message === 'Conversation not found' ? 404 : 
                   error.message === 'Not authorized' ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
}

/**
 * Send a message (alternative to Socket.IO)
 * POST /api/chat/conversations/:conversationId/messages
 */
export async function sendMessage(req, res) {
  try {
    const { conversationId } = req.params;
    const { content, type = 'text' } = req.body;
    
    const message = await chatService.sendMessage(req.user.id, conversationId, content, type);
    
    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    const status = error.message === 'Conversation not found' ? 404 : 
                   error.message === 'Not authorized' ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
}

/**
 * Mark conversation as read
 * POST /api/chat/conversations/:conversationId/read
 */
export async function markConversationAsRead(req, res) {
  try {
    const { conversationId } = req.params;
    const result = await chatService.markConversationAsRead(req.user.id, conversationId);
    
    res.json({ message: 'Marked as read' });
  } catch (error) {
    console.error('Error marking as read:', error);
    const status = error.message === 'Conversation not found' ? 404 : 
                   error.message === 'Not authorized' ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
}

/**
 * Delete a message
 * DELETE /api/chat/messages/:messageId
 */
export async function deleteMessage(req, res) {
  try {
    const { messageId } = req.params;
    await chatService.deleteMessage(req.user.id, messageId);
    
    res.json({ message: 'Message deleted' });
  } catch (error) {
    console.error('Error deleting message:', error);
    const status = error.message === 'Message not found' ? 404 : 
                   error.message === 'Not authorized' ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
}

/**
 * Edit a message
 * PATCH /api/chat/messages/:messageId
 */
export async function editMessage(req, res) {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    
    const message = await chatService.editMessage(req.user.id, messageId, content);
    
    res.json(message);
  } catch (error) {
    console.error('Error editing message:', error);
    const status = error.message === 'Message not found' ? 404 : 
                   error.message === 'Not authorized' ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
}

/**
 * Get online users
 * GET /api/chat/online
 */
export async function getOnlineUsers(req, res) {
  try {
    const { userIds } = req.query;
    
    if (!userIds) {
      return res.status(400).json({ message: 'userIds query parameter required' });
    }

    const ids = Array.isArray(userIds) ? userIds : userIds.split(',').map(Number);
    const onlineStatus = ids.map((id) => ({
      userId: id,
      isOnline: isUserOnline(id),
    }));

    res.json(onlineStatus);
  } catch (error) {
    console.error('Error getting online users:', error);
    res.status(500).json({ message: 'Error getting online users' });
  }
}
