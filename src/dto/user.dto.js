/**
 * @file user.dto.js
 * @description Data Transfer Object (DTO) for filtering and formatting user data
 * 
 * This DTO is used across the application:
 * - Event participants lists
 * - Chat message senders
 * - Chat conversation participants
 * - Any public user data representation
 */

/**
 * Converts a full User model instance into a lightweight public DTO
 * Filters sensitive data (password, etc.) and returns only safe public fields
 * 
 * @param {object} user - Sequelize User instance
 * @param {number} [eventId] - Optional event ID for registration info
 * @returns {object} - DTO with public fields: { id, username, email, [registered_at] }
 */
export function userDTO(user, eventId = null) {
  const dto = {
    id: user.id,
    username: user.username,
    email: user.email,
  };

  // Include registration date if available 
  if (eventId && user.registeredEvents?.length > 0) {
    const registration = user.registeredEvents.find(ev => ev.id === eventId);
    if (registration?.registrations?.registered_at) {
      dto.registered_at = registration.registrations.registered_at;
    }
  }

  return dto;
}