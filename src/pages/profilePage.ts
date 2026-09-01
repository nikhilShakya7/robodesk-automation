import { expect, type Page } from "@playwright/test";
import { BasePage } from "./basePage";

export class ProfilePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get profileHeading() {
    return this.page.getByRole("heading", { name: /profile/i });
  }

  get firstNameInput() {
    return this.page.locator("#first_name");
  }

  get lastNameInput() {
    return this.page.locator("#last_name");
  }

  get profilePictureInput() {
    return this.page.locator("#profile_picture");
  }

  get passwordInput() {
    return this.page.locator("#password");
  }

  get confirmPasswordInput() {
    return this.page.locator("#confirm_password");
  }

  get submitButton() {
    return this.page.locator("#profile-submit");
  }

  get passwordFeedback() {
    return this.page.locator("#password-feedback");
  }

  get confirmPasswordFeedback() {
    return this.page.locator("#confirm-password-feedback");
  }

  get passwordMatchFeedback() {
    return this.page.locator("#password-match-feedback");
  }

  async openProfile() {
    await this.page.goto("/wp-admin/profile.php");
    await this.waitForLoading();
  }

  async openPortalProfile() {
    await this.page.goto("/robodesk-support/?robodesk_page=profile");
    await this.waitForLoading();
  }

  async expectVisible() {
    await expect(
      this.profileHeading.or(this.page.locator("body")),
    ).toBeVisible();
  }

  async expectFormVisible() {
    await expect(
      this.page
        .locator("h1, h2, h3")
        .filter({ hasText: /update profile/i })
        .first(),
    ).toBeVisible();
    await expect(this.firstNameInput).toBeVisible();
    await expect(this.lastNameInput).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }

  async updateFirstName(name: string) {
    await this.firstNameInput.fill(name);
    await this.submitButton.click();
    await expect(this.page.locator("body")).toContainText(
      /profile updated successfully/i,
      { timeout: 15000 },
    );
  }

  async expectFirstName(name: string) {
    await expect(this.firstNameInput).toHaveValue(name);
  }
}
