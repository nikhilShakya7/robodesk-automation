# Robodesk Playwright Test Documentation

## Overview

End-to-end test suite for the Robodesk customer support plugin, built with Playwright Test.

- Base URL: `http://robodesk1.local`
- Browser: Chromium (Desktop Chrome), headless
- Framework: `@playwright/test`
- Page Object Model under `src/pages/`
- Shared helpers under `src/helpers/`
- Role fixtures under `src/fixtures/`

## Running the Tests

```bash
# Full suite
npx playwright test

# Per role
npx playwright test admin.spec.ts
npx playwright test customer.spec.ts

# By tag
npx playwright test --grep "@smoke"
npx playwright test --grep "@regression"
npx playwright test --grep "@admin"
npx playwright test --grep "@customer"
npx playwright test --grep "@chat"

# Single test
npx playwright test customer.spec.ts --grep "credentials vault"
```

## Test Files

| File | Role | Tests |
| --- | --- | --- |
| `tests/admin.spec.ts` | Admin | 3 |
| `tests/customer.spec.ts` | Customer / Guest / Chat | 14 |
| `tests/example.spec.ts` | Playwright scaffold | 2 (boilerplate, not Robodesk) |

## Admin Tests (`tests/admin.spec.ts`)

| Test | Tags | What it verifies |
| --- | --- | --- |
| auth: admin can view dashboard | @smoke @regression @admin | Admin login via `/wp-login.php` (`admin`/`admin`) and the dashboard core menu renders |
| profile: profile page loads | @regression @admin | Profile page opens for the admin session |
| helpers: reply to ticket and status change | @regression @admin | Opens a ticket in wp-admin, posts a reply, and changes status to Open |

## Customer Tests (`tests/customer.spec.ts`)

### Guest / Public access

| Test | Tags | What it verifies |
| --- | --- | --- |
| portal: guest sees login prompt | @smoke @regression @customer | `/robodesk-support/` shows the "Please login" prompt for guests |
| tickets: customer can open my tickets page | @smoke @regression @customer | Public My Tickets page opens |
| tickets: create ticket form is available | @smoke @regression @customer | SKIPPED - live UI does not render the form on `/submit-ticket/` (documented TODO) |
| chat: home page renders chat widget container | @regression @chat | Chat widget container is present on the home page |
| customer: can use the frontend chat widget | @regression @customer | Widget opens from the home page |
| helpers: create ticket and show toast | @regression @customer | Ticket creation flow runs and the success toast appears |

### Chat widget login (`customer login via chat widget`)

| Test | Tags | What it verifies |
| --- | --- | --- |
| auth: customer logs in via chat widget and creates a ticket | @smoke @regression @customer | Widget login with existing user email + password (`shakyanikhil2003@gmail.com` / `Cat@12345`), then ticket creation |
| chat: customer starts a chat conversation after login | @smoke @regression @customer | Sends a message from the widget chat tab and asserts the sent bubble appears |
| auth: widget login blocked for invalid email format | @regression @customer | Non-email input keeps the login form open |
| auth: widget login blocked for empty email | @regression @customer | Empty submit keeps the login form open |

### Support portal pages (login required via chat widget)

The fixture `portalTest` logs the customer in **once per worker through the chat widget** and reuses the session (cached to `test-results/customer-widget-storage.json`) to avoid server-side rate limiting.

| Test | Tags | What it verifies |
| --- | --- | --- |
| portal: my tickets page lists tickets and filters work | @smoke @regression @customer | `?robodesk_page=my-tickets` renders filters (priority, status, order) and the ticket table; status filter applies |
| portal: customer can open ticket details from my tickets | @regression @customer | Clicking a ticket row opens the ticket detail view (`tid=N`) |
| portal: create ticket form renders and submits a ticket | @regression @customer | `?robodesk_page=create-ticket` shows title, TinyMCE description editor, and priority select; submits a new ticket successfully |
| portal: credentials vault shows and stores a credential | @smoke @regression @customer | `?robodesk_page=credentials-vault` lists credentials; adding a credential persists it to the table; deletion (confirm dialog) removes it |

## Test Tags

| Tag | Scope |
| --- | --- |
| `@smoke` | Critical smoke coverage |
| `@regression` | Full regression coverage |
| `@admin` | Admin role |
| `@customer` | Customer role / portal |
| `@chat` | Chat widget |

## Architecture

```
src/
├── pages/            # Page Object Model
│   ├── basePage.ts           # goto, waitForLoading, waitForToast
│   ├── loginPage.ts          # wp-login flow
│   ├── dashboardPage.ts      # admin dashboard
│   ├── customerPortalPage.ts # /robodesk-support/ guest view
│   ├── myTicketsPage.ts      # my-tickets list + filters
│   ├── createTicketPage.ts   # create-ticket form (TinyMCE-aware)
│   ├── credentialsVaultPage.ts # credentials vault CRUD
│   ├── ticketDetailsPage.ts  # ticket detail view
│   ├── chatWidgetPage.ts     # widget open/login/chat flows
│   └── ...                   # profile, notifications
├── helpers/
│   └── robodeskHelpers.ts    # login, createTicket, reply, toast, etc.
├── fixtures/
│   └── roles.ts              # test + portalTest (storageState reuse)
└── data/
    └── fakeData.ts           # random ticket/reply/user data
```

## Notes & Known Constraints

- **Server-side rate limiting**: the widget login endpoint blocks repeated logins with "Too many attempts. Please try again later." The portal tests mitigate this by logging in once per worker and caching the session to disk. If a cached session expires, delete `test-results/customer-widget-storage.json` and wait for the limit to reset.
- **TinyMCE editor**: the create-ticket description field is a hidden `textarea#ticket_content`; tests type into `iframe#ticket_content_ifr` instead.
- **Vault delete**: deletion triggers a native `confirm()` dialog which the page object accepts.
- **Skipped test**: the `/submit-ticket/` form scenario stays skipped until the live UI renders the expected form.
