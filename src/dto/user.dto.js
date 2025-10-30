/**
 * @file user.dto.js
 * @description Data Transfer Object (DTO) for filtering and formatting user data
 */

/**
 * Converts a full User model instance into a lightweight public DTO
 * @param {object} user - Sequelize User instance
 * @param {number} [eventId] - Optional event ID for registration info
 * @returns {object} - DTO with public fields
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