import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";
import importAlias from "@dword-design/eslint-plugin-import-alias";

const HEX_COLOR_GRANDFATHERED_FILES = [
  "src/components/common/loading-screen.tsx",
  "src/components/toast/toast-provider.tsx",
  "src/features/auth/login-page.tsx",
  "src/features/auth/register-page.tsx",
  "src/features/public-site/landing-page.tsx",
];

const NO_HARDCODED_HEX_RULE = {
  "no-restricted-syntax": [
    "error",
    {
      selector: "JSXAttribute[name.name='className'] Literal[value=/#[0-9a-fA-F]{3,8}\\b/]",
      message: "Don't hardcode hex colors in className — use a design token from src/styles/globals.css instead.",
    },
    {
      selector: "JSXAttribute[name.name='className'] TemplateElement[value.raw=/#[0-9a-fA-F]{3,8}\\b/]",
      message: "Don't hardcode hex colors in className — use a design token from src/styles/globals.css instead.",
    },
  ],
};

export default defineConfig([
  globalIgnores(["dist", "src/api/generated", "scripts"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      importAlias.configs.recommended,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      "react-refresh/only-export-components": "off",
      "@dword-design/import-alias/prefer-alias": [
        "error",
        {
          alias: {
            "@": "./src",
          },
        },
      ],
      ...NO_HARDCODED_HEX_RULE,
    },
  },
  {
    files: HEX_COLOR_GRANDFATHERED_FILES,
    rules: {
      "no-restricted-syntax": "off",
    },
  },
]);
