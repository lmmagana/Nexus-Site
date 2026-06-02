/**
 * Autocomplete function declaration, do not delete
 * @param {import('./__schema__.js').Payload} options
 */
import { updateCalendarEvent } from 'backend/googleCalendar.js';

export const invoke = async ({ payload }) => {
  try {
    const googleEventId = await updateCalendarEvent(payload);
    console.log('Successfully updated Google Calendar event:', googleEventId, 'for booking:', payload.booking_id);
  } catch (err) {
    console.warn('Failed to update Google Calendar event for booking:', payload.booking_id, '| Error:', err.message);
  }
  return {};
};