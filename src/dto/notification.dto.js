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

export async function enrichNotifications(notifications) {
  if (!Array.isArray(notifications) || !notifications.length) {
    return [];
  }

  // For now, notifications store user data directly in the 'data' field
  // No additional enrichment needed, but this function is ready for future extensions
  // where we might need to fetch additional user details

  return notifications.map(notification => notificationDTO(notification));
}

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