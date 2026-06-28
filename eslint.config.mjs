import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...compat.extends("next/core-web-vitals"),
  {
    rules: {
      // Allow JSX in files with .tsx extension (Next.js convention)
      "@next/next/no-img-element": "off",
    },
  },
];
