import js from "@eslint/js";
import tseslint from "typescript-eslint";
import importPlugin from "eslint-plugin-import";
import checkFile from "eslint-plugin-check-file";

export default[
  // ---------------------------------------------------------------------------
  // 1. GLOBAL IGNORES
  // ---------------------------------------------------------------------------
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/dist/**",
      "**/build/**",
      "**/out/**",
      "**/.turbo/**",
      "**/.vercel/**",
      "**/coverage/**",
      "**/*.tsbuildinfo",
      "**/next-env.d.ts",

      // env
      "**/.env",
      "**/.env.*",

      // lock files
      "**/pnpm-lock.yaml",
      "**/yarn.lock",
      "**/package-lock.json",

      // test config
      "**/jest.config.js",
      "**/jest.setup.js",
      "**/playwright.config.ts",
      "**/e2e/**",

      // misc
      "**/.DS_Store",
      "**/*.pem",
    ],
  },

  // ---------------------------------------------------------------------------
  // 2. BASE CONFIGS
  // ---------------------------------------------------------------------------
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // ---------------------------------------------------------------------------
  // 3. TYPESCRIPT (SAFE PROJECT MODE)
  // ---------------------------------------------------------------------------
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.eslint.json",
      },
    },
  },

  // ---------------------------------------------------------------------------
  // 4. ARCHITECTURAL + NAMING RULES
  // ---------------------------------------------------------------------------
  {
    plugins: {
      import: importPlugin,
      "check-file": checkFile,
    },

    rules: {
      // =====================================================================
      // IMPORT BOUNDARIES (CLEAN ARCHITECTURE)
      // =====================================================================
      "import/no-restricted-paths": [
        "error",
        {
          zones: [
            {
              target: "./src/app",
              from: "./src/modules",
              message:
                "Architectural Violation: App layer must not be imported by modules.",
            },
            {
              target: "./src/components",
              from: "./src/modules",
              message:
                "Architectural Violation: UI components must be dumb. Do not import modules.",
            },
            {
              target: "./src/components",
              from: "./src/lib",
              message:
                "Architectural Violation: UI components must not import technical adapters.",
            },
            {
              target: "./src/modules/*/domain",
              from: "./src/modules/*/infrastructure",
              message:
                "Architectural Violation: Domain must not depend on infrastructure.",
            },
            {
              target: "./src/modules/*/domain",
              from: "./src/lib",
              message:
                "Architectural Violation: Domain must have zero external dependencies.",
            },
            {
              target: "./src/modules/*/domain",
              from: "./src/app",
              message:
                "Architectural Violation: Domain must not depend on App layer.",
            },
          ],
        },
      ],

      // // =====================================================================
      // // FILE NAMING
      // // =====================================================================
      // "check-file/filename-naming-convention": [
      //   "error",
      //   {
      //     "src/modules/**": "KEBAB_CASE",

      //     "src/components/views/*-view.tsx": "KEBAB_CASE",
      //     "src/components/dialogs/*-dialog.tsx": "KEBAB_CASE",

      //     "src/hooks/use-*.ts": "KEBAB_CASE",
      //     "src/providers/*-provider.tsx": "KEBAB_CASE",
      //   },
      // ],

      // // =====================================================================
      // // FOLDER NAMING (DOC-CORRECT)
      // // =====================================================================
      // "check-file/folder-naming-convention": [
      //   "error",
      //   {
      //     // Next.js App Router (supports [], (), [[...]], @slots)
      //     "src/app/**/": "NEXT_JS_APP_ROUTER_CASE",

      //     // Modules
      //     "src/modules/*/": "KEBAB_CASE",
      //     "src/modules/*/domain/": "FLAT_CASE",
      //     "src/modules/*/application/": "FLAT_CASE",
      //     "src/modules/*/infrastructure/": "FLAT_CASE",

      //     // UI + infra
      //     "src/components/*/": "KEBAB_CASE",
      //     "src/lib/*/": "KEBAB_CASE",
//       //     "src/hooks/*/": "KEBAB_CASE",
//       //     "src/providers/*/": "KEBAB_CASE",
//       //   },
//         {
//           errorMessage:
//             'Folder "{{ target }}" does not match the "{{ pattern }}" naming convention.',
//           ignoreWords: ["__tests__", "__mocks__"],
//         },
//       ],
//     },
//   }
// ];
    },
  },
];