import { test, expect, portalTest } from "../src/fixtures/roles";
import { CustomerPortalPage } from "../src/pages/customerPortalPage";
import { MyTicketsPage } from "../src/pages/myTicketsPage";
import { CreateTicketPage } from "../src/pages/createTicketPage";
import { CredentialsVaultPage } from "../src/pages/credentialsVaultPage";
import { TicketDetailsPage } from "../src/pages/ticketDetailsPage";
import { ChatWidgetPage } from "../src/pages/chatWidgetPage";
import { createTicketData } from "../src/data/fakeData";
import { config } from "../src/config/env";
import {
  login,
  createTicket,
  waitForToast,
} from "../src/helpers/robodeskHelpers";

test.describe("Robodesk customer suite", () => {
  test("portal: guest sees login prompt @smoke @regression @customer", async ({
    page,
  }) => {
    const portal = new CustomerPortalPage(page);
    await portal.openPortal();
    await portal.expectGuestPrompt();
  });

  test("tickets: customer can open my tickets page @smoke @regression @customer", async ({
    page,
  }) => {
    const myTickets = new MyTicketsPage(page);
    await myTickets.openMyTickets();
    await expect(page.locator("body")).toContainText(/my tickets|\[tickets\]/i);
  });

  test("tickets: create ticket form is available @smoke @regression @customer", async ({
    page,
  }) => {
    test.skip(
      true,
      "TODO: The live UI does not render the ticket form on /submit-ticket/ despite plugin documentation.",
    );
    const createTicketPage = new CreateTicketPage(page);
    await createTicketPage.openCreateTicket();
    await createTicketPage.expectFormVisible();
  });

  test("chat: home page renders chat widget container @regression @chat", async ({
    page,
  }) => {
    const chatWidget = new ChatWidgetPage(page);
    await chatWidget.openHome();
    await chatWidget.expectWidgetPresent();
  });

  //   test("customer: can open the frontend submit-ticket entrypoint @regression @customer", async ({
  //     page,
  //   }) => {
  //     await login(page, "customer", "customer");
  //     const createTicketPage = new CreateTicketPage(page);
  //     await createTicketPage.openCreateTicket();
  //     await expect(page.locator("body")).toContainText(/ticket|submit/i);
  //   });

  test("customer: can use the frontend chat widget @regression @customer", async ({
    page,
  }) => {
    const chatWidget = new ChatWidgetPage(page);
    await chatWidget.openHome();
    await chatWidget.openWidget();
    await expect(page.locator("body")).toBeVisible();
  });

  // test("customer: can create a ticket from the support-page create-ticket route @regression @customer", async ({
  //   page,
  // }) => {
  //   const data = createTicketData();
  //   await login(page, "customer", "customer");
  //   await page.goto("/robodesk-support/?robodesk_page=create-ticket");

  //   const titleField = page.locator("#ticket_title");
  //   const descriptionField = page.locator("#ticket_content");

  //   if (await titleField.count()) {
  //     await expect(titleField).toBeVisible();
  //     await titleField.fill(data.title);
  //     await descriptionField.fill(data.description);

  //     const originSelect = page.locator('select[name="ticket_origin"]');
  //     const prioritySelect = page.locator('select[name="ticket_priority"]');

  //     if (await originSelect.count()) {
  //       await originSelect.selectOption({ label: data.origin });
  //     }
  //     if (await prioritySelect.count()) {
  //       await prioritySelect.selectOption({ label: data.priority });
  //     }

  //     await page
  //       .getByRole("button", { name: /submit ticket/i })
  //       .click()
  //       .catch(() => page.locator('input[type="submit"]').click());

  //     await expect(page.locator("body")).toContainText(
  //       /ticket|submitted|success|thanks|created/i,
  //     );
  //   } else {
  //     await expect(page.locator("body")).toContainText(
  //       /create|ticket|support/i,
  //     );
  //   }
  // });

  test("helpers: create ticket and show toast @regression @customer", async ({
    page,
  }) => {
    const data = createTicketData();
    await login(page, config.adminUsername, config.adminPassword);
    await createTicket(page, data);
    await waitForToast(page);
  });

  test.describe("customer login via chat widget", () => {
    test("auth: customer logs in via chat widget and creates a ticket @smoke @regression @customer", async ({
      page,
    }) => {
      const chatWidget = new ChatWidgetPage(page);
      const data = createTicketData();
      await chatWidget.openHome();
      await chatWidget.loginCustomerWithPassword(
        config.customerEmail,
        config.customerPassword,
      );
      await createTicket(page, data);
      await waitForToast(page);
    });

    test("chat: customer starts a chat conversation after login @smoke @regression @customer", async ({
      page,
    }) => {
      const chatWidget = new ChatWidgetPage(page);
      const message = `QA chat message ${Date.now()}`;
      await chatWidget.openHome();
      await chatWidget.loginCustomerWithPassword(
        config.customerEmail,
        config.customerPassword,
      );
      await chatWidget.startChat(message);
      await expect(chatWidget.sentMessage(message)).toBeVisible();
    });

    test("chat: search filters conversations in the widget @smoke @regression @customer", async ({
      page,
    }) => {
      const chatWidget = new ChatWidgetPage(page);
      await chatWidget.openHome();
      await chatWidget.loginCustomerWithPassword(
        config.customerEmail,
        config.customerPassword,
      );
      await expect(chatWidget.ticketRows.first()).toBeVisible({
        timeout: 15000,
      });
      const total = await chatWidget.ticketRows.count();
      expect(total).toBeGreaterThan(0);
      await chatWidget.searchTickets("admin");
      await expect
        .poll(async () => chatWidget.ticketRows.count(), { timeout: 10000 })
        .toBeGreaterThan(0);
      const matched = await chatWidget.ticketRows.count();
      expect(matched).toBeGreaterThan(0);
      expect(matched).toBeLessThan(total);
      await chatWidget.searchTickets("zzzz-no-match-zzzz");
      await expect(chatWidget.noTicketsMessage).toBeVisible({
        timeout: 10000,
      });
      await chatWidget.searchTickets("");
      await expect
        .poll(async () => chatWidget.ticketRows.count(), { timeout: 10000 })
        .toBeGreaterThan(0);
    });

    test("chat: priority and status filters work in the widget @regression @customer", async ({
      page,
    }) => {
      const chatWidget = new ChatWidgetPage(page);
      await chatWidget.openHome();
      await chatWidget.loginCustomerWithPassword(
        config.customerEmail,
        config.customerPassword,
      );
      await expect(chatWidget.ticketRows.first()).toBeVisible({
        timeout: 15000,
      });
      const total = await chatWidget.ticketRows.count();
      expect(total).toBeGreaterThan(0);
      await chatWidget.filterByPriority("high");
      await expect
        .poll(
          async () =>
            chatWidget.ticketRows.filter({ hasNotText: "High" }).count(),
          { timeout: 10000 },
        )
        .toBe(0);
      await expect
        .poll(async () => chatWidget.ticketRows.count(), { timeout: 10000 })
        .toBeGreaterThan(0);
      await chatWidget.filterByPriority("all");
      await chatWidget.filterByStatus("open");
      await expect
        .poll(async () => chatWidget.ticketRows.count(), { timeout: 10000 })
        .toBeGreaterThan(0);
      const filtered = await chatWidget.ticketRows.count();
      expect(filtered).toBeLessThanOrEqual(total);
    });

    test("auth: widget login blocked for invalid email format @regression @customer", async ({
      page,
    }) => {
      const chatWidget = new ChatWidgetPage(page);
      await chatWidget.openHome();
      await chatWidget.openWidget();
      await chatWidget.openConversationsTab();
      await chatWidget.expectLoginFormVisible();
      await chatWidget.emailInput.fill("not-an-email");
      await chatWidget.continueButton.click();
      await chatWidget.expectLoginBlocked();
    });

    test("auth: widget login blocked for empty email @regression @customer", async ({
      page,
    }) => {
      const chatWidget = new ChatWidgetPage(page);
      await chatWidget.openHome();
      await chatWidget.openWidget();
      await chatWidget.openConversationsTab();
      await chatWidget.expectLoginFormVisible();
      await chatWidget.continueButton.click();
      await chatWidget.expectLoginBlocked();
    });
  });

  portalTest.describe("customer support portal pages after widget login", () => {
    portalTest("portal: my tickets page lists tickets and filters work @smoke @regression @customer", async ({
      page,
    }) => {
      const myTickets = new MyTicketsPage(page);
      await myTickets.openMyTickets();
      await myTickets.expectFiltersVisible();
      await myTickets.expectTicketsVisible();
      await myTickets.filterByStatus("Open");
      await expect(page).toHaveURL(/robodesk_page=my-tickets/);
      await myTickets.expectTicketsVisible();
    });

    portalTest("portal: customer can open ticket details from my tickets @regression @customer", async ({
      page,
    }) => {
      const myTickets = new MyTicketsPage(page);
      await myTickets.openMyTickets();
      await myTickets.ticketLinks.first().click();
      const details = new TicketDetailsPage(page);
      await details.expectLoaded();
      await expect(page).toHaveURL(/tid=\d+/);
    });

    portalTest("portal: create ticket form renders and submits a ticket @regression @customer", async ({
      page,
    }) => {
      const data = createTicketData();
      const createTicketPage = new CreateTicketPage(page);
      await createTicketPage.openCreateTicket();
      await createTicketPage.expectFormVisible();
      await createTicketPage.createTicket({
        title: data.title,
        description: data.description,
        priority: data.priority,
      });
      await createTicketPage.expectTicketCreated();
    });

    portalTest("portal: credentials vault shows and stores a credential @smoke @regression @customer", async ({
      page,
    }) => {
      const vault = new CredentialsVaultPage(page);
      await vault.openVault();
      await vault.expectVaultVisible();
      const name = `QA credential ${Date.now()}`;
      await vault.addCredential({
        name,
        username: "qa.user@example.test",
        password: "QaPass@123",
        url: "https://example.test",
        notes: "created by automated test",
      });
      await vault.expectCredentialVisible(name);
      await vault.deleteCredential(name);
      await vault.expectCredentialHidden(name);
    });
  });
});
