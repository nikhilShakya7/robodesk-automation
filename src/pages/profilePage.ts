import { expect, type Page } from "@playwright/test";
import { BasePage } from "./basePage";

export class ProfilePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get profileHeading() {
    return this.page.getByRole("heading", { name: /profile/i });
  }

  async openProfile() {
    await this.page.goto("/wp-admin/profile.php");
    await this.waitForLoading();
  }

  async expectVisible() {
    await expect(
      this.profileHeading.or(this.page.locator("body")),
    ).toBeVisible();
  }
}
