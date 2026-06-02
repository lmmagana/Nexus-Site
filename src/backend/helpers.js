import wixPricingPlansBackend from "wix-pricing-plans-backend";
import { members } from "wix-members.v2";
import { contacts } from 'wix-crm.v2';
import { services } from "wix-bookings.v2";
import { webMethod, Permissions } from "wix-web-module";
import { elevate } from "wix-auth";
import { wixEventsV2, ticketDefinitionsV2 } from 'wix-events.v2';

export const myGetMem = webMethod(Permissions.Anyone, async (_id) => {
    try {
        const elevatedgetMember = elevate(members.getMember);
        const member = await elevatedgetMember(_id, { fieldsets: ['FULL'] });
        return `${member.contact?.firstName || ""} ${member.contact?.lastName || ""}`;
    } catch (error) {
        console.log("Error getting member, proceed to checking if contact", error);
        return myGetCont(_id);
    }
}, );

export const myGetCont = webMethod(Permissions.Anyone, async (_id) => {
    try {
        const elevatedGetContact = elevate(contacts.getContact);
        const contact = await elevatedGetContact(_id);
        return `${contact.info.name.first || ""} ${contact.info.name.last || ""}`;
    } catch (error) {
        console.error("Error getting contact", error);
    }
}, );

export const myGetPlan = webMethod(Permissions.Anyone, async (_id) => {
    try {
        const elevatedGetPlan = elevate(wixPricingPlansBackend.getPlan);
        const planName = await elevatedGetPlan(_id);
        return planName.name;
    } catch (error) {
        console.error("Error getting plan", error);
    }
});

export const myGetPlanPrice = webMethod(Permissions.Anyone, async (_id) => {
    try {
        const elevatedGetPlan = elevate(wixPricingPlansBackend.getPlan);
        const planName = await elevatedGetPlan(_id);
        return planName.pricing.price.value;
    } catch (error) {
        console.error("Error getting plan", error);
    }
});

export const myGetService = webMethod(Permissions.Anyone, async (serviceId) => {
    try {
        const elevatedgetService = elevate(services.getService);
        const service = await elevatedgetService(serviceId);
        return service.name
    } catch (error) {
        console.error("Error getting service", error);
    }
});

export const myGetTicket = webMethod(Permissions.Anyone, async (ticketId) => {
    try {
        const elevatedGetTicket = elevate(ticketDefinitionsV2.getTicketDefinition);
        const ticket = await elevatedGetTicket(ticketId);
        return ticket.name;
    } catch (error) {
        console.error("Error getting ticket", error);
    }
});

export const myGetTicketPrice = webMethod(Permissions.Anyone, async (ticketId) => {
    try {
        const elevatedGetTicket = elevate(ticketDefinitionsV2.getTicketDefinition);
        const ticket = await elevatedGetTicket(ticketId);
        return ticket.pricingMethod.fixedPrice.value;
    } catch (error) {
        console.error("Error getting ticket", error);
    }
});

export const myGetEvent = webMethod(Permissions.Anyone, async (eventId) => {
    try {
        const elevatedGetEvent = elevate(wixEventsV2.getEvent);
        const event = await elevatedGetEvent(eventId);
        return event.title;
    } catch (error) {
        console.error("Error getting event", error);
    }
});

export const isWixPlanId = (value) => {
    return typeof value === "string" &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
};