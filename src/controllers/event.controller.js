import { Event, User, Registration  } from '../models/index.js';
import { Op } from 'sequelize';
import { userDTO } from '../dto/user.dto.js';
/**
 * @desc Logged user creates an event
 * @route POST /api/events
 */
export async function createEvent(req, res) {
  const { title, description, category, location, date, capacity, image_url } = req.body;

  const newEvent = await Event.create({
    title,
    description,
    category,
    location,
    date,
    capacity,
    image_url,
    creator_id: req.user.id, 
    status: 'PENDING',
  });

  res.status(201).json({
    message: 'Event created successfully (pending approval)',
    event: newEvent,
  });
}

/**
 * @desc Gets all visible events
 * @route GET /api/events
 */
export async function getAllEvents(req, res) {
  const { category, location, date } = req.query;
  const where = { status: 'APPROVED' };

  if (category) where.category = { [Op.iLike]: category };
  if (location) where.location = { [Op.iLike]: location };
  if (date) where.date = date; 

  const events = await Event.findAll({
    where,
    include: { model: User, as: 'creator', attributes: ['username', 'email'] },
    order: [['date', 'ASC']],
  });

  res.json(events);
}

/**
 * @desc Gets single event by ID
 * @route GET /api/events/:id
 */
export async function getEventById(req, res) {
  const event = await Event.findByPk(req.params.id, {
    include: { model: User, as: 'creator', attributes: ['username', 'email'] },
  });

  if (!event) return res.status(404).json({ message: 'Event not found' });
  res.json(event);
}

/**
 * @desc Creator updates event
 * @route PUT /api/events/:id
 */
export async function updateEvent(req, res) {
  const event = await Event.findByPk(req.params.id);

  if (!event) return res.status(404).json({ message: 'Event not found' });
  if (event.creator_id !== req.user.id && req.user.role !== 'ADMIN')
    return res.status(403).json({ message: 'Not authorized to edit this event' });

  const { title, description, category, location, date, capacity, image_url } = req.body;
  Object.assign(event, { title, description, category, location, date, capacity, image_url });
  await event.save();

  res.json({ message: 'Event updated successfully', event });
}

/**
 * @desc Event delete by creator or Admin
 * @route DELETE /api/events/:id
 */
export async function deleteEvent(req, res) {
  const event = await Event.findByPk(req.params.id);
  if (!event) return res.status(404).json({ message: 'Event not found' });

  if (event.creator_id !== req.user.id && req.user.role !== 'ADMIN')
    return res.status(403).json({ message: 'Not authorized to delete this event' });

  await event.destroy();
  res.json({ message: 'Event deleted successfully' });
}

/**
 * @desc Admin event Approval
 * @route PATCH /api/events/:id/approve
 */
export async function approveEvent(req, res) {
  const event = await Event.findByPk(req.params.id);
  if (!event) return res.status(404).json({ message: 'Event not found' });

  event.status = 'APPROVED';
  await event.save();
  res.json({ message: 'Event approved', event });
}

/**
 * @desc Admin event reject
 * @route PATCH /api/events/:id/reject
 */
export async function rejectEvent(req, res) {
  const event = await Event.findByPk(req.params.id);
  if (!event) return res.status(404).json({ message: 'Event not found' });

  event.status = 'REJECTED';
  await event.save();
  res.json({ message: 'Event rejected', event });
}

/**
 * @desc Gets all events created by loggged user
 * @route GET /api/events/mine
 */
export async function getMyEvents(req, res) {
  const events = await Event.findAll({
    where: { creator_id: req.user.id },
    order: [['date', 'ASC']],
  });
  res.json(events);
}


/**
 * @desc Get all participants of an event (visible only to creator, admin or participants)
 * @route GET /api/events/:id/participants
 */
export async function getEventParticipants(req, res) {
  const { id } = req.params;
  const event = await Event.findByPk(id);
  if (!event) return res.status(404).json({ message: 'Event not found' });

  const isCreator = event.creator_id === req.user.id;
  const isAdmin = req.user.role === 'ADMIN';
  const isParticipant = await Registration.findOne({
    where: { user_id: req.user.id, event_id: id },
  });

  if (!isCreator && !isAdmin && !isParticipant) {
    return res.status(403).json({ message: 'Not authorized to view participants' });
  }

  //JOIN
  const participants = await User.findAll({
    include: [
      {
        model: Event,
        as: 'registeredEvents',
        where: { id },
        attributes: [],
        through: { attributes: ['registered_at'] },
      },
    ],
    attributes: ['id', 'username', 'email'],
    order: [['username', 'ASC']],
  });

  // DTO
  const dto = participants.map(u => userDTO(u, parseInt(id)));
  res.json(dto);
}