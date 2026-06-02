import { webMethod, Permissions } from "wix-web-module";
import { members } from 'wix-members.v2'; // Membership SDK
import { contacts } from "wix-crm.v2";
import * as wixAuth from "wix-auth";

const PAGE_SIZE = 500;
const MAX_PAGES = 10; // You can dynamically increase this as needed

/**
 * Code pulled from https://dev.wix.com/docs/velo/apis/wix-members-v2/members/list-members
 * @param N/A
 * @returns {Promise<Array<{label:string, value:string}>>}
 */
export const queryMembers = webMethod(Permissions.Anyone, async () => {
    try {
        const options = { fieldsets: ["FULL"] };
        const elevatedQueryMembers = wixAuth.elevate(members.queryMembers);

        const pagePromises = Array.from({ length: MAX_PAGES }, (_, i) => {
            return elevatedQueryMembers(options).skip(i * PAGE_SIZE).limit(PAGE_SIZE).find();
        });

        const results = await Promise.all(pagePromises);
        const allItems = results.flatMap(res => res.items);

        const memberList = allItems
            .sort((a, b) => (a.contact?.firstName || "").localeCompare(b.contact?.firstName || ""))
            .map(member => {
                const firstName = member.contact?.firstName || "";
                const lastName = member.contact?.lastName || "";
                const name = `${firstName} ${lastName}`.trim();
                return name ? { label: name, value: member._id } : null;
            })
            .filter(Boolean); // Removes nulls (i.e., members without names)

        //console.log("Site members:", memberList);
        return memberList;

    } catch (error) {
        console.error("Error retrieving member list:", error);
        throw new Error("Unable to fetch dropdown member list");
    }
}, );

/**
 * Code pulled from https://dev.wix.com/docs/velo/apis/wix-members-v2/members/list-members
 * @param N/A
 * @returns {Promise<Array<{label:string, value:string}>>}
 */
export const queryMembersNames = webMethod(Permissions.Anyone, async () => {
    try {
        const options = { fieldsets: ["FULL"] };
        const elevatedQueryMembers = wixAuth.elevate(members.queryMembers);

        const pagePromises = Array.from({ length: MAX_PAGES }, (_, i) => {
            return elevatedQueryMembers(options).skip(i * PAGE_SIZE).limit(PAGE_SIZE).find();
        });

        const results = await Promise.all(pagePromises);
        const allItems = results.flatMap(res => res.items);

        const memberList = allItems
            .sort((a, b) => (a.contact?.firstName || "").localeCompare(b.contact?.firstName || ""))
            .map(member => {
                const firstName = member.contact?.firstName || "";
                const lastName = member.contact?.lastName || "";
                const name = `${firstName} ${lastName}`.trim();
                return name ? { label: name, value: name } : null;
            })
            .filter(Boolean); // Removes nulls (i.e., members without names)

        //console.log("Site members:", memberList);
        return memberList;

    } catch (error) {
        console.error("Error retrieving member list:", error);
        throw new Error("Unable to fetch dropdown member list");
    }
}, );

// /**
//  * Code pulled from https://dev.wix.com/docs/velo/apis/wix-members-v2/members/list-members
//  * @param N/A
//  * @returns {Promise<Array<{label:string, value:string}>>}
//  */
// export const queryContacts = webMethod(Permissions.Anyone, async () => {
//     try {
//         const options = { fieldsets: ["FULL"] };
//         let allItems = [];

//         const elevatedQueryContacts = wixAuth.elevate(contacts.queryContacts);
//         let results = await elevatedQueryContacts(options).limit(1000).find();
//         allItems.push(...results.items);

//         while (results.hasNext()) {
//             results = await results.next();
//             allItems.push(...results.items);
//         }

//         const contactList = allItems
//             .sort((a, b) => (a.info.name.first || "").localeCompare(b.info.name.last || ""))
//             .map(contact => {
//                 const name = `${contact.info.name.first} ${contact.info.name.last}`;
//                 return { label: name.trim(), value: contact._id };
//             });

//         //console.log("Site members:", contactList);
//         return contactList;

//     } catch (error) {
//         console.error("Error retrieving member list:", error);
//         throw new Error("Unable to fetch dropdown member list");
//     }
// }, );

/**
 * Code pulled from https://dev.wix.com/docs/velo/apis/wix-members-v2/members/list-members
 * @param N/A
 * @returns {Promise<Array<{label:string, value:string}>>}
 */
export const queryMembers_Fast = webMethod(Permissions.Anyone, async (searchTerm) => {
    try {
        const options = { fieldsets: ["FULL"], search: { expression: searchTerm }, fields: ["contact.firstName", "contact.lastName"] };
        let allItems = [];

        const elevatedQueryMembers = wixAuth.elevate(members.queryMembers);

        let results = await elevatedQueryMembers(options).limit(1000).find();
        allItems.push(...results.items);
        while (results.hasNext()) { results = await results.next();
            allItems.push(...results.items); }

        const memberList = allItems
            .sort((a, b) => (a.contact?.firstName || "").localeCompare(b.contact?.firstName || ""))
            .map(member => {
                const firstName = member.contact?.firstName || "";
                const lastName = member.contact?.lastName || "";
                const name = `${firstName} ${lastName}`.trim();
                return name ? { label: name, value: member._id } : null;
            })
            .filter(Boolean); // Removes nulls (i.e., members without names)

        console.log("Site members:", memberList);
        return memberList;

    } catch (error) {
        console.error("Error retrieving member list:", error);
        throw new Error("Unable to fetch dropdown member list");
    }
}, );