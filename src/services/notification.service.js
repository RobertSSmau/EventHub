import Notification from '../models/notification.model.js';
import { connectMongoDB } from '../config/mongodb.js';
import { createNotificationObject } from '../dto/notification.dto.js';

/**
 * Salva una notifica nel database MongoDB
 * @param {Object} notificationData - I dati della notifica
 * @param {number} notificationData.userId - ID dell'utente destinatario
 * @param {string} notificationData.type - Tipo di notifica ('registration', 'unregistration', 'report')
 * @param {string} notificationData.title - Titolo della notifica
 * @param {string} notificationData.message - Messaggio della notifica
 * @param {string} notificationData.icon - Icona della notifica
 * @param {string} notificationData.color - Colore della notifica
 * @param {Object} notificationData.data - Dati aggiuntivi della notifica
 */
export async function saveNotification(notificationData) {
  try {
    // Assicurati che MongoDB sia connesso
    await connectMongoDB();

    // Usa il DTO per creare un oggetto standardizzato
    const standardizedData = createNotificationObject(notificationData);

    const notification = new Notification(standardizedData);
    await notification.save();

    return notification;
  } catch (error) {
    console.error('Errore nel salvare la notifica:', error);
    // Non fallire se il salvataggio fallisce
    return null;
  }
}

/**
 * Recupera le notifiche di un utente
 * @param {number} userId - ID dell'utente
 * @param {Object} options - Opzioni di query
 * @param {number} options.limit - Numero massimo di notifiche da recuperare
 * @param {number} options.offset - Offset per paginazione
 * @param {boolean} options.unreadOnly - Recupera solo notifiche non lette
 */
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
    console.error('Errore nel recuperare le notifiche:', error);
    return [];
  }
}

/**
 * Marca una notifica come letta
 * @param {string} notificationId - ID della notifica
 * @param {number} userId - ID dell'utente (per sicurezza)
 */
export async function markNotificationAsRead(notificationId, userId) {
  try {
    await connectMongoDB();

    const result = await Notification.updateOne(
      { _id: notificationId, userId },
      { read: true }
    );

    return result.modifiedCount > 0;
  } catch (error) {
    console.error('Errore nel marcare la notifica come letta:', error);
    return false;
  }
}