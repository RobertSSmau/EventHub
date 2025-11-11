/**
 * Message Model (MongoDB)
 * Represents individual chat messages
 */

import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    senderId: {
      type: Number,
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    // Message type: text, image, file, system
    type: {
      type: String,
      enum: ['text', 'image', 'file', 'system'],
      default: 'text',
    },
    // For images/files
    fileUrl: {
      type: String,
    },
    // Read receipts
    readBy: {
      type: [Number],
      default: [],
    },
    // For edited messages
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
    },
    // For deleted messages
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: 'messages',
  }
);

// Indexes for performance
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1 });

// Instance method to mark as read by user
messageSchema.methods.markAsReadBy = async function (userId) {
  if (!this.readBy.includes(userId) && this.senderId !== userId) {
    this.readBy.push(userId);
    await this.save();
  }
};

// Instance method to edit message
messageSchema.methods.editContent = async function (newContent) {
  this.content = newContent;
  this.isEdited = true;
  this.editedAt = new Date();
  await this.save();
};

// Instance method to soft delete
messageSchema.methods.softDelete = async function () {
  this.isDeleted = true;
  this.content = 'This message was deleted';
  await this.save();
};

// Virtual for read status
messageSchema.virtual('isRead').get(function () {
  return this.readBy.length > 0;
});

// Ensure virtuals are included in JSON
messageSchema.set('toJSON', { virtuals: true });
messageSchema.set('toObject', { virtuals: true });

const Message = mongoose.model('Message', messageSchema);

export default Message;
