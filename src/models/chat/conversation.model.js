/**
 * Conversation Model (MongoDB)
 * Represents a chat conversation (direct or event group)
 */

import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['direct', 'event_group'],
      required: true,
    },
    // For direct chats: [user1_id, user2_id]
    // For event groups: [user1_id, user2_id, user3_id, ...]
    participants: {
      type: [Number],
      required: true,
      validate: {
        validator: function (v) {
          return v.length >= 2;
        },
        message: 'A conversation must have at least 2 participants',
      },
    },
    // For event group chats
    eventId: {
      type: Number,
      required: function () {
        return this.type === 'event_group';
      },
    },
    // Group name (only for event_group)
    name: {
      type: String,
      maxlength: 100,
    },
    // Last message preview
    lastMessage: {
      content: String,
      senderId: Number,
      timestamp: Date,
    },
    // Unread counts per user
    unreadCount: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: 'conversations',
  }
);

// Indexes for performance
conversationSchema.index({ participants: 1 });
conversationSchema.index({ eventId: 1 });
conversationSchema.index({ type: 1 });
conversationSchema.index({ updatedAt: -1 });

// Compound index for finding direct conversations
conversationSchema.index({ type: 1, participants: 1 });

// Static method to find or create direct conversation
conversationSchema.statics.findOrCreateDirect = async function (user1Id, user2Id) {
  const participants = [user1Id, user2Id].sort((a, b) => a - b);
  
  let conversation = await this.findOne({
    type: 'direct',
    participants: { $all: participants, $size: 2 },
  });

  if (!conversation) {
    conversation = await this.create({
      type: 'direct',
      participants,
    });
  }

  return conversation;
};

// Static method to find or create event group
conversationSchema.statics.findOrCreateEventGroup = async function (eventId, eventName) {
  let conversation = await this.findOne({
    type: 'event_group',
    eventId,
  });

  if (!conversation) {
    conversation = await this.create({
      type: 'event_group',
      eventId,
      name: eventName,
      participants: [],
    });
  }

  return conversation;
};

// Instance method to add participant
conversationSchema.methods.addParticipant = async function (userId) {
  if (!this.participants.includes(userId)) {
    this.participants.push(userId);
    this.unreadCount.set(userId.toString(), 0);
    await this.save();
  }
};

// Instance method to remove participant
conversationSchema.methods.removeParticipant = async function (userId) {
  this.participants = this.participants.filter((id) => id !== userId);
  this.unreadCount.delete(userId.toString());
  await this.save();
};

// Instance method to increment unread count for users except sender
conversationSchema.methods.incrementUnread = async function (senderId) {
  this.participants.forEach((userId) => {
    if (userId !== senderId) {
      const current = this.unreadCount.get(userId.toString()) || 0;
      this.unreadCount.set(userId.toString(), current + 1);
    }
  });
  await this.save();
};

// Instance method to reset unread count for a user
conversationSchema.methods.markAsRead = async function (userId) {
  this.unreadCount.set(userId.toString(), 0);
  await this.save();
};

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;
