import { mkdirSync, writeFileSync } from "node:fs";
import { runBackendScript } from "./backend-script";
import { E2E_API_URL } from "./environment";
import { ACCOUNT_PASSWORDS, ACCOUNTS, TOKEN_DIR, tokenFile } from "./support";

/** Rebuilds the deterministic demo data, then signs each account in once so tests never hit the login rate limit. */
export default async function globalSetup(): Promise<void> {
  runBackendScript("migrate:application-indexes");
  runBackendScript("migrate:document-indexes");
  runBackendScript("seed:applications", { SEED_RESET: "true" });
  runBackendScript("seed:documents:e2e");
  mkdirSync(TOKEN_DIR, { recursive: true });
  for (const email of Object.values(ACCOUNTS)) {
    const response = await fetch(`${E2E_API_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        identifier: email,
        password: ACCOUNT_PASSWORDS[email],
      }),
    });
    if (!response.ok)
      throw new Error(
        `Login failed for ${email}: ${response.status} ${await response.text()}`,
      );
    writeFileSync(tokenFile(email), JSON.stringify(await response.json()));
  }
}
