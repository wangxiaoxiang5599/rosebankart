import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  ...nextVitals,
  {
    rules: {
      "@next/next/no-img-element": "off",
    },
  },
  globalIgnores([".next/**", ".next-build/**", ".open-next/**", "next-env.d.ts"]),
]);
