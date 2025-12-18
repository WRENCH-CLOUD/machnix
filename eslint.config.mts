import js from "@eslint/js";
import tseslint from "typescript-eslint";
import importPlugin from "eslint-plugin-import";
import checkFile from "eslint-plugin-check-file";

export default tseslint.config(
  // 1. GLOBAL IGNORES
  {
    ignores: [
      "**/node_modules/**",
      "**/.pnp/**",
      "**/.pnp.js",
      "**/coverage/**",
      "**/.next/**",
      "**/out/**",
      "**/build/**",
      "**/dist/**",
      "**/.DS_Store",
      "**/*.pem",
      "**/npm-debug.log*",
      "**/pnpm-lock.log",
      "**/pnpm-debug.log*",
      "**/yarn-lock.log",
      "**/yarn-debug.log*",
      "**/yarn-error.log*",
      "**/.env.local",
      "**/.env",
      "**/.env.development.local",
      "**/.env.test.local",
      "**/.env.production.local",
      "**/.turbo/**",
      "**/.vercel/**",
      "**/*.tsbuildinfo",
      "**/next-env.d.ts",
      "**/supabase/.temp/**",
      "**/supabase/.branches/**",
      "**/*.config.js",
      "**/*.config.mjs",
    ],
  },

  // 2. Base Setup
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // 3. TypeScript specific settings
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
  },

  // 4. Architectural Boundary Enforcement
  {
    plugins: {
      import: importPlugin,
      "check-file": checkFile,
    },
    rules: {
      "import/no-restricted-paths": [
        "error",
        {
          zones: [
            { target: "./src/modules", from: "./src/app", message: "Architectural Violation: Modules cannot import from the App layer." },
            { target: "./src/components", from: "./src/modules", message: "Architectural Violation: UI components must be dumb. Do not import modules." },
            { target: "./src/components", from: "./src/lib", message: "Architectural Violation: UI components should not import technical adapters (lib/)." },
            { 
              target: "./src/modules/*/domain", 
              from: "./src/modules/*/infrastructure", 
              message: "Architectural Violation: Domain entities must be pure. Infrastructure imports are forbidden." 
            },
            { 
              target: "./src/modules/*/domain", 
              from: "./src/lib", 
              message: "Architectural Violation: Domain must have zero dependencies (no lib/ imports)." 
            },
          ],
        },
      ],
      "check-file/filename-naming-convention": [
        "error",
        {
          "src/modules/**": "KEBAB_CASE",
          "src/components/views/*-view.tsx": "KEBAB_CASE",
          "src/components/dialogs/*-dialog.tsx": "KEBAB_CASE",
        },
      ],
      "check-file/folder-naming-convention": [
        "error",
        {
          "src/modules/*": "KEBAB_CASE",
          "src/modules/*/domain": "LOWER_CASE",
          "src/modules/*/application": "LOWER_CASE",
          "src/modules/*/infrastructure": "LOWER_CASE",
        },
      ],
    },
  }
);