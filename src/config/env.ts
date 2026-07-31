import { existsSync } from "fs";
import { join } from "path";

try {
  const envFile = join(process.cwd(), ".env");
  if (existsSync(envFile)) {
    process.loadEnvFile(envFile);
  }
} catch {
  // missing or unreadable .env — fall back to defaults
}

export const config = {
  baseUrl: process.env.BASE_URL || "http://robodesk1.local",
  adminUsername: process.env.ADMIN_USERNAME || "admin",
  adminPassword: process.env.ADMIN_PASSWORD || "admin",
  customerEmail: process.env.CUSTOMER_EMAIL || "",
  customerPassword: process.env.CUSTOMER_PASSWORD || "",
};
