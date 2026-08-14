import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import noHardcodedColors from "./eslint/no-hardcoded-colors.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      ".open-next/**",
      ".vercel/**",
      ".wrangler/**",
      "dist/**",
      "build/**",
      "*.config.js",
      "*.config.mjs",
      "*.config.ts"
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  // Custom rule: prevent hardcoded Tailwind color classes (warn during migration)
  {
    plugins: {
      custom: {
        rules: {
          "no-hardcoded-colors": noHardcodedColors,
        },
      },
    },
    rules: {
      "custom/no-hardcoded-colors": "warn",
    },
  },
];

export default eslintConfig;
