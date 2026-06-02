/**
 * Autocomplete function declaration, do not delete
 * @param {import('./__schema__.js').Payload} options
 */
import { createCalendarEvent } from 'backend/googleCalendar.js';

export const invoke = async ({ payload }) => {
  try {
      const googleEventId = await createCalendarEvent(payload);
      console.log('Successfully created Google Calendar event:', googleEventId, 'for booking:', payload.booking_id);
  } catch (err) {
      console.warn('Failed to create Google Calendar event for booking:', payload.booking_id, '| Error:', err.message);
  }
  return {};
};