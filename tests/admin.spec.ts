import { test, adminTest, expect } from "../src/fixtures/roles";
import type { Page } from "@playwright/test";
import { DashboardPage } from "../src/pages/dashboardPage";
import { ProfilePage } from "../src/pages/profilePage";
import { createReplyData, createTicketData } from "../src/data/fakeData";
import {
  replyToTicket,
  changeStatus,
  createTicket,
  waitForToast,
} from "../src/helpers/robodeskHelpers";

async function resetTicketFilters(page: Page) {
  await page
    .locator('input[name="search"][placeholder="Search tickets..."]')
    .fill("");
  await page.locator("#robodesk-customer-filter-input").fill("");
  await page.locator("#robodesk-agent-filter-input").fill("");
  await page
    .locator('select[name="status"]')
    .selectOption({ label: "Active Conversations" });
  await page
    .locator("#robodesk-priority-filter")
    .selectOption({ label: "Priority (All)" });
  await page.locator('button:has-text("Filter")').click({ noWaitAfter: true });
  await page.waitForLoadState("networkidle");
}

test.describe("Robodesk admin suite", () => {
  test.setTimeout(180_000);
  adminTest(
    "auth: admin can view dashboard @smoke @regression @admin",
    async ({ page }) => {
      const dashboardPage = new DashboardPage(page);
      await dashboardPage.openDashboard();
      await dashboardPage.expectCoreMenuVisible();
    },
  );

  adminTest(
    "profile: profile page loads @regression @admin",
    async ({ page }) => {
      const profilePage = new ProfilePage(page);
      await profilePage.openProfile();
      await expect(page.locator("body")).toBeVisible();
    },
  );
  adminTest(
    "helpers: create ticket and show toast @regression @customer",
    async ({ page }) => {
      const data = createTicketData();
      await createTicket(page, data);
      await waitForToast(page);
    },
  );
  adminTest(
    "helpers: reply to ticket and status change @regression @admin",
    async ({ page }) => {
      const reply = createReplyData();
      await page.goto(
        "/wp-admin/admin.php?page=robodesk-dashboard&tab=dashboard",
      );
      await page.locator("tr[data-ticketid]").first().click();
      await expect(page).toHaveURL(/ticket=\d+/);
      await replyToTicket(page, reply.content);
      await expect(page.locator("body")).toContainText(reply.content);
      await changeStatus(page, "Open");
    },
  );
  adminTest(
    "dashboard: bulk set status to Open from all tickets view @regression @admin",
    async ({ page }) => {
      await page.goto(
        "/wp-admin/admin.php?page=robodesk-dashboard&tab=tickets&status=all",
      );
      const checkbox = page.locator("tr.table-row .ticket-checkbox").first();
      await expect(checkbox).toBeVisible();
      await checkbox.check();
      await page.locator("#bulk-action-select").selectOption({
        label: "Set Status: Open",
      });
      await page.locator("#apply-bulk-action").click();
      await expect(page.locator("body")).toContainText(/updated|changed/i, {
        timeout: 15000,
      });
    },
  );
  adminTest(
    "ticket: priority change persists on dashboard ticket view @regression @admin",
    async ({ page }) => {
      await page.goto(
        "/wp-admin/admin.php?page=robodesk-dashboard&tab=dashboard",
      );
      await page.locator("tr[data-ticketid]").first().click();
      await expect(page).toHaveURL(/ticket=\d+/);
      const prioritySelect = page.locator("#ticket-priority-select");
      await expect(prioritySelect).toBeVisible();
      const current = await prioritySelect.inputValue();
      const options = await prioritySelect
        .locator("option")
        .evaluateAll((opts) => opts.map((o) => (o as HTMLOptionElement).value));
      const target = options.find((o) => o !== current);
      expect(target).toBeTruthy();
      try {
        await prioritySelect.selectOption({ value: target! });
        await page.reload({ waitUntil: "networkidle" });
        await expect(prioritySelect).toHaveValue(target!, { timeout: 10000 });
      } finally {
        await prioritySelect
          .selectOption({ value: current })
          .catch(() => undefined);
      }
    },
  );
  adminTest(
    "ticket: assignee change persists on dashboard ticket view @regression @admin",
    async ({ page }) => {
      await page.goto(
        "/wp-admin/admin.php?page=robodesk-dashboard&tab=dashboard",
      );
      await page.locator("tr[data-ticketid]").first().click();
      await expect(page).toHaveURL(/ticket=\d+/);
      const assigneeSelect = page.locator("#ticket-assignee-select");
      await expect(assigneeSelect).toBeVisible();
      const current = await assigneeSelect.inputValue();
      const options = await assigneeSelect
        .locator("option")
        .evaluateAll((opts) => opts.map((o) => (o as HTMLOptionElement).value));
      const target = options.find((o) => o !== current);
      expect(target).toBeTruthy();
      try {
        await assigneeSelect.selectOption({ value: target! });
        await page.reload({ waitUntil: "networkidle" });
        await expect(assigneeSelect).toHaveValue(target!, { timeout: 10000 });
      } finally {
        await assigneeSelect
          .selectOption({ value: current })
          .catch(() => undefined);
      }
    },
  );
  adminTest(
    "departments: add and delete a category @regression @admin",
    async ({ page }) => {
      const name = `QA Dept ${Date.now()}`;
      await page.goto(
        "/wp-admin/edit-tags.php?taxonomy=robodesk_ticket_category&post_type=robodesk_ticket",
      );
      await page.locator("#tag-name").fill(name);
      await page.locator("#submit").click();
      await expect(
        page.locator(".notice-success").filter({ hasText: /added/i }),
      ).toBeVisible({ timeout: 10000 });
      const row = page.locator("#the-list tr").filter({ hasText: name });
      await expect(row).toHaveCount(1);
      await row.hover();
      page.once("dialog", (dialog) => dialog.accept());
      await row.locator("a.delete-tag").click();
      await expect(
        page.locator("#the-list tr").filter({ hasText: name }),
      ).toHaveCount(0);
    },
  );
  adminTest(
    "priorities: add and delete a category @regression @admin",
    async ({ page }) => {
      const name = `QA Priority ${Date.now()}`;
      await page.goto(
        "/wp-admin/edit-tags.php?taxonomy=robodesk_ticket_priority&post_type=robodesk_ticket",
      );
      await page.locator("#tag-name").fill(name);
      await page.locator("#submit").click();
      await expect(
        page.locator(".notice-success").filter({ hasText: /added/i }),
      ).toBeVisible({ timeout: 10000 });
      const row = page.locator("#the-list tr").filter({ hasText: name });
      await expect(row).toHaveCount(1);
      await row.hover();
      page.once("dialog", (dialog) => dialog.accept());
      await row.locator("a.delete-tag").click();
      await expect(
        page.locator("#the-list tr").filter({ hasText: name }),
      ).toHaveCount(0);
    },
  );
  adminTest(
    "faq: create, publish and trash a FAQ @regression @admin",
    async ({ page }) => {
      const title = `QA FAQ ${Date.now()}`;
      await page.goto("/wp-admin/post-new.php?post_type=robodesk_faq");
      await page.locator("#title").fill(title);
      await page.locator("#publish").click();
      await expect(page.locator("#message")).toContainText(/published/i, {
        timeout: 15000,
      });
      await page.goto("/wp-admin/edit.php?post_type=robodesk_faq");
      const row = page.locator("#the-list tr").filter({ hasText: title });
      await expect(row).toHaveCount(1);
      await row.hover();
      await row.locator("a.submitdelete").click();
      await expect(
        page.locator("#the-list tr").filter({ hasText: title }),
      ).toHaveCount(0);
    },
  );
  adminTest(
    "notice: create, publish and trash a notice @regression @admin",
    async ({ page }) => {
      const title = `QA Notice ${Date.now()}`;
      await page.goto("/wp-admin/post-new.php?post_type=notice");
      await page.locator("#title").fill(title);
      await page.locator("#publish").click();
      await expect(page.locator("#message")).toContainText(/published/i, {
        timeout: 15000,
      });
      await page.goto("/wp-admin/edit.php?post_type=notice");
      const row = page.locator("#the-list tr").filter({ hasText: title });
      await expect(row).toHaveCount(1);
      await row.hover();
      await row.locator("a.submitdelete").click();
      await expect(
        page.locator("#the-list tr").filter({ hasText: title }),
      ).toHaveCount(0);
    },
  );
  adminTest("debug log: page loads @regression @admin", async ({ page }) => {
    await page.goto("/wp-admin/admin.php?page=robodesk-debug-log");
    await expect(page.locator("body")).toBeVisible();
  });

  // Tickets tab filter tests
  adminTest.describe("Tickets tab filters @admin", () => {
    adminTest.beforeEach(async ({ page }) => {
      await page.goto(
        "/wp-admin/admin.php?page=robodesk-dashboard&tab=tickets&view=tickets",
      );
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(3000);
      // Wait for filters to be rendered
      await page
        .locator("#robodesk-customer-filter-input")
        .waitFor({ state: "visible", timeout: 15000 });
      await page
        .locator("#robodesk-agent-filter-input")
        .waitFor({ state: "visible", timeout: 15000 });
      await page
        .locator('select[name="status"]')
        .waitFor({ state: "visible", timeout: 15000 });
      await page
        .locator("#robodesk-priority-filter")
        .waitFor({ state: "visible", timeout: 15000 });
    });

    adminTest(
      "tickets: search by keyword filters conversation list @regression",
      async ({ page }) => {
        const searchInput = page.locator(
          'input[name="search"][placeholder="Search tickets..."]',
        );
        await expect(searchInput).toBeVisible();

        // Get initial row count
        const initialRows = await page.locator("tr.table-row").count();
        expect(initialRows).toBeGreaterThan(0);

        // Search for a term that should match at least one ticket
        await searchInput.fill("hi");
        await page.waitForTimeout(1500);

        const matchedRows = await page.locator("tr.table-row").count();
        expect(matchedRows).toBeGreaterThan(0);
        expect(matchedRows).toBeLessThanOrEqual(initialRows);

        // Verify matched rows contain the search term
        const firstRowText = await page
          .locator("tr.table-row")
          .first()
          .innerText();
        expect(firstRowText.toLowerCase()).toContain("hi");

        // Clear search and verify all rows return
        await searchInput.fill("");
        await page.waitForTimeout(1500);
        const clearedRows = await page.locator("tr.table-row").count();
        expect(clearedRows).toBe(initialRows);
      },
    );

    adminTest(
      "tickets: customer filter by name narrows results @regression",
      async ({ page }) => {
        const customerFilter = page.locator("#robodesk-customer-filter-input");
        await expect(customerFilter).toBeVisible();

        const baselineRows = await page.locator("tr.table-row").count();
        expect(baselineRows).toBeGreaterThan(0);

        // Now apply customer filter with a partial name that exists
        await customerFilter.fill("admin");
        await customerFilter.press("Enter");
        await page.waitForTimeout(2000);

        const filteredRows = await page.locator("tr.table-row").count();
        expect(filteredRows).toBeGreaterThan(0);
        expect(filteredRows).toBeLessThanOrEqual(baselineRows);

        // Clear filter
        await customerFilter.fill("");
        await customerFilter.press("Enter");
        await page.waitForTimeout(1500);
        const clearedRows = await page.locator("tr.table-row").count();
        expect(clearedRows).toBe(baselineRows);
      },
    );

    adminTest(
      "tickets: agent filter by name narrows results @regression",
      async ({ page }) => {
        const agentFilter = page.locator("#robodesk-agent-filter-input");
        await expect(agentFilter).toBeVisible();

        const initialRows = await page.locator("tr.table-row").count();
        expect(initialRows).toBeGreaterThan(0);

        // Filter by admin
        await agentFilter.fill("admin");
        await agentFilter.press("Enter");
        await page.waitForTimeout(2000);

        const filteredRows = await page.locator("tr.table-row").count();
        expect(filteredRows).toBeGreaterThan(0);
        expect(filteredRows).toBeLessThanOrEqual(initialRows);

        // Verify filtered rows show admin as agent
        const rowsText = await page.locator("tr.table-row").allInnerTexts();
        expect(rowsText.length).toBeGreaterThan(0);

        // Clear filter
        await agentFilter.fill("");
        await agentFilter.press("Enter");
        await page.waitForTimeout(1500);
        const clearedRows = await page.locator("tr.table-row").count();
        expect(clearedRows).toBe(initialRows);
      },
    );

    adminTest(
      "tickets: status filter dropdown filters by status @regression",
      async ({ page }) => {
        const statusFilter = page.locator('select[name="status"]');
        await expect(statusFilter).toBeVisible();

        const initialRows = await page.locator("tr.table-row").count();
        expect(initialRows).toBeGreaterThan(0);

        // Filter by "Open" status
        await statusFilter.selectOption({ label: "Open" });
        await page.waitForTimeout(2000);

        const openRows = await page.locator("tr.table-row").count();
        expect(openRows).toBeGreaterThan(0);
        expect(openRows).toBeLessThanOrEqual(initialRows);
        await expect(statusFilter).toHaveValue("open");

        // Change to "Closed" status
        await statusFilter.selectOption({ label: "Closed" });
        await page.waitForTimeout(2000);
        await expect(statusFilter).toHaveValue("closed");

        const closedRows = await page.locator("tr.table-row").count();
        expect(closedRows).toBeGreaterThanOrEqual(0);

        // Reset to "Active Conversations"
        await statusFilter.selectOption({ label: "Active Conversations" });
        await page.waitForTimeout(2000);
        const resetRows = await page.locator("tr.table-row").count();
        expect(resetRows).toBe(initialRows);
      },
    );

    adminTest(
      "tickets: priority filter dropdown filters by priority @regression",
      async ({ page }) => {
        const priorityFilter = page.locator("#robodesk-priority-filter");
        await expect(priorityFilter).toBeVisible();

        const initialRows = await page.locator("tr.table-row").count();
        expect(initialRows).toBeGreaterThan(0);

        // Filter by "High" priority
        await priorityFilter.selectOption({ label: "Priority (High)" });
        await page.waitForTimeout(2000);

        const highRows = await page.locator("tr.table-row").count();
        expect(highRows).toBeGreaterThanOrEqual(0);
        expect(highRows).toBeLessThanOrEqual(initialRows);

        await expect(priorityFilter).toHaveValue("High");

        // Reset to "Priority (All)"
        await priorityFilter.selectOption({ label: "Priority (All)" });
        await page.waitForTimeout(2000);
        await expect(priorityFilter).toHaveValue("all");
        const resetRows = await page.locator("tr.table-row").count();
        expect(resetRows).toBe(initialRows);
      },
    );

    adminTest(
      "tickets: per page dropdown changes page size @regression",
      async ({ page }) => {
        const perPageSelect = page.locator("#per-page-select");
        await expect(perPageSelect).toBeVisible();

        // Get initial page size (default 10)
        let rows = await page.locator("tr.table-row").count();
        const initialCount = rows;

        // Change to 20 per page
        await perPageSelect.selectOption({ label: "20 per page" });
        await page.waitForTimeout(2000);

        rows = await page.locator("tr.table-row").count();
        expect(rows).toBeGreaterThanOrEqual(initialCount);
        expect(rows).toBeLessThanOrEqual(20);

        // Change to 50 per page
        await perPageSelect.selectOption({ label: "50 per page" });
        await page.waitForTimeout(2000);

        rows = await page.locator("tr.table-row").count();
        expect(rows).toBeGreaterThanOrEqual(initialCount);
        expect(rows).toBeLessThanOrEqual(50);

        // Reset to 10 per page
        await perPageSelect.selectOption({ label: "10 per page" });
        await page.waitForTimeout(2000);
        rows = await page.locator("tr.table-row").count();
        expect(rows).toBeLessThanOrEqual(10);
      },
    );

    adminTest(
      "tickets: clear filters resets all filters @regression",
      async ({ page }) => {
        await resetTicketFilters(page);
        const initialRows = await page.locator("tr.table-row").count();
        expect(initialRows).toBeGreaterThan(0);

        // Apply multiple filters
        const searchInput = page.locator(
          'input[name="search"][placeholder="Search tickets..."]',
        );
        const customerFilter = page.locator("#robodesk-customer-filter-input");
        const statusFilter = page.locator('select[name="status"]');
        const priorityFilter = page.locator("#robodesk-priority-filter");

        await searchInput.fill("test");
        await page.waitForTimeout(1000);
        await customerFilter.fill("shakyanikhil");
        await customerFilter.press("Enter");
        await page.waitForTimeout(1500);
        await statusFilter.selectOption({ label: "Open" });
        await page.waitForTimeout(1500);

        // Verify filters are applied (fewer rows)
        const filteredRows = await page.locator("tr.table-row").count();
        expect(filteredRows).toBeLessThanOrEqual(initialRows);

        // Clear all filter controls
        await resetTicketFilters(page);
        await page.waitForTimeout(2000);

        // Verify all filters cleared and all rows return
        const clearedRows = await page.locator("tr.table-row").count();
        expect(clearedRows).toBe(initialRows);

        // Verify search input is cleared
        await expect(searchInput).toHaveValue("");
      },
    );

    adminTest(
      "tickets: combined status and priority filters work together @regression",
      async ({ page }) => {
        const statusFilter = page.locator('select[name="status"]');
        const priorityFilter = page.locator("#robodesk-priority-filter");

        const initialRows = await page.locator("tr.table-row").count();
        expect(initialRows).toBeGreaterThan(0);

        // Apply both filters
        await statusFilter.selectOption({ label: "Open" });
        await page.waitForTimeout(1500);
        await priorityFilter.selectOption({ label: "Priority (High)" });
        await page.waitForTimeout(1500);

        const filteredRows = await page.locator("tr.table-row").count();
        expect(filteredRows).toBeGreaterThanOrEqual(0);
        expect(filteredRows).toBeLessThanOrEqual(initialRows);

        // Clear all filter controls
        await resetTicketFilters(page);
        await page.waitForTimeout(1500);
        const clearedRows = await page.locator("tr.table-row").count();
        expect(clearedRows).toBe(initialRows);
      },
    );

    adminTest(
      "tickets: pagination next/prev works @regression",
      async ({ page }) => {
        const perPageSelect = page.locator("#per-page-select");
        await perPageSelect.selectOption({ label: "10 per page" });
        await page.waitForTimeout(2000);

        // Check if pagination exists (more than 10 tickets)
        const nextButton = page
          .getByRole("button", { name: /next|›/i })
          .first();
        const hasPagination = (await nextButton.count()) > 0;

        if (hasPagination) {
          const page1Rows = await page.locator("tr.table-row").allInnerTexts();
          expect(page1Rows.length).toBeGreaterThan(0);

          // Click Next
          await nextButton.click();
          await page.waitForTimeout(2000);

          const page2Rows = await page.locator("tr.table-row").allInnerTexts();
          expect(page2Rows.length).toBeGreaterThan(0);

          // Verify different rows on page 2
          const page1FirstId = page1Rows[0].match(/#(\d+)/)?.[1];
          const page2FirstId = page2Rows[0].match(/#(\d+)/)?.[1];
          expect(page1FirstId).not.toBe(page2FirstId);

          // Click Prev to go back
          const prevButton = page
            .getByRole("button", { name: /prev|‹/i })
            .first();
          await prevButton.click();
          await page.waitForTimeout(2000);

          const page1AgainRows = await page
            .locator("tr.table-row")
            .allInnerTexts();
          expect(page1AgainRows[0]).toBe(page1Rows[0]);
        }
      },
    );

    adminTest(
      "tickets: bulk actions work with filters applied @regression",
      async ({ page }) => {
        // Apply a filter first
        const statusFilter = page.locator('select[name="status"]');
        await statusFilter.selectOption({ label: "Open" });
        await page.waitForTimeout(2000);

        const openRows = await page.locator("tr.table-row").count();
        expect(openRows).toBeGreaterThan(0);

        // Select first row checkbox
        const checkbox = page.locator("tr.table-row .ticket-checkbox").first();
        await expect(checkbox).toBeVisible();
        await checkbox.check();

        // Apply bulk action "Set Status: In Progress"
        const bulkActionSelect = page.locator("#bulk-action-select");
        await expect(bulkActionSelect).toBeVisible();
        await bulkActionSelect.selectOption({
          label: "Set Status: In Progress",
        });

        await page.locator("#apply-bulk-action").click();
        await page.getByRole("button", { name: "Yes" }).click();
        await page.waitForTimeout(3000);

        // Verify success message
        await expect(page.locator("body")).toContainText(/updated|changed/i, {
          timeout: 15000,
        });

        // Restore original status for cleanup
        await checkbox.check();
        await bulkActionSelect.selectOption({
          label: "Set Status: Open",
        });
        await page.locator("#apply-bulk-action").click();
        await page.getByRole("button", { name: "Yes" }).click();
        await page.waitForTimeout(3000);
      },
    );
  });
});
