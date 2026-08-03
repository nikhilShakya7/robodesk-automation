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
});
