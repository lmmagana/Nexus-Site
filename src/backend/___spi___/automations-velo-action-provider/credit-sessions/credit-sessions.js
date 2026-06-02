import { contacts } from 'wix-crm.v2';
import { orders } from 'wix-pricing-plans-backend'; // for listing orders and checking pricing plans
import { elevate } from "wix-auth";
import {myGetEvent, myGetMem, myGetPlan, myGetService, myGetTicket, myGetPlanPrice, myGetTicketPrice} from 'backend/helpers.js'
import {privatesExtendedField,  sessionsExtendedField} from 'backend/constants.js'

let memName = "";
let plan = {};
let fullpayload = {};
let retryCounter = 0;

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/*
 * Uses listOrders() from 'wix-pricing-plans-backend'
 * @param {string} memberId
 * @returns {{planName: string, orderId: string} | 0}
 */
export async function checkActivePlan(memberId) {
    const filters = {
        buyerIds: [`${memberId}`],
        orderStatuses: ["ACTIVE"]
    };

    try {
        const memOrders = await orders.listOrders(filters, null, null, { suppressAuth: true });
        const memOrdersNoIntro = memOrders.filter(o => !/^\s*Intro Offer\s*$/i.test(o.planName));

        for (const order of memOrdersNoIntro) {
            console.log(`${memName}: ${order.planName} valid`);
            return { orderId: order._id, planName: order.planName }
        }

    } catch (error) {
        console.error(`Failed to check ${memName}'s active plans`, error);
    }

    return null;
}

const elevatedGetContact = elevate(contacts.getContact);
const elevatedUpdateContact = elevate(contacts.updateContact);

export async function getCreditBalance(contactId, extendedField) {
    const contact = await elevatedGetContact(contactId);
    try {
        return contact.info.extendedFields.items[extendedField];
    } catch (error) {
        console.error(`Failed to get ${memName}'s Sessiosn Remaining`, error)
    }
}

export async function setCreditBalance(newValue, contactId, extendedField) {
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

            if (retryCounter < 3) {
                console.warn(`🔁 Retrying update for ${memName} (attempt ${retryCounter + 1})...`);
                wait(500);
                //return await setCreditBalance(newValue, contactId, extendedField);
                return await creditSessions(contactId);
            } else {
                console.error("Failed after 3 retries due to concurrent updates.");
            }
        } else {
            console.error(`Couldn't adjust ${memName}'s sessions`, error);
        }
    }
}

export async function decrementCredits(contactId, amount = 1) {
    const current = await getCreditBalance(contactId, sessionsExtendedField);
    if (current < amount) throw new Error(`${memName}: Not enough credits`);
    // naive reserve -> you can add retry logic if you expect heavy concurrency
    return setCreditBalance(current - amount, contactId, sessionsExtendedField);
}

export async function decrementPrivates(contactId, amount = 1) {
    const current = await getCreditBalance(contactId, privatesExtendedField);
    if (current < amount) throw new Error(`${memName}: Not enough credits`);
    // naive reserve -> you can add retry logic if you expect heavy concurrency
    return setCreditBalance(current - amount, contactId, privatesExtendedField);
}

// export async function incrementCredits(contactId, amount = 1) {
//     const current = await getCreditBalance(contactId);
//     return setCreditBalance(current + amount, contactId);
// }

export async function creditSessions(contactId){
    let sessionsRemaining = await getCreditBalance(contactId, sessionsExtendedField);
    let privatesRemaining = await getCreditBalance(contactId, privatesExtendedField);
    try {
        if (plan.planName.includes("Private") && fullpayload.service_name.includes("Private")) {
            privatesRemaining = await decrementPrivates(contactId);
            console.log(`${memName}:`, "Decremented Privates Remaining:", `${privatesRemaining}`);

            if (privatesRemaining <= 0) {
                await orders.cancelOrder(plan.orderId, "IMMEDIATELY", { suppressAuth: true });
                console.log(`${memName}: Ended (cancelled) Plan: ${plan.planName} after privates reached 0`);
            }
        } else if (plan.planName.includes("Punch") && !fullpayload.service_name.includes("Private")) {
            sessionsRemaining = await decrementCredits(contactId);
            console.log(`${memName}:`,"Decremented Sessions Remaining:", `${sessionsRemaining}`);

            if (sessionsRemaining <= 0) {
                await orders.cancelOrder(plan.orderId, "IMMEDIATELY", { suppressAuth: true });
                console.log(`${memName}: Ended (cancelled) Plan: ${plan.planName} after sessions reached 0`);
            }
        }
    } catch (error) {
        console.error(`${memName}:`,"Couldn't decrement plan", error);
    }
}

/**
 * Autocomplete function declaration, do not delete
 * @param {import('./__schema__.js').Payload} options
 */
export const invoke = async ({ payload }) => {
    wait(500);
    let contactId = payload.contact_id;
    memName = await myGetMem(contactId);
    plan = await checkActivePlan(contactId);
    fullpayload = payload;
    try {
        if (plan) {
            // if (plan.planName.includes("Private") && payload.service_name.includes("Private")) {
            //     privatesRemaining = await decrementPrivates(contactId);
            //     console.log(`${memName}:`, "Decremented Privates Remaining:", `${privatesRemaining}`);

            //     if (privatesRemaining <= 0) {
            //         await orders.cancelOrder(plan.orderId, "IMMEDIATELY", { suppressAuth: true });
            //         console.log(`${memName}: Ended (cancelled) Plan: ${plan.planName} after privates reached 0`);
            //     }
            // } else if (plan.planName.includes("Punch") && !payload.service_name.includes("Private")) {
            //     sessionsRemaining = await decrementCredits(contactId);
            //     console.log(`${memName}:`,"Decremented Sessions Remaining:", `${sessionsRemaining}`);

            //     if (sessionsRemaining <= 0) {
            //         await orders.cancelOrder(plan.orderId, "IMMEDIATELY", { suppressAuth: true });
            //         console.log(`${memName}: Ended (cancelled) Plan: ${plan.planName} after sessions reached 0`);
            //     }
            // }
            creditSessions(contactId);
        } else {
            console.log(`${memName}:`,"No active plan");
        }

    } catch (error) {
        console.error(`${memName}:`,"Couldn't decrement plan", error);
    }
    return {} // The function must return an empty object, do not delete
};