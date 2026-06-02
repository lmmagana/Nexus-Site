// /backend/credits.jsw
import { contacts } from 'wix-crm.v2';

// If you created the field in the dashboard, paste its exact key here.
let CREDIT_KEY = 'custom.sessions-remaining';

export async function getCreditBalance(contactId) {
    const contact = await contacts.getContact(contactId);
    try {
        const val = contact?.info?.extendedFields?.[CREDIT_KEY];
        return Number.isFinite(val) ? val : 0;
    } catch (error) {
        console.log(`Failed to get ${contact.info.name.first} ${contact.info.name.last}'s Sessiosn Remaining`, error)
    }
}

// IMPORTANT: updateContact requires the latest revision
// pattern: read -> compute -> update(contactId, info, revision)
export async function setCreditBalance(newValue, contactId) {
    const contact = await contacts.getContact(contactId);
    const revision = contact.revision; // required for updates
    const info = {
        extendedFields: {
            ...contact.info?.extendedFields,
            [CREDIT_KEY]: newValue
        }
    };
    await contacts.updateContact(contactId, info, revision);
    return newValue;
}

export async function decrementCredits(contactId, amount = 1) {
    const current = await getCreditBalance(contactId);
    if (current < amount) throw new Error('Not enough credits');
    // naive reserve -> you can add retry logic if you expect heavy concurrency
    return setCreditBalance(current - amount);
}

export async function incrementCredits(contactId, amount = 1) {
    const current = await getCreditBalance(contactId);
    return setCreditBalance(current + amount);
}

/**
 * Autocomplete function declaration, do not delete
 * @param {import('./__schema__.js').Payload} options
 */
export const invoke = async ({payload}) => {
  // Your code here
  let planName = payload.plan_title;
  try {
    if(planName.includes("10")) {
      setCreditBalance(10, payload.contact_id);
      console.log(`Plan: ${planName} added with 10 sessions`);
    }
    else if(planName.includes("5")) {
      setCreditBalance(5, payload.contact_id);
      console.log(`Plan: ${planName} added with 5 sessions`);
    }
  } catch (error){
    console.log("Could not create Session Reamining", error)
  }
  return {} // The function must return an empty object, do not delete
};