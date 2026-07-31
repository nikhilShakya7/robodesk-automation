import { type Page } from "@playwright/test";
import { BasePage } from "./basePage";

export class NotificationsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async openNotifications() {
    await this.page.goto("/wp-admin/admin.php?page=robodesk-dashboard");
    await this.waitForLoading();
  }
}
