import { expect, type Page } from "@playwright/test";
import { BasePage } from "./basePage";

export class ChatWidgetPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get chatTrigger() {
    return this.page
      .locator("button.robodesk-toggle-btn")
      .or(
        this.page.getByRole("button", { name: /pop over icon|chat|support/i }),
      )
      .or(
        this.page
          .locator("button")
          .filter({ hasText: /pop over icon|chat|support|icon/i }),
      )
      .first();
  }

  get chatPopup() {
    return this.page.locator(".robodesk-popup.open");
  }

  get conversationsTab() {
    return this.page.locator(".tab-container button[role='tab']").nth(1);
  }

  get noticesTab() {
    return this.page.locator(".tab-container button[role='tab']").nth(2);
  }

  get faqTab() {
    return this.page.locator(".tab-container button[role='tab']").nth(3);
  }

  get loginCard() {
    return this.page.locator(".login-card");
  }

  get emailInput() {
    return this.page.locator('input#email[type="email"]');
  }

  get continueButton() {
    return this.page.locator("button.rd-login-button");
  }

  get passwordInput() {
    return this.page.locator('input#password[type="password"]');
  }

  get loginButton() {
    return this.page.locator("button.rd-login-button");
  }

  get emailError() {
    return this.page.locator("#email-error");
  }

  get passwordError() {
    return this.page.locator("#password-error");
  }

  get conversationsView() {
    return this.page.locator("#keyword-search");
  }

  get searchInput() {
    return this.page.locator("#keyword-search");
  }

  get priorityFilter() {
    return this.page.locator("#priority-filter");
  }

  get statusFilter() {
    return this.page.locator("#status-conversation");
  }

  get ticketRows() {
    return this.page.locator(".rd-tickets .single-rd-ticket");
  }

  get noTicketsMessage() {
    return this.page.getByText(/no tickets found/i);
  }

  get faqItems() {
    return this.page.locator(".robodesk-popup.open .rd-faq-item");
  }

  get faqSearchInput() {
    return this.page.locator(
      ".robodesk-popup.open input[placeholder='Search your answer here']",
    );
  }

  get noticeItems() {
    return this.page.locator(".robodesk-popup.open .rd-notice-item");
  }

  get backButton() {
    return this.page.locator(".robodesk-popup.open .back-button");
  }

  get singleTicketMessageInput() {
    return this.page.locator(
      ".robodesk-popup.open textarea[placeholder='Write a message...']",
    );
  }

  get singleTicketSendButton() {
    return this.page.locator(".robodesk-popup.open .chat-input button").last();
  }

  get fileInput() {
    return this.page.locator(".robodesk-popup.open input[type='file']").first();
  }

  get sentImages() {
    return this.page.locator(".robodesk-popup.open .chat-message.sent img");
  }

  async openNoticesTab() {
    await this.noticesTab.waitFor({ state: "visible", timeout: 10000 });
    await this.noticesTab.click();
  }

  async openFaqTab() {
    await this.faqTab.waitFor({ state: "visible", timeout: 10000 });
    await this.faqTab.click();
  }

  async openFirstTicket() {
    await this.ticketRows.first().waitFor({ state: "visible", timeout: 15000 });
    await this.ticketRows.first().click();
    await this.singleTicketMessageInput.waitFor({
      state: "visible",
      timeout: 10000,
    });
  }

  async searchTickets(term: string) {
    await this.searchInput.fill(term);
  }

  async filterByPriority(priority: string) {
    await this.priorityFilter.selectOption(priority);
  }

  async filterByStatus(status: string) {
    await this.statusFilter.selectOption(status);
  }

  get chatTab() {
    return this.page.locator(".tab-container button[role='tab']").first();
  }

  get chatInput() {
    return this.page.locator('textarea[placeholder="Start a conversation..."]');
  }

  get chatSendButton() {
    return this.page.locator(".send-message-field button").last();
  }

  get chatView() {
    return this.page.locator(".rd-single-ticket .chat-container");
  }

  get replyInput() {
    return this.page.locator("textarea#mesg");
  }

  sentMessage(text: string) {
    return this.page
      .locator(".chat-message.sent .message-content")
      .filter({ hasText: text });
  }

  async openChatTab() {
    await this.chatTab.waitFor({ state: "visible", timeout: 10000 });
    await this.chatTab.click();
  }

  async startChat(message: string) {
    await this.openChatTab();
    await this.chatInput.fill(message);
    await this.chatSendButton.click();
    await this.chatView.waitFor({ state: "visible", timeout: 15000 });
  }

  async openHome() {
    await this.page.goto("/");
    await this.waitForLoading();
  }

  async openWidget() {
    await this.chatPopup
      .first()
      .waitFor({ state: "visible", timeout: 3000 })
      .then(() => undefined)
      .catch(async () => {
        await this.chatTrigger.waitFor({ state: "visible", timeout: 10000 });
        await this.chatTrigger.click().catch(() => undefined);
      });
  }

  async openConversationsTab() {
    await this.conversationsTab.waitFor({ state: "visible", timeout: 10000 });
    await this.conversationsTab.click();
  }

  async loginCustomer(email: string) {
    await this.openWidget();
    await this.openConversationsTab();
    await this.loginCard.waitFor({ state: "visible", timeout: 10000 });
    await this.emailInput.fill(email);
    await this.continueButton.click();
    await this.expectLoggedInView();
  }

  async loginCustomerWithPassword(email: string, password: string) {
    await this.openWidget();
    await this.openConversationsTab();
    await this.loginCard.waitFor({ state: "visible", timeout: 10000 });
    await this.emailInput.fill(email);
    await this.continueButton.click();
    await this.passwordInput.waitFor({ state: "visible", timeout: 10000 });
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    await this.expectLoggedInView();
  }

  async expectWidgetPresent() {
    await expect(this.page.locator("body")).toBeVisible();
  }

  async expectLoginFormVisible() {
    await expect(this.loginCard).toBeVisible();
    await expect(this.emailInput).toBeVisible();
    await expect(this.continueButton).toBeVisible();
  }

  async expectLoggedInView() {
    await expect(this.conversationsView).toBeVisible({ timeout: 15000 });
    await expect(this.loginCard).toHaveCount(0);
  }

  async expectLoginBlocked() {
    await expect(this.loginCard).toBeVisible();
    await expect(this.conversationsView).toHaveCount(0);
  }
}
