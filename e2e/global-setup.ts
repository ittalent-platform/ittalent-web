import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { backendEnv, E2E_API_URL } from "../playwright.config";
import { ACCOUNTS, PASSWORD, TOKEN_DIR, tokenFile } from "./support";

function runBackendScript(
  script: string,
  extraEnv: Record<string, string> = {},
): void {
  const result = spawnSync("npm", ["run", script], {
    cwd: "../ittalent-backend",
    env: { ...process.env, ...backendEnv, ...extraEnv },
    encoding: "utf8",
  });
  if (result.status !== 0)
    throw new Error(
      `npm run ${script} failed:\n${result.stdout}\n${result.stderr}`,
    );
}

/** Rebuilds the deterministic demo data, then signs each account in once so tests never hit the login rate limit. */
export default async function globalSetup(): Promise<void> {
  runBackendScript("migrate:application-indexes");
  runBackendScript("seed:applications", { SEED_RESET: "true" });
  mkdirSync(TOKEN_DIR, { recursive: true });
  for (const email of Object.values(ACCOUNTS)) {
    const response = await fetch(`${E2E_API_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ identifier: email, password: PASSWORD }),
    });
    if (!response.ok)
      throw new Error(
        `Login failed for ${email}: ${response.status} ${await response.text()}`,
      );
    writeFileSync(tokenFile(email), JSON.stringify(await response.json()));
  }
}
