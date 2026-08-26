import { test, adminTest, expect } from "../src/fixtures/roles";
import type { Page } from "@playwright/test";

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

test.describe("Tickets tab filters @admin", () => {
  test.setTimeout(180_000);

  adminTest.beforeEach(async ({ page }) => {
    await page.goto(
      "/wp-admin/admin.php?page=robodesk-dashboard&tab=tickets&view=tickets",
    );
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);
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

      const initialRows = await page.locator("tr.table-row").count();
      expect(initialRows).toBeGreaterThan(0);

      await searchInput.fill("hi");
      await page.waitForTimeout(1500);

      const matchedRows = await page.locator("tr.table-row").count();
      expect(matchedRows).toBeGreaterThan(0);
      expect(matchedRows).toBeLessThanOrEqual(initialRows);

      const firstRowText = await page
        .locator("tr.table-row")
        .first()
        .innerText();
      expect(firstRowText.toLowerCase()).toContain("hi");

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

      await customerFilter.fill("admin");
      await customerFilter.press("Enter");
      await page.waitForTimeout(2000);

      const filteredRows = await page.locator("tr.table-row").count();
      expect(filteredRows).toBeGreaterThan(0);
      expect(filteredRows).toBeLessThanOrEqual(baselineRows);

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

      await agentFilter.fill("admin");
      await agentFilter.press("Enter");
      await page.waitForTimeout(2000);

      const filteredRows = await page.locator("tr.table-row").count();
      expect(filteredRows).toBeGreaterThan(0);
      expect(filteredRows).toBeLessThanOrEqual(initialRows);

      const rowsText = await page.locator("tr.table-row").allInnerTexts();
      expect(rowsText.length).toBeGreaterThan(0);

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

      await statusFilter.selectOption({ label: "Open" });
      await page.waitForTimeout(2000);

      const openRows = await page.locator("tr.table-row").count();
      expect(openRows).toBeGreaterThan(0);
      expect(openRows).toBeLessThanOrEqual(initialRows);
      await expect(statusFilter).toHaveValue("open");

      await statusFilter.selectOption({ label: "Closed" });
      await page.waitForTimeout(2000);
      await expect(statusFilter).toHaveValue("closed");

      const closedRows = await page.locator("tr.table-row").count();
      expect(closedRows).toBeGreaterThanOrEqual(0);

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

      await priorityFilter.selectOption({ label: "Priority (High)" });
      await page.waitForTimeout(2000);

      const highRows = await page.locator("tr.table-row").count();
      expect(highRows).toBeGreaterThanOrEqual(0);
      expect(highRows).toBeLessThanOrEqual(initialRows);

      await expect(priorityFilter).toHaveValue("High");

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

      let rows = await page.locator("tr.table-row").count();
      const initialCount = rows;

      await perPageSelect.selectOption({ label: "20 per page" });
      await page.waitForTimeout(2000);

      rows = await page.locator("tr.table-row").count();
      expect(rows).toBeGreaterThanOrEqual(initialCount);
      expect(rows).toBeLessThanOrEqual(20);

      await perPageSelect.selectOption({ label: "50 per page" });
      await page.waitForTimeout(2000);

      rows = await page.locator("tr.table-row").count();
      expect(rows).toBeGreaterThanOrEqual(initialCount);
      expect(rows).toBeLessThanOrEqual(50);

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

      const searchInput = page.locator(
        'input[name="search"][placeholder="Search tickets..."]',
      );
      const customerFilter = page.locator("#robodesk-customer-filter-input");
      const statusFilter = page.locator('select[name="status"]');

      await searchInput.fill("test");
      await page.waitForTimeout(1000);
      await customerFilter.fill("shakyanikhil");
      await customerFilter.press("Enter");
      await page.waitForTimeout(1500);
      await statusFilter.selectOption({ label: "Open" });
      await page.waitForTimeout(1500);

      const filteredRows = await page.locator("tr.table-row").count();
      expect(filteredRows).toBeLessThanOrEqual(initialRows);

      await resetTicketFilters(page);
      await page.waitForTimeout(2000);

      const clearedRows = await page.locator("tr.table-row").count();
      expect(clearedRows).toBe(initialRows);

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

      await statusFilter.selectOption({ label: "Open" });
      await page.waitForTimeout(1500);
      await priorityFilter.selectOption({ label: "Priority (High)" });
      await page.waitForTimeout(1500);

      const filteredRows = await page.locator("tr.table-row").count();
      expect(filteredRows).toBeGreaterThanOrEqual(0);
      expect(filteredRows).toBeLessThanOrEqual(initialRows);

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

      const nextButton = page
        .getByRole("button", { name: /next|›/i })
        .first();
      const hasPagination = (await nextButton.count()) > 0;

      if (hasPagination) {
        const page1Rows = await page.locator("tr.table-row").allInnerTexts();
        expect(page1Rows.length).toBeGreaterThan(0);

        await nextButton.click();
        await page.waitForTimeout(2000);

        const page2Rows = await page.locator("tr.table-row").allInnerTexts();
        expect(page2Rows.length).toBeGreaterThan(0);

        const page1FirstId = page1Rows[0].match(/#(\d+)/)?.[1];
        const page2FirstId = page2Rows[0].match(/#(\d+)/)?.[1];
        expect(page1FirstId).not.toBe(page2FirstId);

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
      const statusFilter = page.locator('select[name="status"]');
      await statusFilter.selectOption({ label: "Open" });
      await page.waitForTimeout(2000);

      const openRows = await page.locator("tr.table-row").count();
      expect(openRows).toBeGreaterThan(0);

      const checkbox = page.locator("tr.table-row .ticket-checkbox").first();
      await expect(checkbox).toBeVisible();
      await checkbox.check();

      const bulkActionSelect = page.locator("#bulk-action-select");
      await expect(bulkActionSelect).toBeVisible();
      await bulkActionSelect.selectOption({
        label: "Set Status: In Progress",
      });

      await page.locator("#apply-bulk-action").click();
      await page.getByRole("button", { name: "Yes" }).click();
      await page.waitForTimeout(3000);

      await expect(page.locator("body")).toContainText(/updated|changed/i, {
        timeout: 15000,
      });

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
