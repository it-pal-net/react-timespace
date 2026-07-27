import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Everything in `dependencies` + `peerDependencies` stays external so the
// consumer's app resolves a single copy of React/Emotion instead of getting a
// second one baked into this bundle.
const external =
  /^(react|react-dom|@emotion\/[^/]+|lucide-react|prop-types|react-colorful)(\/.*)?$/;

export default defineConfig({
  plugins: [react()],
  build: {
    target: "es2020",
    sourcemap: true,
    // Libraries ship readable code; the consuming app minifies.
    minify: false,
    lib: {
      entry: {
        index: "index.js",
        "theme-config": "theme-config/index.js",
      },
      // ESM only. A CJS build would have to go through Rolldown's Node-mode
      // interop, which resolves `import styled from "@emotion/styled"` to the
      // module record instead of the styled function and throws on import.
      // Bundlers all take ESM, and `require()` handles it from Node 22.12.
      formats: ["es"],
      fileName: (_format, name) => `${name}.js`,
    },
    rollupOptions: {
      external,
      output: {
        // The whole library is client-side (hooks, context, pointer events),
        // so flag it for React Server Component consumers (Next.js App Router).
        banner: '"use client";',
      },
    },
  },
});
