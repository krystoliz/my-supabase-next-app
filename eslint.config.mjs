// eslint.config.mjs
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // Add a new configuration object for TypeScript files
  {
    files: ["**/*.ts", "**/*.tsx"], // Target only TypeScript and TSX files
    rules: {
      // Disable the base ESLint no-unused-vars rule to avoid conflicts
      "no-unused-vars": "off",
      // Configure the TypeScript-specific no-unused-vars rule
      "@typescript-eslint/no-unused-vars": [
        "warn", // You can change this to "error" if you want unused vars to break the build
        {
          "argsIgnorePattern": "^_", // Ignore parameters that start with _
          "varsIgnorePattern": "^_", // Optionally ignore variables that start with _
          "caughtErrorsIgnorePattern": "^_", // Optionally ignore caught errors that start with _
        },
      ],
    },
  },
];

export default eslintConfig;