import { expect, type Page } from "@playwright/test";
import { BasePage } from "./basePage";

export class NotificationsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get markAllReadButton() {
    return this.page.locator("#robodesk-mark-all-notifications-read");
  }

  get notificationItems() {
    return this.page.locator("li.robodesk-notification-item");
  }

  get unreadItems() {
    return this.page.locator("li.robodesk-notification-item.is-unread");
  }

  get emptyMessage() {
    return this.page.getByText(/no notifications found/i);
  }

  async openNotifications() {
    await this.page.goto(
      "/robodesk-support/?robodesk_page=notifications",
    );
    await this.waitForLoading();
  }

  async expectLoaded() {
    const hasItems = (await this.notificationItems.count()) > 0;
    const hasMarkAll = (await this.markAllReadButton.count()) > 0;
    const hasEmpty = await this.emptyMessage.isVisible().catch(() => false);
    expect(hasItems || hasMarkAll || hasEmpty).toBe(true);
  }

  async clickMarkAllRead() {
    await this.markAllReadButton.click();
    await this.page.waitForLoadState("networkidle", { timeout: 20000 }).catch(
      () => undefined,
    );
    await this.page.waitForTimeout(1000);
  }
}
