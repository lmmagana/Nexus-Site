export const privatesExtendedField = 'custom.privates-remaining';
export const sessionsExtendedField = 'custom.sessions-remaining';

import { services } from 'wix-bookings.v2';

export async function getServiceIds() { //Look Up Service IDs
  const result = await services.queryServices().find();

  const list = result.items.map(service => `${service._id} | ${service.name}`).join('\n');
  console.log(list);
}

export const plansToAdd = new Set([
    'c6dc3c10-6b44-4e0a-aba6-8789d61e2102', // Punch Card 5-Pack 
    '6dc57d5d-820b-436e-88f8-252ccf2786a9', // Punch Card 10-Pack
    '73792765-d4ed-4398-87ac-6c439b34ec1a', // Private Lesson 5-Pack
    'bc24dc72-6a48-4532-9b9e-1b59d144c8fd', // Private Lesson 10-Pack
    'a60d69c8-ae8e-4c8b-bf65-ea9d7169a1a4' // Private Lesson 15-Pack
]);

export const PLAN_LOOKUP = {
  "23b421ab-3879-4c86-84dd-df787a54bb42": "Class Drop-In",
  "77ba8eb8-3aa0-4368-a786-49825cd13a1c": "Day Pass",
  "58db4d38-5b5b-42da-aa0e-6e8d375ba828": "Intro Offer",
  "c6dc3c10-6b44-4e0a-aba6-8789d61e2102": "Punch Card 5-Pack",
  "136a32b7-9a2e-42ff-b2b3-4dd748d8a086": "Private Lesson",
  "6dc57d5d-820b-436e-88f8-252ccf2786a9": "Punch Card 10-Pack",
  "73792765-d4ed-4398-87ac-6c439b34ec1a": "Private Lesson 5-Pack",
  "bc24dc72-6a48-4532-9b9e-1b59d144c8fd": "Private Lesson 10-Pack",
  "a60d69c8-ae8e-4c8b-bf65-ea9d7169a1a4": "Private Lesson 15-Pack",
  "Physical Punch Card 5-Pack – $90": "Physical Punch Card 5-Pack",
  "Physical Punch Card 10-Pack – $149": "Physical Punch Card 10-Pack",
  "Other": "Other",
  "N/A": "N/A"
};