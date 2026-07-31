import { expect, type Page } from "@playwright/test";
import { BasePage } from "./basePage";

export class CustomerPortalPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get loginLink() {
    return this.page.getByRole("link", { name: /login/i }).first();
  }

  get myTicketsLink() {
    return this.page.getByRole("link", { name: /my tickets/i }).first();
  }

  get submitTicketLink() {
    return this.page.getByRole("link", { name: /submit ticket/i }).first();
  }

  async openPortal() {
    await this.page.goto("/robodesk-support/");
    await this.waitForLoading();
  }

  async expectGuestPrompt() {
    await expect(this.page.getByText(/please/i)).toContainText(/login/i);
  }
}
