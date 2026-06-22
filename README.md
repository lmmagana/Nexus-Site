# Nexus Check-In System

A Wix-native check-in and liability waiver system built for Nexus Ballroom SLO, developed as a Computer Engineering senior project using the Wix Velo API. The system replaces the studio's previous Google Forms / Google Sheets workflow with an integrated front-desk check-in form, a branded liability waiver, and automated membership/CRM logic built on top of Wix's native Contacts, Members, Bookings, and Pricing Plans APIs.

> **Note:** This repo has been unlinked from the live nexusslo.com site, as further development has continued outside of this Git integration.

> **Note:** Additional Google Calendar Integration Application was implemented since the projects completion under src/backend/automations-velo-action-provider. Disregard for purposes of senior project

The majority of the custom code developed for this project lives in `src/backend/`. The liability and check-in pages themselves are thin — the liability form is a native Wix form, and the check-in form's heavy lifting is delegated to backend modules — so most of the project's logic (membership lookups, pricing plan tracking, event/booking integration, and automation handlers) lives in the backend files described below.

## Repository Structure

```
src/
├── pages/
│   ├── Liability Form.qgf2x.js     # Native Wix form page; minimal custom logic (post-submit lightbox)
│   └── Check-In Form.krqdf.js      # Front-desk check-in page logic
└── backend/                        # Core backend logic — the bulk of this project's custom code
    ├── booking.jsw                 # Adds checked-in attendees as booking participants
    ├── events.web.js               # Queries events/tickets and handles event booking
    ├── listMembers.web.js          # Queries Wix Members for check-in dropdowns
    ├── members.jsw                 # Membership & pricing plan logic (active plans, remaining sessions/privates, payment types)
    ├── services.jsw                # Returns the day's class offerings for check-in
    ├── submit.web.js               # Processes and stores check-in form submissions
    ├── constants.js                # Extended-field keys and pricing plan ID/name lookups
    ├── helpers.js                  # Shared lookup web methods (member, contact, plan, service, ticket, event) used by automation handlers
    ├── googleCalendar.js           # Google Calendar sync (Used for seperate google Calendar Integration Application)
    ├── permissions.json            # Wix web module permission settings (default Velo scaffolding)
    └── __spi__/automations-velo-action-provider/
        ├── mem-reg-new/             # Wix Automation handler: creates/updates a Wix Member from a submitted liability form and applies CRM labels based on selected dance interests
        ├── add-sessions/           # Punch card application: adds sessions to a plan
        ├── credit-sessions/        # Punch card application: credits/restores sessions
        └── ensure-remaining/       # Punch card application: validates remaining sessions
```

### Key Components

- **`src/pages/Check-In Form.krqdf.js`** — Front-desk check-in page logic. Orchestrates calls into `listMembers.web.js`, `members.jsw`, `services.jsw`, `events.web.js`, `booking.jsw`, and `submit.web.js` to populate dropdowns, validate active plans, and process check-ins:

  ```js
  import { queryMembers } from 'backend/listMembers.web';
  import { checkActivePlan, addPlan, getPlansForDropdown, getSessionsRemaining, getPrivatesRemaining, paymentTypes } from 'backend/members.jsw';
  import { getServicesForToday } from 'backend/services.jsw';
  import { submission } from 'backend/submit.web'
  import { queryEvents, queryTickets, bookEvent } from 'backend/events.web'
  import { addParticipant } from 'backend/booking.jsw'
  import wixSiteFrontend from "wix-site-frontend";
  ```

- **`src/pages/Liability Form.qgf2x.js`** — A native Wix form page. The page code itself only opens a "Thank You" lightbox on successful submission; member creation and tagging are handled server-side by the `mem-reg-new` automation handler (see below), not by this page's code directly.
- **`src/backend/members.jsw`** — Core membership/pricing-plan logic: checking active plans, adding plans, computing remaining sessions/privates, and exposing available payment types.
- **`src/backend/listMembers.web.js`** — Exposes member queries to the front end for the check-in "Contact Name" dropdown.
- **`src/backend/services.jsw`** — Returns the studio's class offerings for the current day.
- **`src/backend/events.web.js`** — Handles event/ticket queries and event booking.
- **`src/backend/booking.jsw`** — Adds checked-in attendees as participants on the relevant booking.
- **`src/backend/submit.web.js`** — Processes and persists check-in form submissions.
- **`src/backend/___spi___/automations-velo-action-provider/mem-reg-new/`** — Wix Automations action triggered on liability form submission. Creates a new Wix Member (or updates an existing one matched by email) from the submitted contact info, then applies CRM labels for each dance-interest checkbox the attendee selected.
- **`src/backend/___spi___/automations-velo-action-provider/`** (other folders) — Additional automation handlers tied to the punch card system (`add-sessions`, `credit-sessions`, `ensure-remaining`) and Google Calendar sync (`migrate-bookings`, `update-calendar`, `remove-calendar`, `request-to-calendar`, `send-to-calendar`).

## Tech Stack

- [Wix Velo](https://www.wix.com/velo) (JavaScript) — backend/frontend application logic
- Wix Data API, Wix Members API, Wix Events API, Wix Bookings API, Wix Pricing Plans API, Wix Automations

## Project Documentation

For full project context (requirements, design rationale, architecture, and testing), see the senior project report.
