import { spawnSync } from "node:child_process";

import { backendEnv, E2E_BACKEND_DIR } from "./environment";

const isWindows = process.platform === "win32";
const npmCommand = isWindows ? "cmd.exe" : "npm";

export function runBackendScript(
  script: string,
  extraEnv: Record<string, string> = {},
): void {
  const result = spawnSync(
    npmCommand,
    isWindows ? ["/d", "/s", "/c", "npm.cmd", "run", script] : ["run", script],
    {
      cwd: E2E_BACKEND_DIR,
      env: { ...process.env, ...backendEnv, ...extraEnv },
      encoding: "utf8",
    },
  );
  if (result.error) {
    throw new Error(
      `Could not start ${npmCommand} for ${script}: ${result.error.message}`,
    );
  }
  if (result.status !== 0) {
    throw new Error(
      `npm run ${script} failed:\n${result.stdout}\n${result.stderr}`,
    );
  }
}
