# Nexus Check-In System

A Wix-native check-in and liability waiver system built for Nexus Ballroom SLO, developed as a Computer Engineering senior project using the Wix Velo API. The system replaces the studio's previous Google Forms / Google Sheets workflow with an integrated front-desk check-in form, a branded liability waiver, and automated membership/CRM logic built on top of Wix's native Contacts, Members, Bookings, and Pricing Plans APIs.

> **Note:** This repo has been unlinked from the live nexusslo.com site, as further development has continued outside of this Git Reo.

> **Note:** Additional Google Calendar Integration Application was implemented since the projects completion under src/backend/automations-velo-action-provider. Disregard for purposes of senior project

## Repository Structure

```
src/
├── pages/
│   ├── Liability Form.qgf2x.js     # Liability/waiver form page logic
│   └── Check-In Form.krqdf.js      # Front-desk check-in form page logic
└── backend/                        # Core backend logic (Velo functions, data access)
    └── __spi__/automations-velo-action-provider/
        ├── mem-reg-new/             # New member registration logic
        ├── add-sessions/           # Punch card application: adds sessions to a plan
        ├── credit-sessions/        # Punch card application: credits/restores sessions
        └── ensure-remaining/       # Punch card application: validates remaining sessions
```

### Key Components

- **`src/pages/Liability Form.qgf2x.js`** — Handles liability waiver submission: matches or creates a Wix Member from the submitted contact, applies CRM tags based on dance interests, and triggers the post-submission account-invite email.
- **`src/pages/Check-In Form.krqdf.js`** — Handles front-desk check-in: populates dropdowns from live Wix data (members, events, classes, pricing plans), validates waiver completion, and writes check-in/attendance records.
- **`src/backend/__spi__/automations-velo-action-provider/`** — Backend automation handlers tied to the punch card system and new member registration flow.

## Tech Stack

- [Wix Velo](https://www.wix.com/velo) (JavaScript) — backend/frontend application logic
- Wix Data API, Wix Members API, Wix Events API, Wix Bookings API, Wix Pricing Plans API

## Project Documentation

For full project context (requirements, design rationale, architecture, and testing), see the senior project report.
