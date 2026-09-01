import { expect, type Page } from "@playwright/test";
import { BasePage } from "./basePage";

export class CredentialsVaultPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get addCredentialButton() {
    return this.page.locator("#add-credential-button");
  }

  get addCredentialForm() {
    return this.page.locator("form#robodesk-add-credential");
  }

  get nameInput() {
    return this.page.locator("#credential_name");
  }

  get usernameInput() {
    return this.page.locator("#credential_username");
  }

  get passwordInput() {
    return this.page.locator("#credential_password");
  }

  get urlInput() {
    return this.page.locator("#credential_url");
  }

  get notesInput() {
    return this.page.locator("#credential_notes");
  }

  get submitButton() {
    return this.page.locator('#robodesk-add-credential input[type="submit"]');
  }

  async openVault() {
    await this.page.goto("/robodesk-support/?robodesk_page=credentials-vault");
    await this.waitForLoading();
  }

  async expectVaultVisible() {
    await expect(this.page.locator("body")).toContainText(/credentials vault/i);
    await expect(this.addCredentialButton).toBeVisible();
  }

  async openAddCredentialForm() {
    await this.addCredentialButton.click();
    await expect(this.addCredentialForm).toBeVisible();
  }

  async addCredential(data: {
    name: string;
    username: string;
    password: string;
    url?: string;
    notes?: string;
  }) {
    await this.openAddCredentialForm();
    await this.nameInput.fill(data.name);
    await this.usernameInput.fill(data.username);
    await this.passwordInput.fill(data.password);
    if (data.url) await this.urlInput.fill(data.url);
    if (data.notes) await this.notesInput.fill(data.notes);
    await this.submitButton.scrollIntoViewIfNeeded().catch(() => undefined);
    await this.submitButton.click();
  }

  credentialRow(name: string) {
    return this.page.locator("tr").filter({ hasText: name }).first();
  }

  deleteCredentialButton(name: string) {
    return this.credentialRow(name).locator("button.delete-credential");
  }

  async deleteCredential(name: string) {
    const button = this.deleteCredentialButton(name);
    await button.scrollIntoViewIfNeeded().catch(() => undefined);
    this.page.once("dialog", (dialog) => dialog.accept());
    await button.click({ force: true, noWaitAfter: true, timeout: 10000 });
    await expect(this.credentialRow(name)).toHaveCount(0, { timeout: 15000 });
  }

  async cancelDeleteCredential(name: string) {
    const button = this.deleteCredentialButton(name);
    await button.scrollIntoViewIfNeeded().catch(() => undefined);
    this.page.once("dialog", (dialog) => dialog.dismiss());
    await button.click({ force: true, noWaitAfter: true, timeout: 10000 });
  }

  async submitEmptyForm() {
    await this.openAddCredentialForm();
    await this.submitButton.scrollIntoViewIfNeeded().catch(() => undefined);
    await this.submitButton.click({ noWaitAfter: true, timeout: 10000 });
  }

  async submitWithMissingFields(data: {
    name?: string;
    username?: string;
    password?: string;
  }) {
    await this.openAddCredentialForm();
    if (data.name) await this.nameInput.fill(data.name);
    if (data.username) await this.usernameInput.fill(data.username);
    if (data.password) await this.passwordInput.fill(data.password);
    await this.submitButton.scrollIntoViewIfNeeded().catch(() => undefined);
    await this.submitButton.click({ noWaitAfter: true, timeout: 10000 });
  }

  async expectCredentialVisible(name: string) {
    await expect(this.credentialRow(name)).toBeVisible({ timeout: 15000 });
  }

  async expectCredentialHidden(name: string) {
    await expect(this.credentialRow(name)).toHaveCount(0, { timeout: 15000 });
  }
}
