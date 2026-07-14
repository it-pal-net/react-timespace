import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Relative base so the build works on GitHub Pages project sites.
  base: "./",
  plugins: [
    react({
      jsxImportSource: "@emotion/react",
    }),
  ],
  resolve: {
    alias: {
      "react-timespace": resolve(__dirname, ".."),
    },
    // The package sources live one level up; force their bare imports to
    // resolve to the demo's node_modules so there is exactly one copy of
    // react/emotion in the bundle.
    dedupe: [
      "react",
      "react-dom",
      "@emotion/react",
      "@emotion/styled",
      "prop-types",
      "lucide-react",
    ],
  },
  server: {
    fs: {
      allow: [resolve(__dirname, "..")],
    },
  },
});
