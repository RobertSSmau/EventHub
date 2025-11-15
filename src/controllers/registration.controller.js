import { Registration, Event, User } from '../models/index.js';
import { getIO } from '../config/socket.js';
import { saveNotification } from '../services/notification.service.js';

/**
 * @desc Register the logged user to an event
 * @route POST /api/registrations/:eventId
 */
export async function registerToEvent(req, res) {
  const { eventId } = req.params;
  const userId = req.user.id;

  // Event exists or approved
  const event = await Event.findByPk(eventId, {
    include: { model: User, as: 'creator', attributes: ['id', 'username'] }
  });
  if (!event || event.status !== 'APPROVED') {
    return res.status(404).json({ message: 'Event not found or not approved' });
  }

  // Check if user already registered
  const existing = await Registration.findOne({ where: { user_id: userId, event_id: eventId } });
  if (existing) {
    return res.status(400).json({ message: 'Already registered to this event' });
  }

  // Check capacity
  const count = await Registration.count({ where: { event_id: eventId } });
  if (event.capacity && count >= event.capacity) {
    return res.status(400).json({ message: 'Event is full' });
  }

  // Register user
  const registration = await Registration.create({ user_id: userId, event_id: eventId });
  
  // 🔔 REAL-TIME NOTIFICATION to event creator
  try {
    const io = getIO();
    const user = await User.findByPk(userId, { attributes: ['id', 'username', 'email'] });

    const notificationData = {
      eventId: event.id,
      eventTitle: event.title,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      },
      registeredAt: registration.registered_at,
      currentParticipants: count + 1,
      capacity: event.capacity
    };

    // Notify event creator
    io.to(`user:${event.creator_id}`).emit('event:new_registration', notificationData);

    // 💾 Save notification to MongoDB
    await saveNotification({
      userId: event.creator_id,
      type: 'registration',
      title: 'Nuova iscrizione',
      message: `${user.username} si è iscritto a "${event.title}"`,
      icon: '✅',
      color: 'success',
      data: notificationData
    });
  } catch (error) {
    console.error('Error sending real-time notification:', error);
    // Don't fail the request if notification fails
  }
  
  res.status(201).json({ message: 'Registration successful', registration });
}

/**
 * @desc Unregister the logged user from an event
 * @route DELETE /api/registrations/:eventId
 */
export async function unregisterFromEvent(req, res) {
  const { eventId } = req.params;
  const userId = req.user.id;

  const registration = await Registration.findOne({ where: { user_id: userId, event_id: eventId } });
  if (!registration) {
    return res.status(404).json({ message: 'Not registered to this event' });
  }

  // Get event info before deleting registration
  const event = await Event.findByPk(eventId, {
    include: { model: User, as: 'creator', attributes: ['id', 'username'] }
  });
  
  const user = await User.findByPk(userId, { attributes: ['id', 'username'] });
  const count = await Registration.count({ where: { event_id: eventId } });

  await registration.destroy();
  
  // 🔔 REAL-TIME NOTIFICATION to event creator
  try {
    const io = getIO();

    const notificationData = {
      eventId: event.id,
      eventTitle: event.title,
      user: {
        id: user.id,
        username: user.username
      },
      currentParticipants: count - 1,
      capacity: event.capacity
    };

    if (event) {
      io.to(`user:${event.creator_id}`).emit('event:unregistration', notificationData);

      // 💾 Save notification to MongoDB
      await saveNotification({
        userId: event.creator_id,
        type: 'unregistration',
        title: 'Cancellazione iscrizione',
        message: `${user.username} si è cancellato da "${event.title}"`,
        icon: '❌',
        color: 'warning',
        data: notificationData
      });
    }
  } catch (error) {
    console.error('Error sending real-time notification:', error);
  }
  
  res.json({ message: 'Unregistered successfully' });
}

/**
 * @desc Get all events the user is registered to
 * @route GET /api/registrations/mine
 */
export async function getMyRegistrations(req, res) {
  const userId = req.user.id;

  const registrations = await Registration.findAll({
    where: { user_id: userId },
    include: {
      model: Event,
      as: 'event',
      attributes: ['id', 'title', 'category', 'location', 'date', 'description', 'image_url'],
    },
    order: [['registered_at', 'DESC']],
  });

  res.json(registrations);
}
