import { test, expect } from "../src/fixtures/roles";
import { CustomerPortalPage } from "../src/pages/customerPortalPage";
import { ChatWidgetPage } from "../src/pages/chatWidgetPage";
import { createTicketData } from "../src/data/fakeData";
import { config } from "../src/config/env";
import { createTicket, waitForToast } from "../src/helpers/mmhdHelpers";

test.describe("Metamint Helpdesk auth", () => {
  test("portal: guest sees login prompt @smoke @regression @customer", async ({
    page,
  }) => {
    const portal = new CustomerPortalPage(page);
    await portal.openPortal();
    await portal.expectGuestPrompt();
  });

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

  test("auth: widget shows inline errors and skips API call for empty credentials @regression @customer", async ({
    page,
  }) => {
    const chatWidget = new ChatWidgetPage(page);
    let authPosts = 0;
    page.on("request", (request) => {
      if (
        request.method() === "POST" &&
        /admin-ajax\.php|mmhd\/v1\/login/.test(request.url())
      ) {
        authPosts++;
      }
    });
    await chatWidget.openHome();
    await chatWidget.openWidget();
    await chatWidget.openConversationsTab();
    await chatWidget.expectLoginFormVisible();
    await chatWidget.continueButton.click();
    await expect(chatWidget.emailError).toContainText(
      /email address is needed/i,
    );
    await expect(chatWidget.passwordInput).toHaveCount(0);
    expect(authPosts).toBe(0);
    await chatWidget.emailInput.fill(config.customerEmail);
    await chatWidget.continueButton.click();
    await chatWidget.passwordInput.waitFor({
      state: "visible",
      timeout: 10000,
    });
    expect(authPosts).toBe(1);
    await chatWidget.loginButton.click();
    await expect(chatWidget.passwordError).toContainText(
      /password is required/i,
    );
    await chatWidget.expectLoginBlocked();
    expect(authPosts).toBe(1);
  });

  test("auth: widget rejects wrong password with no session @smoke @regression @customer", async ({
    page,
  }) => {
    const chatWidget = new ChatWidgetPage(page);
    await chatWidget.openHome();
    await chatWidget.openWidget();
    await chatWidget.openConversationsTab();
    await chatWidget.expectLoginFormVisible();
    await chatWidget.emailInput.fill(config.customerEmail);
    await chatWidget.continueButton.click();
    await chatWidget.passwordInput.waitFor({
      state: "visible",
      timeout: 10000,
    });
    await chatWidget.passwordInput.fill("DefinitelyWrongPassword123!");
    await chatWidget.loginButton.click();
    await expect(chatWidget.passwordError).toContainText(
      /oops! that.s not the right password/i,
      { timeout: 15000 },
    );
    await chatWidget.expectLoginBlocked();
  });

  test("auth: widget blocks new-user registration when disabled @regression @customer", async ({
    page,
  }) => {
    const chatWidget = new ChatWidgetPage(page);
    await chatWidget.openHome();
    await chatWidget.openWidget();
    await chatWidget.openConversationsTab();
    await chatWidget.expectLoginFormVisible();
    await chatWidget.emailInput.fill(`qa+${Date.now()}@mailinator.com`);
    await chatWidget.continueButton.click();
    await expect(chatWidget.registrationMessage).toBeVisible({
      timeout: 10000,
    });
    await chatWidget.expectLoginBlocked();
  });
});
