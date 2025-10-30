import { Registration, Event } from '../models/index.js';

/**
 * @desc Register the logged user to an event
 * @route POST /api/registrations/:eventId
 */
export async function registerToEvent(req, res) {
  const { eventId } = req.params;
  const userId = req.user.id;

  // Event exists or approved
  const event = await Event.findByPk(eventId);
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

  await registration.destroy();
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
      attributes: ['id', 'title', 'category', 'location', 'date'],
    },
    order: [['registered_at', 'DESC']],
  });

  res.json(registrations);
}
