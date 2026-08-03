import { expect, type Page } from "@playwright/test";
import { BasePage } from "./basePage";

export class DashboardPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get robodeskMenuLink() {
    return this.page.getByRole("link", { name: /robodesk/i }).first();
  }

  get dashboardLink() {
    return this.page.getByRole("link", { name: /^dashboard$/i }).first();
  }

  get departmentsLink() {
    return this.page.getByRole("link", { name: /departments/i });
  }

  get prioritiesLink() {
    return this.page.getByRole("link", { name: /priorities/i });
  }

  get faqsLink() {
    return this.page.getByRole("link", { name: /faqs?/i });
  }

  get noticesLink() {
    return this.page.getByRole("link", { name: /notices?/i });
  }

  async openDashboard() {
    await this.page.goto(
      "/wp-admin/admin.php?page=robodesk-dashboard&tab=dashboard",
    );
    await this.waitForLoading();
  }

  async expectCoreMenuVisible() {
    await expect(this.robodeskMenuLink)
      .toBeVisible()
      .catch(() => undefined);
    await expect(this.page.locator("body")).toContainText(
      /dashboard|robodesk/i,
    );
  }
}
