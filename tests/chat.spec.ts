import { test, expect, widgetTest } from "../src/fixtures/roles";
import { ChatWidgetPage } from "../src/pages/chatWidgetPage";
import { join } from "path";
import { writeFileSync, unlinkSync } from "fs";

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

  widgetTest(
    "chat: customer starts a chat conversation after login @smoke @regression @customer",
    async ({ page }) => {
      const chatWidget = new ChatWidgetPage(page);
      const message = `QA chat message ${Date.now()}`;
      await chatWidget.openHome();
      await chatWidget.openWidget();
      await chatWidget.startChat(message);
      await expect(chatWidget.sentMessage(message)).toBeVisible();
    },
  );

  widgetTest(
    "chat: search filters conversations in the widget @smoke @regression @customer",
    async ({ page }) => {
      const chatWidget = new ChatWidgetPage(page);
      await chatWidget.openHome();
      await chatWidget.openWidget();
      await chatWidget.openConversationsTab();
      await expect(chatWidget.ticketRows.first()).toBeVisible({
        timeout: 15000,
      });
      const total = await chatWidget.ticketRows.count();
      expect(total).toBeGreaterThan(0);
      const firstRowTitle = (
        await chatWidget.ticketRows.first().innerText()
      )
        .trim()
        .split("\n")[0]
        .trim();
      expect(firstRowTitle).toBeTruthy();
      await chatWidget.searchTickets(firstRowTitle);
      await expect
        .poll(async () => chatWidget.ticketRows.count(), { timeout: 10000 })
        .toBeGreaterThan(0);
      const matched = await chatWidget.ticketRows.count();
      expect(matched).toBeGreaterThan(0);
      expect(matched).toBeLessThanOrEqual(total);
      await chatWidget.searchTickets("zzzz-no-match-zzzz");
      await expect(chatWidget.noTicketsMessage).toBeVisible({
        timeout: 10000,
      });
      await chatWidget.searchTickets("");
      await expect
        .poll(async () => chatWidget.ticketRows.count(), { timeout: 10000 })
        .toBeGreaterThan(0);
    },
  );

  widgetTest(
    "chat: priority and status filters work in the widget @regression @customer",
    async ({ page }) => {
      const chatWidget = new ChatWidgetPage(page);
      await chatWidget.openHome();
      await chatWidget.openWidget();
      await chatWidget.openConversationsTab();
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
    },
  );

  widgetTest(
    "chat: FAQ tab lists questions and search filters them @regression @customer",
    async ({ page }) => {
      const chatWidget = new ChatWidgetPage(page);
      await chatWidget.openHome();
      await chatWidget.openWidget();
      await chatWidget.openFaqTab();
      await expect(chatWidget.faqItems.first()).toBeVisible({
        timeout: 10000,
      });
      const total = await chatWidget.faqItems.count();
      expect(total).toBeGreaterThan(0);
      await chatWidget.faqSearchInput.fill("conversations");
      await expect
        .poll(async () => chatWidget.faqItems.count(), { timeout: 10000 })
        .toBeGreaterThan(0);
      const matched = await chatWidget.faqItems.count();
      expect(matched).toBeLessThan(total);
      await expect(chatWidget.faqItems.first()).toContainText(/conversation/i);
      await chatWidget.faqSearchInput.fill("zzz-no-match-zzz");
      await expect
        .poll(async () => chatWidget.faqItems.count(), { timeout: 10000 })
        .toBe(0);
      await chatWidget.faqSearchInput.fill("");
      await expect
        .poll(async () => chatWidget.faqItems.count(), { timeout: 10000 })
        .toBe(total);
    },
  );

  widgetTest(
    "chat: FAQ detail opens from the FAQ list @regression @customer",
    async ({ page }) => {
      const chatWidget = new ChatWidgetPage(page);
      await chatWidget.openHome();
      await chatWidget.openWidget();
      await chatWidget.openFaqTab();
      await expect(chatWidget.faqItems.first()).toBeVisible({
        timeout: 10000,
      });
      const title = await chatWidget.faqItems
        .first()
        .locator(".rd-faq-title")
        .innerText();
      await chatWidget.faqItems.first().click();
      await expect(chatWidget.backButton).toBeVisible({ timeout: 10000 });
      await expect(page.locator(".robodesk-popup.open")).toContainText(title);
      await chatWidget.backButton.click();
      await expect(chatWidget.faqItems.first()).toBeVisible({ timeout: 10000 });
    },
  );

  widgetTest(
    "chat: notices render in the widget @regression @customer",
    async ({ page }) => {
      const chatWidget = new ChatWidgetPage(page);
      await chatWidget.openHome();
      await chatWidget.openWidget();
      await chatWidget.openNoticesTab();
      await expect(chatWidget.noticeItems.first()).toBeVisible({
        timeout: 10000,
      });
      const count = await chatWidget.noticeItems.count();
      expect(count).toBeGreaterThan(0);
      await expect(
        page.locator(".robodesk-popup.open .rd-notice-tab-wrap"),
      ).toContainText(/notices|stay updated/i);
    },
  );

  widgetTest(
    "chat: ticket row opens single-ticket chat view and back returns to list @regression @customer",
    async ({ page }) => {
      const chatWidget = new ChatWidgetPage(page);
      await chatWidget.openHome();
      await chatWidget.openWidget();
      await chatWidget.openConversationsTab();
      await expect(chatWidget.ticketRows.first()).toBeVisible({
        timeout: 15000,
      });
      await chatWidget.ticketRows.first().click();
      await expect(chatWidget.singleTicketMessageInput).toBeVisible({
        timeout: 10000,
      });
      await expect(chatWidget.backButton).toBeVisible();
      await chatWidget.backButton.click();
      await expect(chatWidget.ticketRows.first()).toBeVisible({
        timeout: 10000,
      });
    },
  );

  widgetTest(
    "chat: customer sends an image attachment in a ticket @smoke @regression @customer",
    async ({ page }) => {
      const chatWidget = new ChatWidgetPage(page);
      await chatWidget.openHome();
      await chatWidget.openWidget();
      await chatWidget.openConversationsTab();
      await chatWidget.openFirstTicket();
      const before = await chatWidget.sentImages.count();
      await chatWidget.fileInput.setInputFiles(
        join(process.cwd(), "test-data", "tiny.jpeg"),
      );
      await expect(
        page.locator(".robodesk-popup.open .chat-input.has-preview"),
      ).toBeVisible({ timeout: 10000 });
      await chatWidget.singleTicketSendButton.click();
      await expect
        .poll(async () => chatWidget.sentImages.count(), { timeout: 15000 })
        .toBeGreaterThan(before);
    },
  );

  widgetTest(
    "chat: search handles special characters without crashing @regression @customer",
    async ({ page }) => {
      const chatWidget = new ChatWidgetPage(page);
      await chatWidget.openHome();
      await chatWidget.openWidget();
      await chatWidget.openConversationsTab();
      await expect(chatWidget.ticketRows.first()).toBeVisible({
        timeout: 15000,
      });
      const total = await chatWidget.ticketRows.count();
      for (const term of [".*", "[abc", "a+b*c?", "   "]) {
        await chatWidget.searchTickets(term);
        await expect
          .poll(async () => chatWidget.ticketRows.count(), { timeout: 10000 })
          .toBeLessThanOrEqual(total);
        await expect(chatWidget.noTicketsMessage).toBeVisible({
          timeout: 10000,
        });
      }
      await chatWidget.searchTickets("");
      await expect
        .poll(async () => chatWidget.ticketRows.count(), { timeout: 10000 })
        .toBe(total);
    },
  );

  widgetTest(
    "chat: session persists across page reload (no re-login) @regression @customer",
    async ({ page }) => {
      const chatWidget = new ChatWidgetPage(page);
      await chatWidget.openHome();
      await chatWidget.openWidget();
      await chatWidget.openConversationsTab();
      await expect(chatWidget.ticketRows.first()).toBeVisible({
        timeout: 15000,
      });
      await chatWidget.expectLoggedInView();

      await page.reload({ waitUntil: "networkidle" });
      await chatWidget.openWidget();
      await chatWidget.openConversationsTab();
      await expect(chatWidget.ticketRows.first()).toBeVisible({
        timeout: 15000,
      });
      await expect(page.locator(".login-card")).toHaveCount(0);
      await expect(chatWidget.conversationsView).toBeVisible({
        timeout: 15000,
      });
    },
  );

  widgetTest(
    "chat: empty reply does not send a message @regression @customer",
    async ({ page }) => {
      const chatWidget = new ChatWidgetPage(page);
      await chatWidget.openHome();
      await chatWidget.openWidget();
      await expect(chatWidget.chatInput).toBeVisible({ timeout: 10000 });

      await chatWidget.chatInput.fill("   ");
      await expect(chatWidget.chatSendButton).toBeDisabled({ timeout: 5000 });
      await chatWidget.chatSendButton.click({ force: true }).catch(
        () => undefined,
      );
      await page.waitForTimeout(800);
      await expect(chatWidget.chatInput).toHaveValue("   ");
    },
  );

  widgetTest(
    "chat: uploading an invalid file type is rejected @regression @customer",
    async ({ page }) => {
      const chatWidget = new ChatWidgetPage(page);
      await chatWidget.openHome();
      await chatWidget.openWidget();
      await chatWidget.openConversationsTab();
      await chatWidget.openFirstTicket();

      const filePath = join(process.cwd(), "test-data", "invalid.txt");
      writeFileSync(filePath, "not an image");
      const dialogMessage = new Promise<string>((resolve) => {
        page.once("dialog", (dialog) => {
          resolve(dialog.message());
          dialog.accept();
        });
      });

      await chatWidget.fileInput.setInputFiles(filePath);
      const message = await dialogMessage;
      expect(message).toMatch(/JPEG, PNG, or GIF/i);
      unlinkSync(filePath);
    },
  );

  widgetTest(
    "chat: uploading an oversized file is rejected @regression @customer",
    async ({ page }) => {
      const chatWidget = new ChatWidgetPage(page);
      await chatWidget.openHome();
      await chatWidget.openWidget();
      await chatWidget.openConversationsTab();
      await chatWidget.openFirstTicket();

      const filePath = join(process.cwd(), "test-data", "oversize.png");
      const buffer = Buffer.alloc(4 * 1024 * 1024, 0);
      writeFileSync(filePath, buffer);
      const dialogMessage = new Promise<string>((resolve) => {
        page.once("dialog", (dialog) => {
          resolve(dialog.message());
          dialog.accept();
        });
      });

      await chatWidget.fileInput.setInputFiles(filePath);
      const message = await dialogMessage;
      expect(message).toMatch(/less than 3MB/i);
      unlinkSync(filePath);
    },
  );
});
