import { test, expect, portalTest, conversationTest } from "../src/fixtures/roles";
import { MyTicketsPage } from "../src/pages/myTicketsPage";
import { TicketDetailsPage } from "../src/pages/ticketDetailsPage";
import { CreateTicketPage } from "../src/pages/createTicketPage";
import { createReplyData } from "../src/data/fakeData";

test.describe("Robodesk tickets", () => {
  test("tickets: customer can open my tickets page @smoke @regression @customer", async ({
    page,
  }) => {
    const myTickets = new MyTicketsPage(page);
    await myTickets.openMyTickets();
    await expect(page.locator("body")).toContainText(/my tickets|\[tickets\]/i);
  });

  portalTest.describe("customer support portal after widget login", () => {
    portalTest(
      "portal: my tickets page lists tickets and filters work @smoke @regression @customer",
      async ({ page }) => {
        const myTickets = new MyTicketsPage(page);
        await myTickets.openMyTickets();
        await myTickets.expectFiltersVisible();
        await myTickets.expectTicketsVisible();
        await myTickets.filterByStatus("Open");
        await expect(page).toHaveURL(/robodesk_page=my-tickets/);
        await myTickets.expectTicketsVisible();
      },
    );

    portalTest(
      "portal: customer can open ticket details from my tickets @regression @customer",
      async ({ page }) => {
        const myTickets = new MyTicketsPage(page);
        await myTickets.openMyTickets();
        await myTickets.ticketLinks.first().click();
        const details = new TicketDetailsPage(page);
        await details.expectLoaded();
        await expect(page).toHaveURL(
          /robodesk-support\/\?robodesk_page=my-tickets&tid=\d+/,
        );
      },
    );

    portalTest(
      "portal: customer can reply to ticket from details page @regression @customer",
      async ({ page }) => {
        const reply = createReplyData();
        const myTickets = new MyTicketsPage(page);
        await myTickets.openMyTickets();
        await myTickets.ticketLinks.first().click();
        const details = new TicketDetailsPage(page);
        await details.expectLoaded();
        await expect(page).toHaveURL(
          /robodesk-support\/\?robodesk_page=my-tickets&tid=\d+/,
        );
        await details.reply(reply.content);
        await details.expectReplyVisible(reply.content);
      },
    );

    conversationTest(
      "portal: customer cannot view another user's ticket via direct link @regression @customer",
      async ({ customerPage, adminPage }) => {
        const title = `QA Other User ${Date.now()}`;
        const create = new CreateTicketPage(adminPage);
        await create.openCreateTicket();
        await create.createTicket({ title, description: "other user ticket" });

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
        const otherTicketId = await row.getAttribute("data-ticketid");
        expect(otherTicketId).toBeTruthy();

        await customerPage.goto(
          `/robodesk-support/?robodesk_page=my-tickets&tid=${otherTicketId}`,
        );
        await expect(customerPage.locator("body")).toContainText(
          /do not have permission to view this ticket/i,
          { timeout: 15000 },
        );
        await expect(customerPage.locator("#commentform")).toHaveCount(0);
      },
    );

    portalTest(
      "portal: non-existent ticket id falls back safely to list @regression @customer",
      async ({ page }) => {
        await page.goto(
          "/robodesk-support/?robodesk_page=my-tickets&tid=999999",
        );
        const myTickets = new MyTicketsPage(page);
        await expect(myTickets.statusFilter).toBeVisible();
        await expect(page.locator("#commentform")).toHaveCount(0);
        await expect(page.locator("body")).not.toContainText(
          /do not have permission to view this ticket/i,
        );
      },
    );
  });
});
