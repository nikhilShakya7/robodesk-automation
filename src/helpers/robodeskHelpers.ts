import type { Page } from "@playwright/test";
import { BasePage } from "../pages/basePage";
import { LoginPage } from "../pages/loginPage";
import { ChatWidgetPage } from "../pages/chatWidgetPage";

export async function login(page: Page, username: string, password: string) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login({ username, password });
}

export async function loginCustomerViaWidget(page: Page, email: string) {
  const widget = new ChatWidgetPage(page);
  await widget.loginCustomer(email);
}

export async function loginCustomerViaWidgetWithPassword(
  page: Page,
  email: string,
  password: string,
) {
  const widget = new ChatWidgetPage(page);
  await widget.loginCustomerWithPassword(email, password);
}

export async function logout(page: Page) {
  await page.goto("/wp-login.php?action=logout");
  await page
    .getByRole("link", { name: /log out/i })
    .click()
    .catch(() => undefined);
}

export async function createTicket(
  page: Page,
  data: {
    title: string;
    description: string;
    origin?: string;
    priority?: string;
  },
) {
  const base = new BasePage(page);
  await page.goto("/submit-ticket/");
  const titleField = page.locator("#ticket_title");
  const descriptionField = page.locator("#ticket_content");
  if (await titleField.count()) {
    await titleField.fill(data.title);
    await descriptionField.fill(data.description);
    if (data.origin) {
      await page
        .locator('select[name="ticket_origin"]')
        .selectOption({ label: data.origin })
        .catch(() => undefined);
    }
    if (data.priority) {
      await page
        .locator('select[name="ticket_priority"]')
        .selectOption({ label: data.priority })
        .catch(() => undefined);
    }
    await page
      .getByRole("button", { name: /submit ticket/i })
      .click()
      .catch(() => page.locator('input[type="submit"]').click());
    await base.waitForToast();
  }
}

export async function replyToTicket(page: Page, content: string) {
  const editor = page.locator("#new-reply");
  await editor.click();
  await editor.pressSequentially(content);
  await page.locator("#send-reply-btn").click();
}

export async function assignTicket(page: Page, assignee: string) {
  await page
    .getByLabel(/assignee/i)
    .selectOption({ label: assignee })
    .catch(() => undefined);
}

export async function changeStatus(page: Page, status: string) {
  await page
    .locator("select#ticket-status-select")
    .selectOption({ label: status });
}

export async function uploadFile(page: Page, filePath: string) {
  await page.locator('input[type="file"]').setInputFiles(filePath);
}

export async function deleteTicket(page: Page) {
  await page
    .getByRole("link", { name: /delete/i })
    .first()
    .click()
    .catch(() => undefined);
}

export async function waitForToast(page: Page, expectedText?: string | RegExp) {
  const base = new BasePage(page);
  return base.waitForToast(expectedText);
}

export async function waitForLoading(page: Page) {
  const base = new BasePage(page);
  await base.waitForLoading();
}
