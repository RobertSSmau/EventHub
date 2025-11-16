import Notification from '../models/notification.model.js';
import { connectMongoDB } from '../config/mongodb.js';
import { createNotificationObject } from '../dto/notification.dto.js';

export async function saveNotification(notificationData) {
  try {
    // Ensure MongoDB is connected
    await connectMongoDB();

    // Use DTO to create standardized object
    const standardizedData = createNotificationObject(notificationData);

    const notification = new Notification(standardizedData);
    await notification.save();

    return notification;
  } catch (error) {
    console.error('Error saving notification:', error);
    // Don't fail if saving fails
    return null;
  }
}

export async function getUserNotifications(userId, options = {}) {
  try {
    await connectMongoDB();

    const { limit = 50, offset = 0, unreadOnly = false } = options;

    const query = { userId };
    if (unreadOnly) {
      query.read = false;
    }

    const notifications = await Notification
      .find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(offset)
      .lean();

    return notifications;
  } catch (error) {
    console.error('Error retrieving notifications:', error);
    return [];
  }
}

export async function markNotificationAsRead(notificationId, userId) {
  try {
    await connectMongoDB();

    const result = await Notification.updateOne(
      { _id: notificationId, userId },
      { read: true }
    );

    return result.modifiedCount > 0;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
}