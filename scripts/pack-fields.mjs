// Swaps the source entry points for the built ones while npm packs a tarball.
//
// npm does NOT apply publishConfig field overrides — it only reads npm *config*
// keys (registry, tag, access) from there, and npm 12 warns that anything else
// "will stop working". Left alone, the tarball would ship
// `"exports": { ".": "./index.js" }` with nothing but dist/ inside it, so every
// import from the registry would throw ERR_MODULE_NOT_FOUND.
//
// So the committed package.json keeps pointing at the sources (a linked
// checkout and demo/ resolve without a build step), and this hoists
// publishConfig into the real fields for the duration of the pack:
//
//   npm publish -> prepublishOnly -> prepack -> tarball -> postpack -> upload
//
// postpack runs before the upload, so the swapped file never outlives the pack.
// The backup is restored byte-for-byte; if a run is interrupted between the two
// hooks, `node scripts/pack-fields.mjs restore` (or git checkout) undoes it.

import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pkgPath = resolve(root, "package.json");
const backupPath = resolve(root, "package.json.pack-backup");

// These are genuine npm config keys and belong to npm, not to the manifest.
const NPM_CONFIG_KEYS = new Set([
  "access",
  "provenance",
  "registry",
  "tag",
]);

const apply = () => {
  const original = readFileSync(pkgPath, "utf8");
  const pkg = JSON.parse(original);
  const overrides = Object.entries(pkg.publishConfig ?? {}).filter(
    ([key]) => !NPM_CONFIG_KEYS.has(key),
  );

  if (overrides.length === 0) {
    console.log("pack-fields: no publishConfig field overrides, nothing to do");
    return;
  }
  if (existsSync(backupPath)) {
    throw new Error(
      `pack-fields: ${backupPath} already exists — a previous pack did not ` +
        "restore. Run `node scripts/pack-fields.mjs restore` first.",
    );
  }

  writeFileSync(backupPath, original);

  for (const [key, value] of overrides) {
    pkg[key] = value;
    delete pkg.publishConfig[key];
  }
  if (Object.keys(pkg.publishConfig).length === 0) delete pkg.publishConfig;

  writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
  console.log(
    `pack-fields: packing with ${overrides
      .map(([key]) => key)
      .join(", ")} from publishConfig`,
  );
};

const restore = () => {
  if (!existsSync(backupPath)) {
    console.log("pack-fields: no backup to restore");
    return;
  }
  writeFileSync(pkgPath, readFileSync(backupPath, "utf8"));
  rmSync(backupPath);
  console.log("pack-fields: restored the source entry points");
};

const mode = process.argv[2];
if (mode === "apply") apply();
else if (mode === "restore") restore();
else {
  console.error("usage: node scripts/pack-fields.mjs apply|restore");
  process.exit(1);
}
