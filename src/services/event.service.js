/**
 * Event Service
 * Business logic for event operations
 */

import { Event, User, Registration, sequelize } from '../models/index.js';
import { Op } from 'sequelize';
import { userDTO } from '../dto/user.dto.js';

/**
 * Create a new event
 */
export async function createEvent(userId, eventData) {
  const transaction = await sequelize.transaction();

  try {
    // Create the event
    const event = await Event.create({
      ...eventData,
      creator_id: userId,
      status: 'PENDING',
    }, { transaction });

    // Automatically register the creator as a participant
    await Registration.create({
      user_id: userId,
      event_id: event.id,
    }, { transaction });

    await transaction.commit();

    return event;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

/**
 * Get all events with filters and pagination
 */
export async function getAllEvents(filters = {}, userRole = null) {
  const { category, location, title, dateFrom, dateTo, status, limit = 10, offset = 0 } = filters;

  // Only ADMIN can see PENDING/REJECTED events, others only see APPROVED
  let effectiveStatus = status;
  if (userRole !== 'ADMIN') {
    effectiveStatus = 'APPROVED';
  } else if (!status) {
    // If admin doesn't specify status, default to APPROVED
    effectiveStatus = 'APPROVED';
  }

  const where = { status: effectiveStatus };

  if (category) {
    where.category = { [Op.iLike]: `%${category}%` };
  }

  if (location) {
    where.location = { [Op.iLike]: `%${location}%` };
  }

  if (title) {
    where.title = { [Op.iLike]: `%${title}%` };
  }

  // Filtro per intervallo di date
  if (dateFrom || dateTo) {
    where.date = {};
    if (dateFrom) {
      where.date[Op.gte] = new Date(dateFrom);
    }
    if (dateTo) {
      where.date[Op.lte] = new Date(dateTo);
    }
  }

  const { count, rows } = await Event.findAndCountAll({
    where,
    include: { model: User, as: 'creator', attributes: ['username', 'email'] },
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['date', 'ASC']],
  });

  // Add participant count to each event
  const eventsWithCount = await Promise.all(
    rows.map(async (event) => {
      const participantCount = await Registration.count({
        where: { event_id: event.id }
      });
      return {
        ...event.toJSON(),
        participantCount
      };
    })
  );

  return {
    events: eventsWithCount,
    total: count,
    limit: parseInt(limit),
    offset: parseInt(offset),
  };
}

/**
 * Get event by ID with participants
 */
export async function getEventById(eventId) {
  const event = await Event.findByPk(eventId, {
    include: [
      {
        model: User,
        as: 'participants',
        through: { attributes: ['registered_at'] },
        attributes: ['id', 'username', 'email'],
      },
    ],
  });

  if (!event) {
    throw new Error('Event not found');
  }

  return event;
}

/**
 * Update event
 */
export async function updateEvent(userId, eventId, updateData) {
  const event = await Event.findByPk(eventId);

  if (!event) {
    throw new Error('Event not found');
  }

  if (event.creator_id !== userId) {
    throw new Error('Not authorized to update this event');
  }

  await event.update(updateData);
  return event;
}

/**
 * Delete event
 */
export async function deleteEvent(userId, eventId, isAdmin = false) {
  const event = await Event.findByPk(eventId);

  if (!event) {
    throw new Error('Event not found');
  }

  if (!isAdmin && event.creator_id !== userId) {
    throw new Error('Not authorized to delete this event');
  }

  await event.destroy();
  return { success: true };
}

/**
 * Approve event (admin only)
 */
export async function approveEvent(eventId) {
  const event = await Event.findByPk(eventId);

  if (!event) {
    throw new Error('Event not found');
  }

  await event.update({ status: 'APPROVED' });
  return event;
}

/**
 * Reject event (admin only)
 */
export async function rejectEvent(eventId) {
  const event = await Event.findByPk(eventId);

  if (!event) {
    throw new Error('Event not found');
  }

  await event.update({ status: 'REJECTED' });
  return event;
}

/**
 * Get events created by user
 */
export async function getUserEvents(userId) {
  const events = await Event.findAll({
    where: { creator_id: userId },
    order: [['created_at', 'DESC']],
  });

  return events;
}

/**
 * Get event participants with details
 */
export async function getEventParticipants(eventId) {
  const event = await Event.findByPk(eventId, {
    include: [
      {
        model: User,
        as: 'participants',
        through: { attributes: ['registered_at'] },
        attributes: ['id', 'username', 'email'],
      },
    ],
  });

  if (!event) {
    throw new Error('Event not found');
  }

  // Use userDTO for consistency
  const participantsWithDTO = event.participants.map((user) => 
    userDTO(user, eventId)
  );

  return participantsWithDTO;
}
