import { portalTest, conversationTest, expect } from "../src/fixtures/roles";
import { NotificationsPage } from "../src/pages/notificationsPage";
import { CreateTicketPage } from "../src/pages/createTicketPage";
import { replyToTicket } from "../src/helpers/robodeskHelpers";

portalTest.describe("Robodesk notifications", () => {
  portalTest(
    "notifications: portal page renders notification area @regression @customer",
    async ({ page }) => {
      const notifications = new NotificationsPage(page);
      await notifications.openNotifications();
      await notifications.expectLoaded();
    },
  );

  conversationTest(
    "notifications: admin reply generates an unread notification and mark all read clears it @regression @admin @customer",
    async ({ customerPage, adminPage }) => {
      conversationTest.setTimeout(180_000);
      const title = `QA Notify ${Date.now()}`;
      const adminReply = `Notify reply ${Date.now()}`;

      const create = new CreateTicketPage(customerPage);
      await create.openCreateTicket();
      await create.expectFormVisible();
      await create.createTicket({ title, description: "notification test" });
      await create.expectTicketCreated();

      await adminPage.goto(
        "/wp-admin/admin.php?page=robodesk-dashboard&tab=dashboard",
      );
      await adminPage
        .getByRole("button", { name: /active conversations/i })
        .first()
        .click();
      const row = adminPage
        .locator("tr[data-ticketid]")
        .filter({ hasText: title.slice(0, 20) })
        .first();
      await expect(row).toBeVisible({ timeout: 30000 });
      await row.click();
      await expect(adminPage).toHaveURL(/ticket=\d+/);
      await replyToTicket(adminPage, adminReply);
      await expect(adminPage.locator("body")).toContainText(adminReply, {
        timeout: 15000,
      });

      const notifications = new NotificationsPage(customerPage);
      await notifications.openNotifications();
      await expect(notifications.markAllReadButton).toBeVisible({
        timeout: 15000,
      });
      await expect(
        customerPage.locator("li.robodesk-notification-item.is-unread").first(),
      ).toBeVisible({ timeout: 15000 });

      await notifications.clickMarkAllRead();

      await expect(
        customerPage.locator("li.robodesk-notification-item.is-unread"),
      ).toHaveCount(0, { timeout: 20000 });
    },
  );
});
