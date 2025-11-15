/**
 * Event Controller
 * REST endpoints for event operations
 */

import * as eventService from '../services/event.service.js';
import { Registration } from '../models/index.js';

/**
 * @desc Logged user creates an event
 * @route POST /api/events
 */
export async function createEvent(req, res) {
  try {
    const event = await eventService.createEvent(req.user.id, req.body);
    
    res.status(201).json({
      message: 'Event created successfully (pending approval)',
      event,
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ message: 'Error creating event' });
  }
}

/**
 * @desc Gets all visible events
 * @route GET /api/events
 */
export async function getAllEvents(req, res) {
  try {
    // Pass user role to service to determine access to pending events
    const userRole = req.user?.role || null;
    const result = await eventService.getAllEvents(req.query, userRole);
    res.json({
      events: result.events,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset
      }
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Error fetching events' });
  }
}

/**
 * @desc Gets single event by ID
 * @route GET /api/events/:id
 */
export async function getEventById(req, res) {
  try {
    const event = await eventService.getEventById(req.params.id);
    res.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    const status = error.message === 'Event not found' ? 404 : 500;
    res.status(status).json({ message: error.message });
  }
}

/**
 * @desc Creator updates event
 * @route PUT /api/events/:id
 */
export async function updateEvent(req, res) {
  try {
    const event = await eventService.updateEvent(req.user.id, req.params.id, req.body);
    
    res.json({ message: 'Event updated successfully', event });
  } catch (error) {
    console.error('Error updating event:', error);
    const status = error.message === 'Event not found' ? 404 :
                   error.message === 'Not authorized to update this event' ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
}

/**
 * @desc Event delete by creator or Admin
 * @route DELETE /api/events/:id
 */
export async function deleteEvent(req, res) {
  try {
    const isAdmin = req.user.role === 'ADMIN';
    await eventService.deleteEvent(req.user.id, req.params.id, isAdmin);
    
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    const status = error.message === 'Event not found' ? 404 :
                   error.message === 'Not authorized to delete this event' ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
}

/**
 * @desc Admin event Approval
 * @route PATCH /api/events/:id/approve
 */
export async function approveEvent(req, res) {
  try {
    const event = await eventService.approveEvent(req.params.id);
    res.json({ message: 'Event approved', event });
  } catch (error) {
    console.error('Error approving event:', error);
    const status = error.message === 'Event not found' ? 404 : 500;
    res.status(status).json({ message: error.message });
  }
}

/**
 * @desc Admin event reject
 * @route PATCH /api/events/:id/reject
 */
export async function rejectEvent(req, res) {
  try {
    const event = await eventService.rejectEvent(req.params.id);
    res.json({ message: 'Event rejected', event });
  } catch (error) {
    console.error('Error rejecting event:', error);
    const status = error.message === 'Event not found' ? 404 : 500;
    res.status(status).json({ message: error.message });
  }
}

/**
 * @desc Gets all events created by logged user
 * @route GET /api/events/mine
 */
export async function getMyEvents(req, res) {
  try {
    const events = await eventService.getUserEvents(req.user.id);
    res.json(events);
  } catch (error) {
    console.error('Error fetching user events:', error);
    res.status(500).json({ message: 'Error fetching events' });
  }
}


/**
 * @desc Get all participants of an event (visible only to creator, admin or participants)
 * @route GET /api/events/:id/participants
 */
export async function getEventParticipants(req, res) {
  try {
    const { id } = req.params;
    
    // Check authorization (keep this in controller as it's HTTP-specific)
    const event = await eventService.getEventById(id);
    
    const isCreator = event.creator_id === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';
    const isParticipant = await Registration.findOne({
      where: { user_id: req.user.id, event_id: id },
    });

    if (!isCreator && !isAdmin && !isParticipant) {
      return res.status(403).json({ message: 'Not authorized to view participants' });
    }

    const participants = await eventService.getEventParticipants(id);
    res.json(participants);
  } catch (error) {
    console.error('Error fetching participants:', error);
    const status = error.message === 'Event not found' ? 404 : 500;
    res.status(status).json({ message: error.message });
  }
}