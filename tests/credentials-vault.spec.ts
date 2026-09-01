import { expect } from "../src/fixtures/roles";
import { portalTest } from "../src/fixtures/roles";
import { CredentialsVaultPage } from "../src/pages/credentialsVaultPage";

portalTest.describe("Robodesk credentials vault", () => {
  portalTest(
    "portal: credentials vault shows and stores a credential @smoke @regression @customer",
    async ({ page }) => {
      const vault = new CredentialsVaultPage(page);
      await vault.openVault();
      await vault.expectVaultVisible();
      const name = `QA credential ${Date.now()}`;
      await vault.addCredential({
        name,
        username: "qa.user@example.test",
        password: "QaPass@123",
        url: "https://example.test",
        notes: "created by automated test",
      });
      await vault.expectCredentialVisible(name);
      await vault.deleteCredential(name);
      await vault.expectCredentialHidden(name);
    },
  );

  portalTest(
    "vault: cancelling delete keeps the credential @regression @customer",
    async ({ page }) => {
      const vault = new CredentialsVaultPage(page);
      await vault.openVault();
      await vault.expectVaultVisible();
      const name = `QA cancel ${Date.now()}`;
      await vault.addCredential({
        name,
        username: "qa.cancel@example.test",
        password: "QaPass@123",
      });
      await vault.expectCredentialVisible(name);

      await vault.cancelDeleteCredential(name);
      await page.waitForTimeout(500);
      await vault.expectCredentialVisible(name);

      await vault.deleteCredential(name);
      await vault.expectCredentialHidden(name);
    },
  );

  portalTest(
    "vault: empty required fields block submission @regression @customer",
    async ({ page }) => {
      const vault = new CredentialsVaultPage(page);
      await vault.openVault();
      await vault.expectVaultVisible();
      const before = await page.locator("tr.robodesk-table-content").count();

      await vault.submitWithMissingFields({});
      await page.waitForTimeout(500);

      await expect(vault.addCredentialForm).toBeVisible();
      const after = await page.locator("tr.robodesk-table-content").count();
      expect(after).toBe(before);
    },
  );

  portalTest(
    "vault: missing password field blocks submission @regression @customer",
    async ({ page }) => {
      const vault = new CredentialsVaultPage(page);
      await vault.openVault();
      await vault.expectVaultVisible();
      const before = await page.locator("tr.robodesk-table-content").count();

      await vault.submitWithMissingFields({
        name: `QA nopass ${Date.now()}`,
        username: "qa.nopass@example.test",
      });
      await page.waitForTimeout(500);

      await expect(vault.addCredentialForm).toBeVisible();
      const after = await page.locator("tr.robodesk-table-content").count();
      expect(after).toBe(before);
    },
  );
});
