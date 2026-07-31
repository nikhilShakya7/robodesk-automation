import type { Locator, Page } from "@playwright/test";

export class BasePage {
  constructor(protected page: Page) {}

  async goto(path = "/") {
    await this.page.goto(path);
  }

  async waitForLoading() {
    await this.page.waitForLoadState("networkidle");
  }

  async waitForToast(expectedText?: string | RegExp) {
    const toast = this.page
      .locator(
        '.notice-success, .notice-warning, .notice-error, [role="status"], .toast',
      )
      .filter({ hasText: /./ })
      .first();
    await toast
      .waitFor({ state: "visible", timeout: 5000 })
      .catch(() => undefined);
    if (expectedText) {
      await toast
        .filter({ hasText: expectedText })
        .waitFor({ state: "visible", timeout: 5000 })
        .catch(() => undefined);
    }
    return toast;
  }

  async findFirstVisible(locator: Locator) {
    await locator.first().waitFor({ state: "visible", timeout: 10000 });
    return locator.first();
  }
}
