import { contacts, extendedFields } from 'wix-crm.v2';
import { elevate } from "wix-auth";
import {myGetEvent, myGetMem, myGetPlan, myGetService, myGetTicket, myGetPlanPrice, myGetTicketPrice} from 'backend/helpers.js'
import {privatesExtendedField,  sessionsExtendedField} from 'backend/constants.js'

const elevatedGetContact = elevate(contacts.getContact);
const elevatedUpdateContact = elevate(contacts.updateContact);
let memName = "";

async function setCreditBalance(newValue, contactId, extendedField, retryCount = 0) {
    try {
        const contact = await elevatedGetContact(contactId);
        const info = {
            extendedFields: {
                items: {
                    [extendedField]: newValue
                }
            }
        };
        const revision = contact.revision;
        await elevatedUpdateContact(contactId, info, revision);
        return newValue;

    } catch (error) {
        if (error?.description?.includes("Contact has been updated since the requested revision") ||
            error?.message?.includes("Contact has been updated since the requested revision")) {

            if (retryCount < 3) {
                console.warn(`🔁 Retrying update for ${memName} (attempt ${retryCount + 1})...`);
                return await setCreditBalance(newValue, contactId, extendedField, retryCount + 1);
            } else {
                console.error("Failed after 3 retries due to concurrent updates.");
            }
        } else {
            console.error(`Couldn't add sessions for ${memName}`, error);
        }
    }
}

/**
 * Autocomplete function declaration, do not delete
 * @param {import('./__schema__.js').Payload} options
 */
export const invoke = async ({payload}) => {
  // Your code here
  let planName = payload.plan_title;
  let contactId = payload.contact_id;
  memName = await myGetMem(contactId);
  try {
    if(planName.includes("15") && planName.includes("Private")) {
      setCreditBalance("15", contactId, privatesExtendedField);
      console.log(`Plan: ${planName} added with 15 privates for ${memName}`);
    }
    else if(planName.includes("10") && planName.includes("Private")) {
      setCreditBalance("10", contactId, privatesExtendedField);
      console.log(`Plan: ${planName} added with 10 privates for ${memName}`);
    }
    else if(planName.includes("5") && planName.includes("Private")) {
      setCreditBalance("5", contactId, privatesExtendedField);
      console.log(`Plan: ${planName} added with 5 privates for ${memName}`);
    }
    else if(planName.includes("Intro")) {
      setCreditBalance("1", contactId, privatesExtendedField);
      setCreditBalance("1", contactId, sessionsExtendedField);
      console.log(`Plan: ${planName} added with 1 private and 1 session for ${memName}`);
    }
    else if (planName.includes("10")) {
      setCreditBalance("10", contactId, sessionsExtendedField);
      console.log(`Plan: ${planName} added with 10 sessions for ${memName}`);
    }
    else if(planName.includes("5")) {
      setCreditBalance("5", contactId, sessionsExtendedField);
      console.log(`Plan: ${planName} added with 5 sessions for ${memName}`);
    }
  } catch (error){
    console.error(`Could not create Session Reamining for ${memName}`, error)
  }
  return {} // The function must return an empty object, do not delete
};