import { expect, type Page } from "@playwright/test";
import { BasePage } from "./basePage";

export class LoginPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get usernameInput() {
    return this.page
      .locator('input[name="log"]')
      .or(this.page.getByLabel(/username or email/i));
  }

  get passwordInput() {
    return this.page.locator('input[type="password"][name="pwd"]');
  }

  get loginButton() {
    return this.page.getByRole("button", { name: /log in/i });
  }

  get lostPasswordLink() {
    return this.page.getByRole("link", { name: /lost your password/i });
  }

  async goto() {
    await this.page.goto("/wp-login.php");
  }

  async login({ username, password }: { username: string; password: string }) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    await this.page
      .waitForURL(/wp-admin/, { timeout: 45000 })
      .catch(() => undefined);
    if (this.page.url().includes("wp-login")) {
      await this.usernameInput
        .fill(username)
        .catch(() => undefined);
      await this.passwordInput
        .fill(password)
        .catch(() => undefined);
      await this.loginButton.click().catch(() => undefined);
      await this.page
        .waitForURL(/wp-admin/, { timeout: 45000 })
        .catch(() => undefined);
    }
    await this.page
      .locator("#wpadminbar")
      .waitFor({ state: "visible", timeout: 20000 })
      .catch(() => undefined);
  }

  async expectLoginFormVisible() {
    await expect(this.usernameInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
  }
}
