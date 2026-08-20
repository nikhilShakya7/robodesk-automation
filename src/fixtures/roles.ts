import {
  test as base,
  type Browser,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { login, loginCustomerViaWidgetWithPassword } from "../helpers/robodeskHelpers";
import { config } from "../config/env";

type StorageState = Awaited<ReturnType<BrowserContext["storageState"]>>;
type AdminUser = { username: string; password: string };

export const test = base.extend<{
  adminUser: AdminUser;
  supportManagerUser: AdminUser;
  supportStaffUser: AdminUser;
  customerUser: { username: string; password: string };
  guestUser: { username: string; password: string };
}>({
  adminUser: async ({ page }, use) => {
    await login(page, config.adminUsername, config.adminPassword);
    await use({ username: config.adminUsername, password: config.adminPassword });
  },
  supportManagerUser: async ({ page }, use) => {
    await login(page, config.adminUsername, config.adminPassword);
    await use({ username: config.adminUsername, password: config.adminPassword });
  },
  supportStaffUser: async ({ page }, use) => {
    await login(page, config.adminUsername, config.adminPassword);
    await use({ username: config.adminUsername, password: config.adminPassword });
  },
  customerUser: async ({ page }, use) => {
    await page.goto("/");
    await use({ username: "customer", password: "customer" });
  },
  guestUser: async ({ page }, use) => {
    await page.goto("/");
    await use({ username: "guest", password: "" });
  },
});

const CUSTOMER_EMAIL = config.customerEmail;
const CUSTOMER_PASSWORD = config.customerPassword;
const storageStateByWorker: Record<number, StorageState> = {};
const adminStorageStateByWorker: Record<number, StorageState> = {};
const STORAGE_FILE = join(process.cwd(), ".state", "customer-widget-storage.json");
const ADMIN_STORAGE_FILE = join(process.cwd(), ".state", "admin-wp-storage.json");

async function loginCustomerViaWidgetOnce(browser: Browser): Promise<StorageState> {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("/");
  await loginCustomerViaWidgetWithPassword(
    page,
    CUSTOMER_EMAIL,
    CUSTOMER_PASSWORD,
  );
  const state = await context.storageState();
  await context.close();
  saveStorage(state);
  return state;
}

function saveStorage(state: StorageState) {
  mkdirSync(dirname(STORAGE_FILE), { recursive: true });
  writeFileSync(STORAGE_FILE, JSON.stringify(state));
}

async function validateCustomerStorage(
  browser: Browser,
  state: StorageState,
): Promise<boolean> {
  const context = await browser.newContext({ storageState: state });
  const page = await context.newPage();
  try {
    await page.goto("/robodesk-support/?robodesk_page=my-tickets");
    await page.waitForTimeout(2000);
    const loggedIn = await page.evaluate(
      () => !document.body.innerText.includes("Please login to view your tickets"),
    );
    return loggedIn;
  } catch {
    return false;
  } finally {
    await context.close();
  }
}

// One login per worker per run: reuses the disk cache and re-validates it;
// only performs a fresh widget login when the cached session is missing or expired.
async function getCustomerStorage(browser: Browser): Promise<StorageState> {
  if (existsSync(STORAGE_FILE)) {
    try {
      const state = JSON.parse(
        readFileSync(STORAGE_FILE, "utf8"),
      ) as StorageState;
      if (await validateCustomerStorage(browser, state)) {
        return state;
      }
    } catch {
      // fall through to a fresh login
    }
  }
  return loginCustomerViaWidgetOnce(browser);
}

async function getWorkerStorage(
  browser: Browser,
  workerIndex: number,
): Promise<StorageState> {
  if (!storageStateByWorker[workerIndex]) {
    storageStateByWorker[workerIndex] = await getCustomerStorage(browser);
  }
  return storageStateByWorker[workerIndex];
}

async function loginAdminOnce(browser: Browser): Promise<StorageState> {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("/wp-login.php");
  await page.locator('input[name="log"]').fill(config.adminUsername);
  await page.locator('input[name="pwd"]').fill(config.adminPassword);
  await page.locator("#wp-submit").click();
  await page
    .waitForURL(/wp-admin/, { timeout: 45000 })
    .catch(() => undefined);
  const state = await context.storageState();
  await context.close();
  mkdirSync(dirname(ADMIN_STORAGE_FILE), { recursive: true });
  writeFileSync(ADMIN_STORAGE_FILE, JSON.stringify(state));
  return state;
}

async function validateAdminStorage(
  browser: Browser,
  state: StorageState,
): Promise<boolean> {
  const context = await browser.newContext({ storageState: state });
  const page = await context.newPage();
  try {
    await page.goto(
      "/wp-admin/admin.php?page=robodesk-dashboard&tab=dashboard",
    );
    await page.waitForTimeout(2000);
    const loggedIn = await page.evaluate(
      () => !location.href.includes("wp-login"),
    );
    return loggedIn;
  } catch {
    return false;
  } finally {
    await context.close();
  }
}

async function getAdminStorage(browser: Browser): Promise<StorageState> {
  if (existsSync(ADMIN_STORAGE_FILE)) {
    try {
      const state = JSON.parse(
        readFileSync(ADMIN_STORAGE_FILE, "utf8"),
      ) as StorageState;
      if (await validateAdminStorage(browser, state)) {
        return state;
      }
    } catch {
      // fall through to a fresh login
    }
  }
  return loginAdminOnce(browser);
}

async function getWorkerAdminStorage(
  browser: Browser,
  workerIndex: number,
): Promise<StorageState> {
  if (!adminStorageStateByWorker[workerIndex]) {
    adminStorageStateByWorker[workerIndex] = await getAdminStorage(browser);
  }
  return adminStorageStateByWorker[workerIndex];
}

function authenticatedContextFixture() {
  return async (
    { browser }: { browser: Browser },
    use: (page: Page) => Promise<void>,
    testInfo: TestInfo,
  ) => {
    const state = await getWorkerStorage(browser, testInfo.workerIndex);
    const context = await browser.newContext({ storageState: state });
    const page = await context.newPage();
    await use(page);
    await context.close();
  };
}

function authenticatedAdminContextFixture() {
  return async (
    { browser }: { browser: Browser },
    use: (page: Page) => Promise<void>,
    testInfo: TestInfo,
  ) => {
    const state = await getWorkerAdminStorage(browser, testInfo.workerIndex);
    const context = await browser.newContext({ storageState: state });
    const page = await context.newPage();
    await use(page);
    await context.close();
  };
}

export const portalTest = base.extend({
  page: authenticatedContextFixture(),
});

export const widgetTest = base.extend({
  page: authenticatedContextFixture(),
});

export const adminTest = base.extend({
  page: authenticatedAdminContextFixture(),
});

export const conversationTest = base.extend<{
  customerPage: Page;
  adminPage: Page;
}>({
  customerPage: authenticatedContextFixture(),
  adminPage: authenticatedAdminContextFixture(),
});

export const expect = base.expect;
export const portalExpect = base.expect;