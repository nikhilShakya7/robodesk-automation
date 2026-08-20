import { expect, type Page } from "@playwright/test";
import { BasePage } from "./basePage";

export interface CreateTicketData {
  title: string;
  description: string;
  priority?: string;
}

export class CreateTicketPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // Locators
  get titleInput() {
    return this.page.locator("#ticket_title");
  }

  get descriptionEditor() {
    return this.page.frameLocator("iframe#ticket_content_ifr").locator("body");
  }

  get originSelect() {
    return this.page.locator('select[name="ticket_origin"]');
  }

  get prioritySelect() {
    return this.page.locator("#ticket_priority");
  }

  get submitButton() {
    return this.page.locator(
      'form#robodesk-create-ticket input[type="submit"]',
    );
  }

  // Navigation
  async openCreateTicket() {
    await this.page.goto("/robodesk-support/?robodesk_page=create-ticket");
    await this.waitForLoading();
  }

  // Assertions
  async expectFormVisible() {
    await expect(
      this.page
        .locator("h1, h2")
        .filter({ hasText: /create new ticket/i })
        .first(),
    ).toBeVisible();

    await expect(this.titleInput).toBeVisible();
    await expect(this.descriptionEditor).toBeVisible();
    await expect(this.prioritySelect).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }

  async expectTicketCreated() {
    // Wait for page to finish loading after submission
    await this.page.waitForLoadState("networkidle");

    // Check for common success messages
    await expect(this.page.locator("body")).toContainText(
      /ticket.*created|ticket.*submitted|success|thanks/i,
      {
        timeout: 15000,
      },
    );
  }

  // Actions
  async fillDescription(text: string) {
    await this.descriptionEditor.click();
    await this.descriptionEditor.fill(text);
  }

  async createTicket(data: CreateTicketData) {
    await this.titleInput.fill(data.title);

    await this.fillDescription(data.description);

    if (data.priority) {
      await this.prioritySelect
        .selectOption({ label: data.priority })
        .catch(() => {
          // Ignore if the provided priority doesn't exist
        });
    }

    await this.submitButton.scrollIntoViewIfNeeded();

    await Promise.all([
      this.page.waitForLoadState("networkidle"),
      this.submitButton.click(),
    ]);
  }
}
