import { test, adminTest, expect } from "../src/fixtures/roles";
import { DashboardPage } from "../src/pages/dashboardPage";
import { ProfilePage } from "../src/pages/profilePage";
import { createReplyData, createTicketData } from "../src/data/fakeData";
import {
  replyToTicket,
  changeStatus,
  createTicket,
  waitForToast,
} from "../src/helpers/robodeskHelpers";

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

});
