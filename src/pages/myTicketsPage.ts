import { expect, type Page } from "@playwright/test";
import { BasePage } from "./basePage";

export class MyTicketsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get priorityFilter() {
    return this.page.locator('select[name="robodesk_ticket_priority"]');
  }

  get statusFilter() {
    return this.page.locator('select[name="robodesk_ticket_status"]');
  }

  get orderBySelect() {
    return this.page.locator('select[name="orderby"]');
  }

  get orderSelect() {
    return this.page.locator('select[name="order"]');
  }

  get ticketTable() {
    return this.page.locator("table");
  }

  get ticketLinks() {
    return this.page.locator('a[href*="robodesk_page=my-tickets&tid="]');
  }

  async openMyTickets() {
    await this.page.goto("/robodesk-support/?robodesk_page=my-tickets");
    await this.waitForLoading();
  }

  async openTicket(id: string) {
    await this.page.goto(
      `/robodesk-support/?robodesk_page=my-tickets&tid=${id}`,
    );
    await this.waitForLoading();
  }

  async expectFiltersVisible() {
    await expect(this.priorityFilter).toBeVisible();
    await expect(this.statusFilter).toBeVisible();
    await expect(this.orderBySelect).toBeVisible();
    await expect(this.orderSelect).toBeVisible();
  }

  async expectTicketsVisible() {
    await expect(this.ticketTable).toBeVisible();
    await expect(this.ticketLinks.first()).toBeVisible();
  }

  async filterByStatus(status: string) {
    await this.statusFilter.selectOption({ label: status });
  }
}
