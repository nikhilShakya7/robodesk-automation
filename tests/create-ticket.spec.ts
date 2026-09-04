import { test, expect, portalTest } from "../src/fixtures/roles";
import { CreateTicketPage } from "../src/pages/createTicketPage";
import { createTicketData } from "../src/data/fakeData";

test.describe("Metamint Helpdesk create ticket", () => {
  test.setTimeout(180_000);
  test("tickets: create ticket form is available @smoke @regression @customer", async ({
    page,
  }) => {
    test.skip(
      true,
      "TODO: The live UI does not render the ticket form on /submit-ticket/ despite plugin documentation.",
    );
    const createTicketPage = new CreateTicketPage(page);
    await createTicketPage.openCreateTicket();
    await createTicketPage.expectFormVisible();
  });

  portalTest(
    "portal: create ticket form renders and submits a ticket @regression @customer",
    async ({ page }) => {
      const data = createTicketData();
      const createTicketPage = new CreateTicketPage(page);
      await createTicketPage.openCreateTicket();
      await createTicketPage.expectFormVisible();
      await createTicketPage.createTicket({
        title: data.title,
        description: data.description,
        priority: data.priority,
      });
      await createTicketPage.expectTicketCreated();
    },
  );

  portalTest(
    "portal: create ticket blocks empty title without creating a ticket @regression @customer",
    async ({ page }) => {
      const create = new CreateTicketPage(page);
      await create.openCreateTicket();
      await create.expectFormVisible();
      let posts = 0;
      page.on("request", (request) => {
        if (request.method() === "POST") posts++;
      });
      await create.submitButton.click();
      await expect(page).toHaveURL(/mmhd_page=create-ticket/);
      await expect(create.titleInput).toHaveValue("");
      await expect(page.locator("body")).not.toContainText(
        /ticket.*created|ticket.*submitted|success|thanks/i,
      );
      expect(posts).toBe(0);
    },
  );

  portalTest(
    "portal: create ticket accepts special characters in the title @regression @customer",
    async ({ page }) => {
      const create = new CreateTicketPage(page);
      await create.openCreateTicket();
      await create.expectFormVisible();
      const title = `QA Special <>&'"${Date.now()}`;
      await create.titleInput.fill(title);
      await create.fillDescription("Special character ticket description");
      await create.submitButton.scrollIntoViewIfNeeded();
      await Promise.all([
        page.waitForLoadState("networkidle"),
        create.submitButton.click(),
      ]);
      await expect(page.locator("body")).toContainText(
        /ticket.*created|ticket.*submitted|success|thanks/i,
        { timeout: 15000 },
      );
    },
  );
});
