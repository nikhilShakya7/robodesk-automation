import { conversationTest, expect } from "../src/fixtures/roles";
import { ChatWidgetPage } from "../src/pages/chatWidgetPage";
import { CreateTicketPage } from "../src/pages/createTicketPage";
import { replyToTicket } from "../src/helpers/robodeskHelpers";

conversationTest.describe("Robodesk two-way conversation", () => {
  conversationTest.setTimeout(180_000);

  conversationTest(
    "conversation: customer (widget) and admin (backend) exchange replies on one ticket @regression @admin @customer",
    async ({ customerPage, adminPage }) => {
      const title = `QA 2Way ${Date.now()}`;
      const description = "Two-way conversation test description";
      const adminReply = `Admin reply ${Date.now()}`;
      const customerReply = `Customer reply ${Date.now()}`;

      // Customer: create a ticket from the portal
      const create = new CreateTicketPage(customerPage);
      await create.openCreateTicket();
      await create.expectFormVisible();
      await create.createTicket({ title, description });
      await create.expectTicketCreated();

      // Admin: find the ticket in the dashboard and open it in the backend
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

      // Admin: reply from the WordPress backend
      await replyToTicket(adminPage, adminReply);
      await expect(adminPage.locator("body")).toContainText(adminReply, {
        timeout: 15000,
      });

      // Customer: open the same ticket in the chat widget and see the admin reply
      const chatWidget = new ChatWidgetPage(customerPage);
      await chatWidget.openHome();
      await chatWidget.openWidget();
      await chatWidget.openConversationsTab();
      await chatWidget.searchTickets(title);
      await chatWidget.openFirstTicket();
      await expect(customerPage.locator(".robodesk-popup.open")).toContainText(
        adminReply,
        { timeout: 15000 },
      );

      // Customer: reply back from the chat widget
      await chatWidget.singleTicketMessageInput.fill(customerReply);
      await chatWidget.singleTicketSendButton.click();
      await expect(chatWidget.sentMessage(customerReply)).toBeVisible({
        timeout: 15000,
      });

      // Admin: sees the customer's reply in the backend
      await adminPage.reload({ waitUntil: "networkidle" });
      await expect(adminPage.locator("body")).toContainText(customerReply, {
        timeout: 15000,
      });
    },
  );
});