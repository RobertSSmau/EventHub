import { getUserNotifications, markNotificationAsRead } from '../services/notification.service.js';
import { enrichNotifications } from '../dto/notification.dto.js';

/**
 * @desc Get user's notifications
 * @route GET /api/notifications
 * @access Private
 */
export async function getNotifications(req, res) {
  try {
    const userId = req.user.id;
    const { limit = 50, offset = 0, unreadOnly = false } = req.query;

    const notifications = await getUserNotifications(userId, {
      limit: parseInt(limit),
      offset: parseInt(offset),
      unreadOnly: unreadOnly === 'true'
    });

    // Enrich notifications with DTO formatting
    const enrichedNotifications = await enrichNotifications(notifications);

    res.json({
      success: true,
      notifications: enrichedNotifications,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving notifications'
    });
  }
}

/**
 * @desc Mark notification as read
 * @route PUT /api/notifications/:id/read
 * @access Private
 */
export async function markAsRead(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const success = await markNotificationAsRead(id, userId);

    if (success) {
      res.json({
        success: true,
        message: 'Notifica contrassegnata come letta'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating notification'
    });
  }
}

/**
 * @desc Get notification count
 * @route GET /api/notifications/count
 * @access Private
 */
export async function getNotificationCount(req, res) {
  try {
    const userId = req.user.id;
    const { unreadOnly = true } = req.query;

    const notifications = await getUserNotifications(userId, {
      unreadOnly: unreadOnly === 'true',
      limit: 1000 // Alto limite per contare
    });

    res.json({
      success: true,
      count: notifications.length
    });
  } catch (error) {
    console.error('Error counting notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error counting notifications'
    });
  }
}