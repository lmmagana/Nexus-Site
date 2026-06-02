// /backend/credits.jsw
import { contacts } from 'wix-crm.v2';
import { orders } from 'wix-pricing-plans-backend'; // for listing orders and checking pricing plans
import { elevate } from "wix-auth";

/*
 * Uses listOrders() from 'wix-pricing-plans-backend'
 * @param {string} memberId
 * @returns {{planName: string, planId: string} | 0}
 */
export async function checkActivePlan(memberId) {
    const filters = {
        buyerIds: [`${memberId}`],
        orderStatuses: ["ACTIVE"]
    };

    try {
        const memOrders = await orders.listOrders(filters, null, null, { suppressAuth: true });
        for (const order of memOrders) {
            console.log(`${order.planName} valid`)
            return { planName: order.planName, planId: order.planId }
        }

    } catch (error) {
        console.log("Failed to check for active plan", error);
    }

    return 0;
}

// If you created the field in the dashboard, paste its exact key here.
let CREDIT_KEY = 'custom.sessions-remaining';
const elevatedGetContact = elevate(contacts.getContact);

export async function getCreditBalance(contactId) {
    const contact = await elevatedGetContact(contactId);
    try {
        const val = contact.info.extendedFields[CREDIT_KEY];
        return Number.isFinite(val) ? val : 0;
    } catch (error) {
        console.log(`Failed to get ${contact.info.name.first} ${contact.info.name.last}'s Sessiosn Remaining`, error)
    }
}

// IMPORTANT: updateContact requires the latest revision
// pattern: read -> compute -> update(contactId, info, revision)
export async function setCreditBalance(newValue, contactId) {
    const contact = await elevatedGetContact(contactId);
    const revision = contact.revision; // required for updates
    const info = {
        extendedFields: {
            ...contact.info.extendedFields,
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
  try {
    let contactId = payload.contact_id;
    if(await checkActivePlan(contactId) && await getCreditBalance(contactId) > 0){
      let val = decrementCredits(contactId);
      console.log("Decremented Sesions Remaining", `${val}`);
    } else {
    console.log("Either no active plan or sessions remaining");
    }
  } catch (error){
    console.log("Couldn't decrement Plan", error);
  }
  return {} // The function must return an empty object, do not delete
};