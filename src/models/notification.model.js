import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: {
    type: Number,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['registration', 'unregistration', 'report'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  color: {
    type: String,
    enum: ['success', 'danger', 'warning', 'info'],
    required: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  read: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Scade dopo 30 giorni
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    },
    index: { expires: 0 }
  }
}, {
  timestamps: true
});

// Indici per query efficienti
notificationSchema.index({ userId: 1, timestamp: -1 });
notificationSchema.index({ userId: 1, read: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;