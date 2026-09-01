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

  get replyEditor() {
    return this.page.frameLocator("iframe#comment_ifr").locator("body");
  }

  get submitReplyButton() {
    return this.page.locator("#submit");
  }

  async openTicket(id: string) {
    await this.page.goto(`/wp-admin/post.php?post=${id}&action=edit`);
    await this.waitForLoading();
  }

  async reply(content: string) {
    await expect(
      this.page.locator("iframe#comment_ifr").first(),
    ).toBeAttached({ timeout: 15000 });
    await this.replyEditor.waitFor({ state: "visible", timeout: 15000 });
    await this.replyEditor.click();
    await this.replyEditor.pressSequentially(content);
    await expect(this.replyEditor).toContainText(content, { timeout: 5000 });
    await this.submitReplyButton.click();
  }

  async expectReplyVisible(content: string) {
    await expect(this.page.locator("body")).toContainText(content, {
      timeout: 15000,
    });
  }

  async expectLoaded() {
    await expect(this.title).toBeVisible();
  }
}
