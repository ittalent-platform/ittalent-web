import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: process.env.OPENAPI_URL ?? "./openapi.json",
  output: "src/api/generated",
  plugins: ["@hey-api/client-fetch"],
});
