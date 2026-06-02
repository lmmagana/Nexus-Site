/**
 * Autocomplete function declaration, do not delete
 * @param {import('./__schema__.js').Payload} options
 */
import { migrateExistingBookings } from 'backend/googleCalendar.js';

export const invoke = async ({ payload }) => {
  try {
      await migrateExistingBookings(5);
      console.log('Migration Attempted');
  } catch (err) {
      console.warn('Migration Failed');
  }
  return {};
};