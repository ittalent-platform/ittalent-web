import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  // The backend contract is authoritative. The checked-in legacy snapshot lacks
  // My Applications and can silently erase these SDK functions on regeneration.
  input: process.env.OPENAPI_URL ?? "http://localhost:3001/openapi.json",
  output: "src/api/generated",
  plugins: ["@hey-api/client-fetch"],
});
