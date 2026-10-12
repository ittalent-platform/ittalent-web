import { rmSync } from "node:fs";

import { runBackendScript } from "./backend-script";
import { TOKEN_DIR } from "./support";

export default function globalTeardown(): void {
  try {
    runBackendScript("cleanup:documents:e2e");
  } finally {
    rmSync(TOKEN_DIR, { force: true, recursive: true });
  }
}
