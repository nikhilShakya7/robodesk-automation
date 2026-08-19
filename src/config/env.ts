import { existsSync } from "fs";
import { join } from "path";

const envFile = join(process.cwd(), ".env");
if (existsSync(envFile)) {
  try {
    process.loadEnvFile(envFile);
  } catch {
    // malformed .env — required() below will fail with a clear message
  }
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable "${name}". Copy .env.example to .env and set your real values.`,
    );
  }
  return value;
}

export const config = {
  baseUrl: required("BASE_URL"),
  adminUsername: required("ADMIN_USERNAME"),
  adminPassword: required("ADMIN_PASSWORD"),
  customerEmail: required("CUSTOMER_EMAIL"),
  customerPassword: required("CUSTOMER_PASSWORD"),
};
