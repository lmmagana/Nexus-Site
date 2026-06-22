import { members, authentication } from 'wix-members.v2'; // Membership SDK
import { contacts } from 'wix-crm-backend';
import { webMethod, Permissions } from "wix-web-module";
import { elevate } from "wix-auth";

const toTitleCase = (str) => str.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
const elevatedCreateMember = elevate(members.createMember);
const elevatedUpdateMember = elevate(members.updateMember);
const elevatedQueryMember = elevate(members.queryMembers);

/**
 * Autocomplete function declaration, do not delete
 * @returns Promise<string> A friendly greeting
 */
export const createNewMember = webMethod(Permissions.Anyone, async (memFirst, memLast, memEmail, memPhone) => {
    const upperFirst = toTitleCase(memFirst);
    const upperLast = toTitleCase(memLast)

    const existingMem = await elevatedQueryMember().eq("loginEmail", memEmail).find();
    const elevatedSendSetPasswordEmail = elevate(authentication.sendSetPasswordEmail);

    try {
        if (existingMem.totalCount > 0) { // Member exists, get memId
            const memId = existingMem.items[0]._id;

            await elevatedUpdateMember(memId, {
                contact: {
                    emails: [memEmail],
                    phones: [memPhone],
                    firstName: upperFirst,
                    lastName: upperLast,
                },
                loginEmail: memEmail,
                privacyStatus: "PUBLIC",
                profile: {
                    nickname: `${upperFirst} ${upperLast}`.trim(),
                }
            });
            console.log(`Member ${upperFirst} ${upperLast} exists, and was updated!`);
            return memId;
        } else {
            const newMem = await elevatedCreateMember({
                member: {
                    contact: {
                        emails: [memEmail],
                        phones: [memPhone],
                        firstName: upperFirst,
                        lastName: upperLast,
                    },
                    loginEmail: memEmail,
                    privacyStatus: "PUBLIC",
                    profile: {
                        nickname: `${upperFirst} ${upperLast}`.trim(),
                    }
                }
            });
            console.log(`New Member ${upperFirst} ${upperLast} created!`);
            await elevatedSendSetPasswordEmail(memEmail); //Send password email
            return newMem.contactId;
        }
    } catch (error) {
        console.error(`Failed to create or update new member from ${upperFirst} ${upperLast}`, error);
        return "null";
    }
}, );

/**
 * Autocomplete function declaration, do not delete
 * @param {import('./__schema__.js').Payload} options
 */
export const invoke = async ({ payload }) => {
    const firstName = payload['field:first_name_805e'] ?? '';
    const lastName = payload['field:last_name_75d1'] ?? '';
    const email = payload.contact.email;
    const phone = payload.contact.phone;

    //Create new Member
    const newContact = await createNewMember(firstName, lastName, email, phone);

    //add labels to new contact tied to new member
    try {
        const labels = await payload.submissions;
        for (const { label, value } of labels) {
            if ((!label.includes("I have read")) && (value === "Checked")) {
                const displayName = toTitleCase(label.replace(/^label_/, '').replace(/_/g, ' ').replace('field:', ''));
                const current_label = await contacts.findOrCreateLabel(displayName, { suppressAuth: true, });
                await contacts.labelContact(newContact, [current_label.label.key], { suppressAuth: true, });
                console.log(`${label} → ${value}`);
            }
        }
    } catch (error) {
        console.error("Failed to get checkbox list", error);
    }
    return {} // The function must return an empty object, do not delete
};
