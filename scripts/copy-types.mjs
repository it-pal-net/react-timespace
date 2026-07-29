// Puts the hand-authored declarations next to the bundle vite emits.
//
// The tarball ships `dist/` and nothing else (see `files` in package.json), and
// vite bundles the two entry points flat: dist/index.js and
// dist/theme-config.js. So each entry's .d.ts is copied to the matching flat
// name. Both source files are written to survive that move — index.d.ts is
// self-contained, and theme-config/index.d.ts imports only from `react` and
// `@emotion/react`, never through a relative path into the package.
//
// The other .d.ts files in the tree (theming/, state/, tzOptions.d.ts) type the
// source-only subpaths for linked checkouts. They resolve as siblings of the
// sources they describe and are not part of the tarball.

import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = resolve(root, "dist");

const entries = [
  ["index.d.ts", "index.d.ts"],
  ["theme-config/index.d.ts", "theme-config.d.ts"],
];

mkdirSync(dist, { recursive: true });

for (const [from, to] of entries) {
  const source = resolve(root, from);
  if (!existsSync(source)) {
    throw new Error(`copy-types: missing ${from}`);
  }
  copyFileSync(source, resolve(dist, to));
  console.log(`copy-types: ${from} -> dist/${to}`);
}
