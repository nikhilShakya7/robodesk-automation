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
    return this.page
      .locator("form#mmhd-create-ticket")
      .getByRole("button", { name: /create ticket/i });
  }

  // Navigation
  async openCreateTicket() {
    await this.page.goto("/mmhd-support/?mmhd_page=create-ticket");
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
      const priorityValue = await this.prioritySelect
        .locator("option")
        .evaluateAll((options, priority) => {
          const normalizedPriority = String(priority).toLowerCase();
          return (
            options.find(
              (option) =>
                option.textContent?.trim().toLowerCase() === normalizedPriority,
            ) as HTMLOptionElement | undefined
          )?.value;
        }, data.priority);

      if (priorityValue) {
        await this.prioritySelect.selectOption({ value: priorityValue });
      }
    }

    await this.submitButton.scrollIntoViewIfNeeded();

    await Promise.all([
      this.page.waitForLoadState("networkidle"),
      this.submitButton.click(),
    ]);
  }
}
