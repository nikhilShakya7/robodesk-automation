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
    return this.page
      .locator('input[type="password"]')
      .filter({ hasAttribute: "name", name: "pwd" })
      .first();
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
    await this.page.waitForLoadState("domcontentloaded");
    await this.page
      .getByRole("link", { name: /^dashboard$/i })
      .first()
      .waitFor({ state: "visible", timeout: 20000 })
      .catch(() => undefined);
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
