import {
  test as base,
  type Browser,
  type StorageState,
} from "@playwright/test";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { login, loginCustomerViaWidgetWithPassword } from "../helpers/robodeskHelpers";
import { config } from "../config/env";

export const test = base.extend({
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
const STORAGE_FILE = join(process.cwd(), ".state", "customer-widget-storage.json");

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

function authenticatedContextFixture() {
  return async ({ browser }, use, testInfo) => {
    const state = await getWorkerStorage(browser, testInfo.workerIndex);
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

export const expect = base.expect;
export const portalExpect = base.expect;