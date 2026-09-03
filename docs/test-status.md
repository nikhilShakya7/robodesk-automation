# Robodesk Playwright Test Status

## Overview

Current Playwright test coverage for the Robodesk project, organized feature-wise: one spec file per feature under `tests/`.

## Running

```bash
npx playwright test                     # full suite
npx playwright test admin.spec.ts       # admin features
npx playwright test filters.spec.ts     # tickets-tab filters
npx playwright test auth.spec.ts        # widget login / auth
npx playwright test chat.spec.ts        # chat widget + search/filters
npx playwright test tickets.spec.ts     # my tickets, details, reply, access
npx playwright test create-ticket.spec.ts
npx playwright test credentials-vault.spec.ts
npx playwright test profile.spec.ts
npx playwright test conversation.spec.ts # two-way customer + admin conversation
npx playwright test notifications.spec.ts
```

See [docs/tests.md](tests.md) for the full test documentation.

## Verification Status

### Admin suite (`admin.spec.ts`) — 12 tests

| Test                                                        | Status   | Notes                                                                  |
| ----------------------------------------------------------- | -------- | ---------------------------------------------------------------------- |
| auth: admin can view dashboard                              | Verified | Dashboard renders with cached admin session (login covered by fixture) |
| profile: profile page loads                                 | Verified |                                                                        |
| helpers: create ticket and show toast                       | Verified | Ticket creation + toast                                                |
| helpers: reply to ticket and status change                  | Verified | Dashboard ticket view reply + status change                            |
| dashboard: bulk set status to Open from all tickets view    | Verified | All-tickets view, checkbox + bulk-action Apply                         |
| ticket: priority change persists on dashboard ticket view   | Verified | Change → reload → persists; original restored                          |
| ticket: assignee change persists on dashboard ticket view   | Verified | Change → reload → persists; original restored                          |
| departments: add and delete a category                      | Verified | Taxonomy add + JS confirm dialog accept + delete                       |
| priorities: add and delete a category                       | Verified | Taxonomy add + JS confirm dialog accept + delete                       |
| faq: create, publish and trash a FAQ                        | Verified | Classic editor publish + trash                                         |
| notice: create, publish and trash a notice                  | Verified | Classic editor publish + trash                                         |
| debug log: page loads                                       | Verified |                                                                        |

### Filters suite (`filters.spec.ts`) — 10 tests

| Test                                                        | Status   | Notes                                                                  |
| ----------------------------------------------------------- | -------- | ---------------------------------------------------------------------- |
| tickets: search by keyword filters conversation list        | Verified | Search input updates the ticket table                                  |
| tickets: customer filter by name narrows results            | Verified | Customer autocomplete filter                                           |
| tickets: agent filter by name narrows results               | Verified | Agent autocomplete filter                                              |
| tickets: status filter dropdown filters by status           | Verified | Value retained + count bounds; product filter does NOT filter returned rows (confirmed bug) |
| tickets: priority filter dropdown filters by priority       | Verified | Value retained + count bounds; product filter does NOT filter returned rows (confirmed bug) |
| tickets: per page dropdown changes page size                | Verified | 10, 20, and 50 row limits                                              |
| tickets: clear filters resets all filters                   | Verified | Search and filter controls reset to the default dataset                |
| tickets: combined status and priority filters work together | Verified | Status and priority controls can be selected together                  |
| tickets: pagination next/prev works                         | Verified | Next and previous pages show different rows                            |
| tickets: bulk actions work with filters applied             | Verified | Bulk status update confirmation and cleanup                            |

### Auth suite (`auth.spec.ts`) — 7 tests

| Test                                                                      | Status   | Notes                                                                             |
| ------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------- |
| portal: guest sees login prompt                                           | Verified |                                                                                   |
| auth: customer logs in via chat widget and creates a ticket               | Verified | Email + password widget login, then ticket creation                               |
| auth: widget login blocked for invalid email format                       | Verified |                                                                                   |
| auth: widget login blocked for empty email                                | Verified |                                                                                   |
| auth: widget shows inline errors and skips API call for empty credentials | Verified | Inline errors, no auth POST for empty submits                                     |
| auth: widget rejects wrong password with no session                       | Verified | "Oops! That's not the right password." + no session                               |
| auth: widget blocks new-user registration when disabled                   | Verified | Fresh email → "Registration is currently disabled.", login form stays, no session |

### Chat widget suite (`chat.spec.ts`) — 15 tests

| Test                                                                    | Status   | Notes                                                                                                         |
| ----------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------- |
| chat: home page renders chat widget container                           | Verified |                                                                                                               |
| customer: can use the frontend chat widget                              | Verified |                                                                                                               |
| chat: customer starts a chat conversation after login                   | Verified | Sent message bubble asserted                                                                                  |
| chat: search filters conversations in the widget                        | Verified | Search narrows, no-match message, restore                                                                     |
| chat: priority and status filters work in the widget                    | Verified |                                                                                                               |
| chat: FAQ tab lists questions and search filters them                   | Verified | `.rd-faq-item` count narrows to matching subset, no-match → 0, clear restores                                 |
| chat: FAQ detail opens from the FAQ list                                | Verified | Click item → detail with back button; back restores list                                                      |
| chat: notices render in the widget                                      | Verified | `.rd-notice-item` items render with Notices header                                                            |
| chat: ticket row opens single-ticket chat view and back returns to list | Verified | Message input + back button; back restores list                                                               |
| chat: customer sends an image attachment in a ticket                    | Verified | Uploads `test-data/tiny.jpeg` via hidden `input[type=file]`, preview `.has-preview`, sent message gains image |
| chat: search handles special characters without crashing                | Verified | `.*`, `[abc`, `a+b*c?`, whitespace → no-match message; clear restores                                         |
| chat: session persists across page reload (no re-login)                 | Verified | Reload keeps the logged-in widget view without re-login                                                       |
| chat: empty reply does not send a message                               | Verified | Whitespace leaves the home-chat send button disabled; no message sent                                         |
| chat: uploading an invalid file type is rejected                         | Verified | Non-image upload rejected with error                                                                         |
| chat: uploading an oversized file is rejected                            | Verified | `>5MB` upload rejected with error                                                                            |

### Tickets suite (`tickets.spec.ts`) — 7 tests

| Test                                                               | Status   | Notes                                                                                |
| ------------------------------------------------------------------ | -------- | ------------------------------------------------------------------------------------ |
| tickets: customer can open my tickets page                         | Verified |                                                                                      |
| portal: my tickets page lists tickets and filters work             | Verified | Filters + ticket table                                                               |
| portal: customer can open ticket details from my tickets           | Verified | Frontend `tid=N` detail view                                                         |
| portal: customer can reply to ticket from details page             | Known-flaky | TinyMCE `#comment_ifr` reply + Add Reply; intermittently dropped by WP comment flood control |
| portal: ticket details show conversation id, status and priority metadata | Verified | Meta cards render read-only                                                          |
| portal: customer cannot view another user's ticket via direct link | Verified | Admin creates the ticket; customer opening it via `tid=` gets the permission message |
| portal: non-existent ticket id falls back safely to list           | Verified | Falls back to list, no crash                                                         |

### Create ticket suite (`create-ticket.spec.ts`) — 4 tests (1 skipped)

| Test                                                               | Status   | Notes                                                     |
| ------------------------------------------------------------------ | -------- | --------------------------------------------------------- |
| tickets: create ticket form is available                           | Skipped  | TODO: live UI does not render the form on /submit-ticket/ |
| portal: create ticket form renders and submits a ticket            | Verified | TinyMCE form + successful submit                          |
| portal: create ticket blocks empty title without creating a ticket | Verified | Native validation: no POST, no success                    |
| portal: create ticket accepts special characters in the title      | Verified | Quoting/special-chars title accepted                     |

### Credentials vault suite (`credentials-vault.spec.ts`) — 4 tests

| Test                                                    | Status   | Notes                                   |
| ------------------------------------------------------- | -------- | --------------------------------------- |
| portal: credentials vault shows and stores a credential | Verified | Add persists, delete via confirm dialog |
| vault: cancelling delete keeps the credential           | Verified | Delete confirm dialog cancelled         |
| vault: empty required fields block submission           | Verified | No POST, no credential added            |
| vault: missing password field blocks submission         | Verified | No POST, no credential added            |

### Profile suite (`profile.spec.ts`) — 3 tests

| Test                                           | Status   | Notes                                    |
| ---------------------------------------------- | -------- | ---------------------------------------- |
| portal: customer can update profile first name | Verified | Update persists; original value restored |
| profile: password mismatch is flagged and submit is blocked | Verified | `pressSequentially` fires `keyup`; feedback shown, no submit |
| profile: weak password lists missing requirements | Verified | Weak password feedback lists unmet requirements |

### Notifications suite (`notifications.spec.ts`) — 2 tests

| Test                                                    | Status   | Notes                                                                 |
| ------------------------------------------------------- | -------- | --------------------------------------------------------------------- |
| notifications: portal page renders notification area    | Verified | Renders mark-all button and/or notification items                     |
| notifications: admin reply generates notification and mark-all-read clears it | Verified | Admin reply → unread item; mark-all-read removes unread state |

### Conversation suite (`conversation.spec.ts`) — 1 test

| Test                                                                               | Status   | Notes                                                                                                                                                              |
| ---------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| conversation: customer (widget) and admin (backend) exchange replies on one ticket | Verified | Two browser contexts: customer creates ticket in portal, admin replies from wp-admin ticket view, customer replies from the chat widget, admin reloads and sees it |

## Known Constraints

- **Server-side rate limiting**: the widget email-check endpoint allows **10 checks per IP per hour** ("Too many attempts. Please try again later."). All local requests share one IP, so the whole suite shares the budget. Portal tests log in once per worker and cache the session to `.state/customer-widget-storage.json`; delete that file to force a fresh login. The password login REST endpoint is not rate limited.
- Portal tests rely on a valid cached session (`.state/customer-widget-storage.json`); if it expires server-side, delete it and re-run.
- Admin tests log in once per worker and cache the session to `.state/admin-wp-storage.json` (delete to force a fresh login); the suite uses a 180s per-test timeout because dashboard pages can load slowly under load.
- The conversation test uses the `conversationTest` fixture (customer + admin contexts in one test) and relies on the dashboard "Active Conversations" view; the tickets table truncates titles to 20 characters, so tests match on the truncated prefix.
- The rate-limit transients (`robodesk_email_check_rate_*` in `wp_options`, 1-hour TTL) can be cleared manually during development via the Local MySQL socket; avoid running the auth suite more than twice per hour (4 email checks per run).
- The portal reply test (`portal: customer can reply to ticket from details page`) is **known-flaky**: it posts via the embedded WP comment form and is intermittently dropped by WordPress comment flood control. Leave as-is per maintainer decision.

## Planned Next Steps

- Revisit the /submit-ticket/ form scenario when the live UI exposes the expected elements
- Add more negative coverage (XSS sanitization, long titles, rate-limit lockout assertion)
- Expand coverage for settings and support-staff permissions (settings page currently returns 403 for the test admin role)
- Possible extensions of the two-way conversation test: image attachment from the widget in the same thread, customer status change, notification badges
