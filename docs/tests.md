# Robodesk Playwright Test Documentation

## Overview

End-to-end test suite for the Robodesk customer support plugin, built with Playwright Test.

- Base URL: `http://robodesk1.local`
- Browser: Chromium (Desktop Chrome), headless
- Framework: `@playwright/test`
- Page Object Model under `src/pages/`
- Shared helpers under `src/helpers/`
- Role fixtures under `src/fixtures/`

Tests are organized **feature-wise**: one spec file per feature.

## Running the Tests

```bash
# Full suite
npx playwright test

# Per feature
npx playwright test admin.spec.ts
npx playwright test auth.spec.ts
npx playwright test chat.spec.ts
npx playwright test tickets.spec.ts
npx playwright test create-ticket.spec.ts
npx playwright test credentials-vault.spec.ts
npx playwright test profile.spec.ts

# By tag
npx playwright test --grep "@smoke"
npx playwright test --grep "@regression"
npx playwright test --grep "@admin"
npx playwright test --grep "@customer"
npx playwright test --grep "@chat"

# Single test
npx playwright test tickets.spec.ts --grep "reply to ticket"
```

## Test Files

| File | Feature | Tests |
| --- | --- | --- |
| `tests/admin.spec.ts` | Admin: login, profile, ticket ops, bulk, taxonomies, FAQs, notices | 12 |
| `tests/auth.spec.ts` | Widget login / auth | 6 |
| `tests/chat.spec.ts` | Chat widget, search, filters | 5 |
| `tests/tickets.spec.ts` | My tickets, details, reply, access | 6 |
| `tests/create-ticket.spec.ts` | Create ticket (submit + validation) | 3 (1 skipped) |
| `tests/credentials-vault.spec.ts` | Credentials vault CRUD | 1 |
| `tests/profile.spec.ts` | Customer profile update | 1 |
| **Total** | | **34** |

## Admin Tests (`tests/admin.spec.ts`)

| Test | Tags | What it verifies |
| --- | --- | --- |
| auth: admin can view dashboard | @smoke @regression @admin | Admin login via `/wp-login.php` and the dashboard core menu renders |
| profile: profile page loads | @regression @admin | Profile page opens for the admin session |
| helpers: create ticket and show toast | @regression @customer | Ticket creation flow on `/submit-ticket/` and the success toast appears |
| helpers: reply to ticket and status change | @regression @admin | Opens a ticket from the Robodesk dashboard (`admin.php?page=robodesk-dashboard&tab=dashboard&ticket=N`), posts a reply via `#new-reply` + `#send-reply-btn`, changes status via `#ticket-status-select` |
| dashboard: bulk set status to Open from all tickets view | @regression @admin | On `tab=tickets&status=all`: checks a row `.ticket-checkbox`, applies `#bulk-action-select` "Set Status: Open" via `#apply-bulk-action`, body shows the updated notice |
| ticket: priority change persists on dashboard ticket view | @regression @admin | Changes `#ticket-priority-select` to a different value, reloads the ticket view, asserts it persisted, then restores the original |
| ticket: assignee change persists on dashboard ticket view | @regression @admin | Changes `#ticket-assignee-select` to a different agent (value = user ID), reloads, asserts persistence, restores |
| departments: add and delete a category | @regression @admin | `edit-tags.php?taxonomy=robodesk_ticket_category`: adds via `#tag-name` + `#submit`, expects "Item added." notice, deletes via `a.delete-tag` (accepts the JS confirm dialog), row removed |
| priorities: add and delete a category | @regression @admin | Same flow on `taxonomy=robodesk_ticket_priority` |
| faq: create, publish and trash a FAQ | @regression @admin | Classic editor `post-new.php?post_type=robodesk_faq`: fills `#title`, clicks `#publish`, expects "Post published.", then moves the row to Trash via `a.submitdelete` |
| notice: create, publish and trash a notice | @regression @admin | Same flow on `post_type=notice` |
| debug log: page loads | @regression @admin | `admin.php?page=robodesk-debug-log` renders for the admin session |

## Auth Tests (`tests/auth.spec.ts`)

| Test | Tags | What it verifies |
| --- | --- | --- |
| portal: guest sees login prompt | @smoke @regression @customer | `/robodesk-support/` shows the "Please login" prompt for guests |
| auth: customer logs in via chat widget and creates a ticket | @smoke @regression @customer | Widget login with existing user email + password, then ticket creation |
| auth: widget login blocked for invalid email format | @regression @customer | Non-email input keeps the login form open (no session) |
| auth: widget login blocked for empty email | @regression @customer | Empty submit keeps the login form open |
| auth: widget shows inline errors and skips API call for empty credentials | @regression @customer | Empty email → "Your email address is needed to continue." and empty password → "Password is required."; asserts no auth POST fires for either |
| auth: widget rejects wrong password with no session | @smoke @regression @customer | Wrong password shows "Oops! That's not the right password." and no conversation view is rendered |

## Chat Widget Tests (`tests/chat.spec.ts`)

| Test | Tags | What it verifies |
| --- | --- | --- |
| chat: home page renders chat widget container | @regression @chat | Chat widget container is present on the home page |
| customer: can use the frontend chat widget | @regression @customer | Widget opens from the home page |
| chat: customer starts a chat conversation after login | @smoke @regression @customer | Sends a message from the widget chat tab and asserts the sent bubble appears |
| chat: search filters conversations in the widget | @smoke @regression @customer | Search narrows the ticket list; a no-match term shows "No tickets found"; clearing restores the list |
| chat: priority and status filters work in the widget | @regression @customer | Priority and status selects filter the conversation list correctly |

## Tickets Tests (`tests/tickets.spec.ts`)

### Public access

| Test | Tags | What it verifies |
| --- | --- | --- |
| tickets: customer can open my tickets page | @smoke @regression @customer | Public My Tickets page opens |

### Support portal (login required via `portalTest`)

| Test | Tags | What it verifies |
| --- | --- | --- |
| portal: my tickets page lists tickets and filters work | @smoke @regression @customer | `?robodesk_page=my-tickets` renders filters (priority, status, order) and the ticket table; status filter applies |
| portal: customer can open ticket details from my tickets | @regression @customer | Clicking a ticket link opens the frontend detail view (`/robodesk-support/?robodesk_page=my-tickets&tid=N`) |
| portal: customer can reply to ticket from details page | @regression @customer | Types into the reply editor (`iframe#comment_ifr`), submits via "Add Reply", and asserts the reply renders |
| portal: customer cannot view another user's ticket via direct link | @regression @customer | Direct `tid=` link to another user's ticket shows "You do not have permission to view this ticket." and no comment form |
| portal: non-existent ticket id falls back safely to list | @regression @customer | `tid=999999` renders the ticket list instead of crashing or leaking data |

## Create Ticket Tests (`tests/create-ticket.spec.ts`)

| Test | Tags | What it verifies |
| --- | --- | --- |
| tickets: create ticket form is available | @smoke @regression @customer | SKIPPED - live UI does not render the form on `/submit-ticket/` (documented TODO) |
| portal: create ticket form renders and submits a ticket | @regression @customer | `?robodesk_page=create-ticket` shows title, TinyMCE description editor, and priority select; submits a new ticket successfully |
| portal: create ticket blocks empty title without creating a ticket | @regression @customer | Empty title submit is blocked by native validation: no POST, no success message, form stays open |

## Credentials Vault Tests (`tests/credentials-vault.spec.ts`)

| Test | Tags | What it verifies |
| --- | --- | --- |
| portal: credentials vault shows and stores a credential | @smoke @regression @customer | `?robodesk_page=credentials-vault` lists credentials; adding a credential persists it to the table; deletion (confirm dialog) removes it |

## Profile Tests (`tests/profile.spec.ts`)

| Test | Tags | What it verifies |
| --- | --- | --- |
| portal: customer can update profile first name | @regression @customer | `?robodesk_page=profile` renders the form; updating the first name shows "Profile updated successfully!" and persists across reload; original value is restored afterward |

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
│   ├── ticketDetailsPage.ts  # ticket detail view + reply
│   ├── chatWidgetPage.ts     # widget open/login/chat/search/filter
│   ├── profilePage.ts        # wp-admin + portal profile forms
│   └── notificationsPage.ts
├── helpers/
│   └── robodeskHelpers.ts    # login, createTicket, reply, changeStatus, toast
├── fixtures/
│   └── roles.ts              # test + portalTest (storageState reuse)
└── data/
    └── fakeData.ts           # random ticket/reply/user data
```

## Notes & Known Constraints

- **Server-side rate limiting**: the widget email-check endpoint allows **10 checks per IP per hour** and blocks further checks with "Too many attempts. Please try again later." All local requests share one IP, so the whole suite shares the budget. The portal tests mitigate this by logging in once per worker and caching the session to `.state/customer-widget-storage.json`. If a cached session expires, delete that file and wait for the hourly limit to reset. The password login (`/wp-json/robodesk/v1/login`) is not rate limited.
- **TinyMCE editor**: the create-ticket description field is a hidden `textarea#ticket_content`; tests type into `iframe#ticket_content_ifr`. The customer reply editor on ticket details is `iframe#comment_ifr`.
- **Admin reply/status**: performed from the Robodesk dashboard ticket view (not the wp-admin post editor), using `#new-reply`, `#send-reply-btn`, and `#ticket-status-select`.
- **Vault delete**: deletion triggers a native `confirm()` dialog which the page object accepts.
- **Skipped test**: the `/submit-ticket/` form scenario stays skipped until the live UI renders the expected form.
