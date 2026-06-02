/**
 * Autocomplete function declaration, do not delete
 * @param {import('./__schema__.js').Payload} options
 */
import { deleteCalendarEvent } from 'backend/googleCalendar.js';

export const invoke = async ({ payload }) => {
  try {
    await deleteCalendarEvent(payload);
    console.log('Successfully deleted Google Calendar event for booking:', payload.booking_id);
  } catch (err) {
    console.warn('Failed to delete Google Calendar event for booking:', payload.booking_id, '| Error:', err.message);
  }
  return {};
};