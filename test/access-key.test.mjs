import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { accessKeyHash, accessKeyMatches, validateAccessKey } from "../src/access-key.ts";
import { handleAdminRequest, rotateAccessFile } from "../src/admin-helper.ts";

test("access keys are strongly validated and compared by digest", () => {
  const key = "correct-horse-battery-staple-8391";
  assert.equal(validateAccessKey(key), key);
  assert.equal(accessKeyMatches(key, accessKeyHash(key)), true);
  assert.equal(accessKeyMatches("wrong", accessKeyHash(key)), false);
  for (const weak of ["short", "a".repeat(24), "spaces are not accepted even when long"])
    assert.throws(() => validateAccessKey(weak));
});

test("administration helper accepts only fixed service restart requests", () => {
  const restarted = [];
  const run = (target) => {
    restarted.push(target);
    return { restarted: true, target };
  };
  assert.deepEqual(
    handleAdminRequest(
      { op: "service-restart", target: "gateway" },
      { mobileConfig: "/unused", restart: run },
    ),
    { restarted: true, target: "gateway" },
  );
  assert.deepEqual(restarted, ["gateway"]);
  for (const input of [
    { op: "service-restart", target: "admin" },
    { op: "service-restart", target: "runner", unit: "agentd.service" },
  ])
    assert.throws(() => handleAdminRequest(input, { mobileConfig: "/unused" }));
});

test("administration helper accepts only its fixed diagnostic request", () => {
  const result = { format: 1, generatedAt: "fixture" };
  assert.equal(
    handleAdminRequest(
      { op: "diagnostics" },
      { mobileConfig: "/unused", diagnostics: () => result },
    ),
    result,
  );
  for (const input of [
    { op: "diagnostics", command: "id" },
    { op: "diagnostics", path: "/etc/shadow" },
    { op: "journal" },
  ])
    assert.throws(() =>
      handleAdminRequest(input, {
        mobileConfig: "/unused",
        diagnostics: () => result,
      }),
    );
});

test("fixed-purpose helper atomically replaces only the root-owned access digest", () => {
  const root = mkdtempSync(join(tmpdir(), "agentd-access-")),
    path = join(root, "mobile.json"),
    oldKey = "existing-access-key-for-the-fixture",
    newKey = "new-access-key-for-the-fixture-8391";
  try {
    writeFileSync(
      path,
      JSON.stringify({ accessHash: accessKeyHash(oldKey), origin: "https://fixture" }) +
        "\n",
      { mode: 0o640 },
    );
    const owner = process.getuid();
    assert.throws(() => rotateAccessFile(path, "wrong", accessKeyHash(newKey), owner));
    // Rotate under the helper's own umask: the original mode must survive.
    const previousUmask = process.umask(0o077);
    try {
      rotateAccessFile(path, oldKey, accessKeyHash(newKey), owner);
    } finally {
      process.umask(previousUmask);
    }
    const value = JSON.parse(readFileSync(path, "utf8"));
    assert.equal(value.accessHash, accessKeyHash(newKey));
    assert.equal(value.origin, "https://fixture");
    assert.ok(!readFileSync(path, "utf8").includes(newKey));
    assert.equal(statSync(path).mode & 0o777, 0o640);
    const link = join(root, "link.json");
    symlinkSync(path, link);
    assert.throws(() => rotateAccessFile(link, newKey, accessKeyHash(oldKey), owner));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
