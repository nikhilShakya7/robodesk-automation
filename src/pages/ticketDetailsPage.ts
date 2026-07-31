import { expect, type Page } from "@playwright/test";
import { BasePage } from "./basePage";

export class TicketDetailsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get title() {
    return this.page.locator("h1, h2").first();
  }

  get replyTextarea() {
    return this.page
      .getByLabel(/reply|comment/i)
      .or(this.page.locator("textarea"));
  }

  async openTicket(id: string) {
    await this.page.goto(`/wp-admin/post.php?post=${id}&action=edit`);
    await this.waitForLoading();
  }

  async expectLoaded() {
    await expect(this.title).toBeVisible();
  }
}
