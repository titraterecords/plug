import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/tests/e2e/**/*.test.ts"],
    restoreMocks: true,
    fileParallelism: false,
    testTimeout: 120000,
  },
});
