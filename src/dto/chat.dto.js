/**
 * Chat DTOs - Simplified
 */

import { User } from '../models/index.js';
import { userDTO } from './user.dto.js';

/**
 * Enrich messages with sender info from PostgreSQL
 */
export async function enrichMessages(messages) {
  // Safety check: ensure messages is an array
  if (!Array.isArray(messages)) {
    console.warn('enrichMessages: messages is not an array', typeof messages);
    return [];
  }
  
  if (!messages.length) return [];

  // Fetch all senders in one query
  const senderIds = [...new Set(messages.map((m) => m.senderId))];
  const senders = await User.findAll({
    where: { id: senderIds },
    attributes: ['id', 'username', 'email'],
  });

  const sendersMap = new Map(senders.map((s) => [s.id, s]));

  // Add sender info to each message
  return messages.map((msg) => {
    const msgObj = msg.toObject ? msg.toObject() : msg;
    const sender = sendersMap.get(msg.senderId);
    
    return {
      ...msgObj,
      sender: sender ? userDTO(sender) : null,
    };
  });
}

/**
 * Enrich conversations with participants info from PostgreSQL
 */
export async function enrichConversations(conversations, currentUserId) {
  // Safety check: ensure conversations is an array
  if (!Array.isArray(conversations)) {
    console.warn('enrichConversations: conversations is not an array', typeof conversations);
    return [];
  }
  
  if (!conversations.length) return [];

  // Fetch all participants in one query
  const allParticipantIds = [...new Set(conversations.flatMap((c) => c.participants))];
  const participants = await User.findAll({
    where: { id: allParticipantIds },
    attributes: ['id', 'username', 'email'],
  });

  const participantsMap = new Map(participants.map((p) => [p.id, p]));

  // Add participants info to each conversation
  return conversations.map((conv) => {
    const convObj = conv.toObject ? conv.toObject() : conv;
    
    // Get participant details
    const participantsInfo = convObj.participants
      .map((id) => participantsMap.get(id))
      .filter(Boolean)
      .map(userDTO);

    // Get unread count for current user
    // unreadCount is a Map in MongoDB, need to convert to object first
    let unreadCount = 0;
    if (convObj.unreadCount) {
      if (convObj.unreadCount instanceof Map) {
        unreadCount = convObj.unreadCount.get(currentUserId.toString()) || 0;
      } else if (typeof convObj.unreadCount === 'object') {
        // Already converted to plain object
        unreadCount = convObj.unreadCount[currentUserId.toString()] || 0;
      }
    }

    // Generate displayName based on conversation type
    let displayName = '';
    let otherUser = null;
    
    if (convObj.type === 'direct') {
      // For direct chats, use the other user's name
      const otherParticipant = participantsInfo.find((p) => p.id !== currentUserId);
      if (otherParticipant) {
        displayName = otherParticipant.username;
        otherUser = otherParticipant;
      } else {
        displayName = 'Unknown User';
      }
    } else if (convObj.type === 'event_group') {
      // For event groups, use the group name
      displayName = convObj.name || `Event #${convObj.eventId} Chat`;
    }

    return {
      ...convObj,
      participantsInfo,
      otherUser,
      displayName,
      unreadCount,
    };
  });
}
