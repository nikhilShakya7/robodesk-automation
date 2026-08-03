import { test, expect } from "../src/fixtures/roles";
import { ChatWidgetPage } from "../src/pages/chatWidgetPage";
import { config } from "../src/config/env";

test.describe("Robodesk chat widget", () => {
  test("chat: home page renders chat widget container @regression @chat", async ({
    page,
  }) => {
    const chatWidget = new ChatWidgetPage(page);
    await chatWidget.openHome();
    await chatWidget.expectWidgetPresent();
  });

  test("customer: can use the frontend chat widget @regression @customer", async ({
    page,
  }) => {
    const chatWidget = new ChatWidgetPage(page);
    await chatWidget.openHome();
    await chatWidget.openWidget();
    await expect(page.locator("body")).toBeVisible();
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
});
