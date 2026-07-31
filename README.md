# Robodesk Local Test

End-to-end Playwright test suite for the Robodesk customer support plugin, running against a local WordPress installation (`http://robodesk1.local`).

## Prerequisites

- Node.js 20.12+ (uses `process.loadEnvFile`; tested on v24)
- Playwright browsers installed: `npx playwright install chromium`
- A running Robodesk WordPress site reachable at the configured `BASE_URL`

## Setup

```bash
npm install
npx playwright install chromium

# Configure credentials
cp .env.example .env
# edit .env with your real values
```

Credentials (`BASE_URL`, admin/customer login) live in `.env` — see `.env.example` for the template. `.env` is gitignored.

## Running the tests

```bash
npx playwright test            # full suite
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

Reports: HTML report in `playwright-report/` (`npx playwright show-report`), plus traces/videos on failure in `test-results/`.

## What is covered

- **Admin suite** (`tests/admin.spec.ts`): admin login + dashboard, profile page, reply + status change in wp-admin
- **Customer suite** (`tests/customer.spec.ts`):
  - Guest portal prompts, public My Tickets page, chat widget presence
  - Widget login (email only for new users; email + password for existing users)
  - Chat conversation creation after login
  - Widget conversation search and priority/status filters
  - Support portal pages after widget login: My Tickets (filters, ticket details), Create Ticket (TinyMCE form + submit), Credentials Vault (add/delete credentials)

## Architecture

```
├── tests/                  # Playwright specs (admin.spec.ts, customer.spec.ts)
├── src/
│   ├── config/env.ts       # Loads .env into typed config
│   ├── pages/              # Page Object Model
│   │   ├── basePage.ts             # goto, waitForLoading, waitForToast
│   │   ├── loginPage.ts            # wp-login flow
│   │   ├── dashboardPage.ts        # admin dashboard
│   │   ├── customerPortalPage.ts   # /robodesk-support/ guest view
│   │   ├── myTicketsPage.ts        # my-tickets list + filters
│   │   ├── createTicketPage.ts     # create-ticket form (TinyMCE-aware)
│   │   ├── credentialsVaultPage.ts # credentials vault CRUD
│   │   ├── ticketDetailsPage.ts    # ticket detail view
│   │   ├── chatWidgetPage.ts       # widget open/login/chat/search/filter
│   │   └── profilePage.ts, notificationsPage.ts
│   ├── helpers/robodeskHelpers.ts  # login, createTicket, reply, toast, etc.
│   ├── fixtures/roles.ts           # role fixtures + portalTest (session reuse)
│   └── data/fakeData.ts            # deterministic random test data
├── docs/
│   ├── tests.md            # Full test documentation
│   └── test-status.md      # Verification status per test
├── .env / .env.example     # Credentials and environment config
└── playwright.config.ts
```

## Key behaviors

- **Widget login for existing users**: the chat widget checks the email first; if the user exists, a password field appears (button changes from Continue to Login). New users have no password step.
- **Portal session reuse**: `portalTest` logs the customer in once per worker through the widget and caches the session to `.state/customer-widget-storage.json`, so the portal tests don't repeatedly hit the server-side login rate limiter. Delete that file to force a fresh login.
- **Server-side rate limiting**: the widget login endpoint returns "Too many attempts. Please try again later." after repeated logins. If tests hit this, wait a few minutes for the limit to reset.
- **TinyMCE**: the create-ticket description is a hidden `textarea#ticket_content`; tests type into `iframe#ticket_content_ifr`.
- **Vault delete**: deletion uses a native `confirm()` dialog, which the page object accepts.

## Documentation

- `docs/tests.md` — detailed test-by-test documentation
- `docs/test-status.md` — current verification status
