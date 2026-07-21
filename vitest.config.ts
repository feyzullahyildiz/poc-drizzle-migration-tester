import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@test": path.resolve(__dirname, "test"),
    },
  },
  server: {
    watch: {
      usePolling: true,
    },
  },
  test: {
    globals: true,
    forceRerunTriggers: ["**/src/drizzle/**"],
  },
});
