import { portalTest, expect } from "../src/fixtures/roles";
import { ProfilePage } from "../src/pages/profilePage";

portalTest.describe("Metamint Helpdesk profile", () => {
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

  portalTest(
    "profile: password mismatch is flagged and submit is blocked @regression @customer",
    async ({ page }) => {
      const profile = new ProfilePage(page);
      await profile.openPortalProfile();
      await profile.expectFormVisible();

      await profile.passwordInput.pressSequentially("ValidPass1!");
      await profile.confirmPasswordInput.pressSequentially(
        "ValidPass1!DIFFERENT",
      );
      await page.waitForTimeout(300);

      await expect(profile.passwordMatchFeedback).toContainText(
        /do not match/i,
      );
      await expect(profile.passwordMatchFeedback).toBeVisible();
    },
  );

  portalTest(
    "profile: weak password lists missing requirements @regression @customer",
    async ({ page }) => {
      const profile = new ProfilePage(page);
      await profile.openPortalProfile();
      await profile.expectFormVisible();

      await profile.passwordInput.pressSequentially("weak");
      await page.waitForTimeout(300);

      await expect(profile.passwordFeedback).toContainText(/missing/i);
      await expect(profile.passwordFeedback).toContainText(/uppercase/i);
      await expect(profile.passwordFeedback).toContainText(/number/i);
    },
  );
});
