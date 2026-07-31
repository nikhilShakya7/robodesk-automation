import { test, expect } from "../src/fixtures/roles";
import { LoginPage } from "../src/pages/loginPage";
import { DashboardPage } from "../src/pages/dashboardPage";
import { ProfilePage } from "../src/pages/profilePage";
import { createReplyData } from "../src/data/fakeData";
import { config } from "../src/config/env";
import { login, replyToTicket, changeStatus } from "../src/helpers/robodeskHelpers";

test.describe("Robodesk admin suite", () => {
  test("auth: admin can view dashboard @smoke @regression @admin", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login({
      username: config.adminUsername,
      password: config.adminPassword,
    });
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.expectCoreMenuVisible();
  });

  test("profile: profile page loads @regression @admin", async ({ page }) => {
    const profilePage = new ProfilePage(page);
    await profilePage.openProfile();
    await expect(page.locator("body")).toBeVisible();
  });

  test("helpers: reply to ticket and status change @regression @admin", async ({
    page,
  }) => {
    const reply = createReplyData();
    await login(page, config.adminUsername, config.adminPassword);
    await page.goto("/wp-admin/post.php?post=1&action=edit");
    await replyToTicket(page, reply.content);
    await changeStatus(page, "Open");
  });
});
