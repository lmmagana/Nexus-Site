import { guests, tickets, wixEventsV2, ticketDefinitionsV2 } from "wix-events.v2"
import { Permissions, webMethod } from "wix-web-module";
import { elevate } from "wix-auth";
import { members } from "wix-members.v2";
import { rsvpV2, ticketReservations, orders } from "@wix/events";

export const myGetMem = webMethod(Permissions.Anyone, async (_id) => {
    try {
        const elevatedgetMember = elevate(members.getMember);
        return await elevatedgetMember(_id, { fieldsets: ['FULL'] });
    } catch (error) {
        console.error("Error getting member, proceed to checking if contact", error);
        return;
    }
}, );

export const createRsvp = webMethod(Permissions.Anyone, async (eventId, memId) => {
    try {
        const member = await myGetMem(memId);
        const rsvp = {
            eventId: eventId,
            memId: memId,
            firstName: member.contact.firstName,
            lastName: member.contact.lastName,
            email: member.loginEmail,
            status: "YES",
        }
        const response = await rsvpV2.createRsvp(rsvp);
    } catch (error) {
        console.error("Couldn't create RSVP", error);
    }
}, );

export const bookEvent = webMethod(Permissions.Anyone, async (eventId, memId, ticketId) => {
    console.log("Attempting to book event")
    try {
        let checkOrder = await orders.listOrders({ eventId: eventId, memberId: memId })
        if (checkOrder.total > 0) {
            console.log("Order exists?", JSON.stringify(checkOrder, null, 2))
            return;
        }
        console.log("Check point 1")
        let ticketReserved = await ticketReservations.createTicketReservation({
            tickets: {
                ticketDefinitionId: ticketId,
                quantity: 1
            }
        })
        console.log("Check point 2")
        let order = await orders.checkout(eventId, {
            reservationId: ticketReserved,
            memberId: memId,
            guests: {
                form: {
                    inputValues: {
                        inputName: "",
                        value: "",
                        values: {}
                    }
                }
            },
            options: {
                silent: true,
                ignoreFormValidation: true,
                markAsPaid: true
            }
        })

        console.log("order:\n" + JSON.stringify(order, null, 2));

    } catch (error) {
        console.error("Order Failed", error);
    }
}, );

export const queryGuests = webMethod(Permissions.Anyone, async () => {
    try {
        const items = await guests.queryGuests({ fields: ["GUEST_DETAILS"] }).find();
        console.log("Success! Guests: ", items);

        return items;
    } catch (error) {
        console.error(error);
        // Handle the error
    }
}, );

/**
 * Adds ONE contact to the first available slot of a service on a given date.
 * @param {string} eventId
 * @param {string} memberId
 */
// export const addGuest = webMethod(Permissions.Anyone, async (eventId, memberId, ticketId) => {
//     try {
//         const elevatedListTickets = elevate(tickets.listTickets);
//         const hasTicket = await elevatedListTickets(eventId, { memberId: memberId });
//         if (hasTicket.total > 0) {
//             console.log("Already Has ticket, no need to ")
//             return;
//         }
//     } catch (error) {
//         console.error(error);
//         // Handle the error
//     }

//     try {
//         let reservation = await orders.createReservation(eventId, { ignoreLimits: true, ticketQuantities: [{ quantity: 1, ticketDefinitionId: ticketId }] });
//         let options = {
//             reservationId: reservation._id,
//             memberId: memberId,
//             options: {
//                 markAsPaid: true,
//                 ignoreFormValidation: true,
//             },
//             guests: [{
//                 form: {
//                     inputValues: []
//                 }
//             }],
//         }

//         const result = await orders.checkout(eventId, options);
//         console.log(`Tickets: ${JSON.stringify(result, null, 2)}`);
//         return result;
//     } catch (error) {
//         console.error(error);
//         // Handle the error
//     }
// }, );

/**
 * Gets different Ticket Types for Event
 * @param {string} eventId
 * @returns {Promise<Array<{label:string, value:string}>>}
 */
export const queryTickets = webMethod(Permissions.Anyone, async (eventId) => {
    try {
        const elevatedQueryTicketDefinitions = elevate(ticketDefinitionsV2.queryTicketDefinitions);
        const { items } = await elevatedQueryTicketDefinitions().eq("eventId", eventId).find();

        const tickets = items.map(ticket => {
            const price = ticket.pricingMethod?.fixedPrice?.value; // safely check for existence
            const label = price !== undefined ? `${ticket.name} - $${price}` : `${ticket.name}`; // fallback if no price
            return { label, value: ticket._id };
        });
        //console.log(`Tickets: ${JSON.stringify(tickets, null, 2)}`);
        return tickets;

    } catch (error) {
        console.error(error);
        // Handle the error
    }
}, );

/**
 * Gets upcoming events
 * @returns {Promise<Array<{label:string, value:string}>>}
 */
export const queryEvents = webMethod(Permissions.Anyone, async () => {
    try {
        const { items } = await wixEventsV2.queryEvents().ne('status', 'CANCELED').ne('status', 'ENDED').find();

        const eventList = items.map(event => { return { label: `${event.title}`, value: event._id }; });
        //console.log(`Event List: ${JSON.stringify(eventList, null, 2)}`);
        return eventList;

    } catch (error) {
        console.error(error);
    }
}, );