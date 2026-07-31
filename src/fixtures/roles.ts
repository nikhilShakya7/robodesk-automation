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
  return state;
}

async function getCustomerStorage(browser: Browser): Promise<StorageState> {
  if (existsSync(STORAGE_FILE)) {
    try {
      return JSON.parse(readFileSync(STORAGE_FILE, "utf8")) as StorageState;
    } catch {
      // fall through to a fresh login
    }
  }
  const state = await loginCustomerViaWidgetOnce(browser);
  mkdirSync(dirname(STORAGE_FILE), { recursive: true });
  writeFileSync(STORAGE_FILE, JSON.stringify(state));
  return state;
}

export const portalTest = base.extend({
  page: async ({ browser }, use, testInfo) => {
    if (!storageStateByWorker[testInfo.workerIndex]) {
      storageStateByWorker[testInfo.workerIndex] = await getCustomerStorage(
        browser,
      );
    }
    const context = await browser.newContext({
      storageState: storageStateByWorker[testInfo.workerIndex],
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export const expect = base.expect;
export const portalExpect = base.expect;
