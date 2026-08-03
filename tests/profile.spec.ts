import { portalTest, expect } from "../src/fixtures/roles";
import { ProfilePage } from "../src/pages/profilePage";

portalTest.describe("Robodesk profile", () => {
  portalTest(
    "portal: customer can update profile first name @regression @customer",
    async ({ page }) => {
      const profile = new ProfilePage(page);
      await profile.openPortalProfile();
      await profile.expectFormVisible();
      const original = await profile.firstNameInput.inputValue();
      const updated = `QA ${Date.now()}`;
      try {
        await profile.updateFirstName(updated);
        await expect(page.locator("body")).toContainText(
          /profile updated successfully/i,
        );
        await profile.openPortalProfile();
        await profile.expectFirstName(updated);
      } finally {
        await profile.firstNameInput.fill(original);
        await profile.submitButton.click();
        await expect(page.locator("body")).toContainText(
          /profile updated successfully/i,
        );
      }
    },
  );
});
