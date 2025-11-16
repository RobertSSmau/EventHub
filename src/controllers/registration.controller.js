import { Registration, Event, User, sequelize } from '../models/index.js';
import { getIO } from '../config/socket.js';
import { saveNotification } from '../services/notification.service.js';

/**
 * Helper function to send registration/unregistration notifications
 */
async function sendRegistrationNotification(event, user, currentParticipants, type, registration = null) {
  const io = getIO();

  const notificationData = {
    eventId: event.id,
    eventTitle: event.title,
    user: {
      id: user.id,
      username: user.username,
      ...(type === 'registration' && { email: user.email })
    },
    currentParticipants,
    capacity: event.capacity,
    ...(type === 'registration' && registration && { registeredAt: registration.registered_at })
  };

  const eventName = type === 'registration' ? 'event:new_registration' : 'event:unregistration';
  const title = type === 'registration' ? 'New registration' : 'Registration cancelled';
  const message = type === 'registration'
    ? `${user.username} registered for "${event.title}"`
    : `${user.username} unregistered from "${event.title}"`;
  const icon = type === 'registration' ? '✅' : '❌';
  const color = type === 'registration' ? 'success' : 'warning';

  try {
    io.to(`user:${event.creator_id}`).emit(eventName, notificationData);

    await saveNotification({
      userId: event.creator_id,
      type,
      title,
      message,
      icon,
      color,
      data: notificationData
    });
  } catch (error) {
    console.error(`Error sending ${type} real-time notification:`, error);
  }
}

/**
 * @desc Register the logged user to an event
 * @route POST /api/registrations/:eventId
 */
export async function registerToEvent(req, res) {
  const { eventId } = req.params;
  const userId = req.user.id;

  // Event exists
  const event = await Event.findByPk(eventId, {
    include: { model: User, as: 'creator', attributes: ['id', 'username'] }
  });
  if (!event) {
    return res.status(404).json({ message: 'Event not found' });
  }

  // Allow registration if event is approved OR if user is the creator
  if (event.status !== 'APPROVED' && event.creator_id !== userId) {
    return res.status(404).json({ message: 'Event not found or not approved' });
  }

  // Check if user already registered
  const existing = await Registration.findOne({ where: { user_id: userId, event_id: eventId } });
  if (existing) {
    return res.status(400).json({ message: 'Already registered to this event' });
  }

  // Use transaction to prevent race conditions
  const transaction = await sequelize.transaction();

  try {
    // Check capacity within transaction
    const count = await Registration.count({ where: { event_id: eventId }, transaction });
    if (event.capacity && count >= event.capacity) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Event is full' });
    }

    // Register user within transaction
    const registration = await Registration.create(
      { user_id: userId, event_id: eventId },
      { transaction }
    );

    await transaction.commit();

    // Send notification to event creator
    const user = await User.findByPk(userId, { attributes: ['id', 'username', 'email'] });
    await sendRegistrationNotification(event, user, count + 1, 'registration', registration);
    
    res.status(201).json({ message: 'Registration successful', registration });
  } catch (error) {
    await transaction.rollback();
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
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
  
  // Send notification to event creator
  if (event) {
    await sendRegistrationNotification(event, user, count - 1, 'unregistration');
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
