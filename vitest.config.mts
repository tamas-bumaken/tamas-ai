import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    alias: {
      "@/": new URL("./src/", import.meta.url).pathname,
      // Next.js resolves "server-only" from its own bundle; outside Next it is a no-op guard.
      "server-only": new URL(
        "./node_modules/next/dist/compiled/server-only/empty.js",
        import.meta.url,
      ).pathname,
    },
  },
});
