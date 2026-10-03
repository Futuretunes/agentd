import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));

test("module-relative paths survive checkouts whose path contains spaces", () => {
  assert.equal(
    fileURLToPath(new URL("file:///srv/My%20Checkout/src/x.ts")),
    "/srv/My Checkout/src/x.ts",
  );
  // URL.pathname keeps percent-encoding, which breaks spawned helpers and file reads.
  const offenders = [];
  for (const dir of ["src", "scripts", "test"])
    for (const name of readdirSync(join(root, dir)))
      if (/\.(m?js|ts)$/.test(name)) {
        const text = readFileSync(join(root, dir, name), "utf8");
        if (/import\.meta\.url\)\.pathname/.test(text)) offenders.push(`${dir}/${name}`);
      }
  assert.deepEqual(offenders, []);
});
