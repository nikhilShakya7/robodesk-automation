# Robodesk Playwright Test Status

## Overview
Current Playwright test coverage for the Robodesk project, organized feature-wise: one spec file per feature under `tests/`.

## Running

```bash
npx playwright test                     # full suite
npx playwright test admin.spec.ts       # admin features
npx playwright test auth.spec.ts        # widget login / auth
npx playwright test chat.spec.ts        # chat widget + search/filters
npx playwright test tickets.spec.ts     # my tickets, details, reply, access
npx playwright test create-ticket.spec.ts
npx playwright test credentials-vault.spec.ts
npx playwright test profile.spec.ts
```

See [docs/tests.md](tests.md) for the full test documentation.

## Verification Status

### Admin suite (`admin.spec.ts`) — 4 tests

| Test | Status | Notes |
| --- | --- | --- |
| auth: admin can view dashboard | Verified | Admin login + dashboard |
| profile: profile page loads | Verified | |
| helpers: create ticket and show toast | Verified | Ticket creation + toast |
| helpers: reply to ticket and status change | Verified | Dashboard ticket view reply + status change |

### Auth suite (`auth.spec.ts`) — 6 tests

| Test | Status | Notes |
| --- | --- | --- |
| portal: guest sees login prompt | Verified | |
| auth: customer logs in via chat widget and creates a ticket | Verified | Email + password widget login, then ticket creation |
| auth: widget login blocked for invalid email format | Verified | |
| auth: widget login blocked for empty email | Verified | |
| auth: widget shows inline errors and skips API call for empty credentials | Verified | Inline errors, no auth POST for empty submits |
| auth: widget rejects wrong password with no session | Verified | "Oops! That's not the right password." + no session |

### Chat widget suite (`chat.spec.ts`) — 5 tests

| Test | Status | Notes |
| --- | --- | --- |
| chat: home page renders chat widget container | Verified | |
| customer: can use the frontend chat widget | Verified | |
| chat: customer starts a chat conversation after login | Verified | Sent message bubble asserted |
| chat: search filters conversations in the widget | Verified | Search narrows, no-match message, restore |
| chat: priority and status filters work in the widget | Verified | |

### Tickets suite (`tickets.spec.ts`) — 6 tests

| Test | Status | Notes |
| --- | --- | --- |
| tickets: customer can open my tickets page | Verified | |
| portal: my tickets page lists tickets and filters work | Verified | Filters + ticket table |
| portal: customer can open ticket details from my tickets | Verified | Frontend `tid=N` detail view |
| portal: customer can reply to ticket from details page | Verified | TinyMCE `#comment_ifr` reply + Add Reply |
| portal: customer cannot view another user's ticket via direct link | Verified | Permission message, no comment form |
| portal: non-existent ticket id falls back safely to list | Verified | Falls back to list, no crash |

### Create ticket suite (`create-ticket.spec.ts`) — 3 tests (1 skipped)

| Test | Status | Notes |
| --- | --- | --- |
| tickets: create ticket form is available | Skipped | TODO: live UI does not render the form on /submit-ticket/ |
| portal: create ticket form renders and submits a ticket | Verified | TinyMCE form + successful submit |
| portal: create ticket blocks empty title without creating a ticket | Verified | Native validation: no POST, no success |

### Credentials vault suite (`credentials-vault.spec.ts`) — 1 test

| Test | Status | Notes |
| --- | --- | --- |
| portal: credentials vault shows and stores a credential | Verified | Add persists, delete via confirm dialog |

### Profile suite (`profile.spec.ts`) — 1 test

| Test | Status | Notes |
| --- | --- | --- |
| portal: customer can update profile first name | Verified | Update persists; original value restored |

## Known Constraints

- **Server-side rate limiting**: the widget email-check endpoint allows **10 checks per IP per hour** ("Too many attempts. Please try again later."). All local requests share one IP, so the whole suite shares the budget. Portal tests log in once per worker and cache the session to `.state/customer-widget-storage.json`; delete that file to force a fresh login. The password login REST endpoint is not rate limited.
- Portal tests rely on a valid cached session (`.state/customer-widget-storage.json`); if it expires server-side, delete it and re-run.

## Planned Next Steps

- Expand coverage for departments, priorities, FAQs, notices, settings, and permissions
- Revisit the /submit-ticket/ form scenario when the live UI exposes the expected elements
- Add more negative coverage (XSS sanitization, long titles, rate-limit lockout assertion)
