/**
 * @file notification.dto.js
 * @description Data Transfer Object (DTO) for filtering and formatting notification data
 *
 * This DTO is used to standardize notification data from MongoDB
 * and enrich it with user information from PostgreSQL when needed
 */

/**
 * Converts a MongoDB notification document into a standardized DTO
 * Enriches with user information when the notification contains user data
 *
 * @param {object} notification - MongoDB notification document
 * @returns {object} - Standardized notification DTO
 */
export function notificationDTO(notification) {
  const dto = {
    id: notification._id.toString(),
    type: notification.type,
    title: notification.title,
    message: notification.message,
    icon: notification.icon,
    color: notification.color,
    timestamp: notification.timestamp,
    read: notification.read,
    data: notification.data
  };

  return dto;
}

/**
 * Enriches multiple notifications with user information
 * Useful when notifications contain user references that need to be resolved
 *
 * @param {Array} notifications - Array of MongoDB notification documents
 * @returns {Promise<Array>} - Array of enriched notification DTOs
 */
export async function enrichNotifications(notifications) {
  if (!Array.isArray(notifications) || !notifications.length) {
    return [];
  }

  // For now, notifications store user data directly in the 'data' field
  // No additional enrichment needed, but this function is ready for future extensions
  // where we might need to fetch additional user details

  return notifications.map(notification => notificationDTO(notification));
}

/**
 * Creates a standardized notification object for saving to MongoDB
 * Ensures consistent structure across the application
 *
 * @param {object} notificationData - Raw notification data
 * @returns {object} - Standardized notification object for MongoDB
 */
export function createNotificationObject(notificationData) {
  const { userId, type, title, message, icon, color, data } = notificationData;

  return {
    userId,
    type,
    title,
    message,
    icon,
    color,
    data,
    timestamp: new Date(),
    read: false
  };
}