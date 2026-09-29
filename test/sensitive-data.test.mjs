import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  sensitiveFilename,
  sensitiveContent,
  binaryNumstat,
  contentScan,
  acceptBlob,
} from "../src/sensitive-data.ts";
import { snapshot, commitSnapshot } from "../src/changes.ts";
const credential = () => ["gh", "p_", "aB3dE6gH9jK2mN5pQ8sT1vW4xY7zA0bC3dE6"].join("");
test("shared sensitive-data rules cover credential paths and known signatures without returning values", () => {
  for (const path of [
    ".env",
    ".env.example",
    ".npmrc",
    "nested/.netrc",
    ".git-credentials",
    "id_ecdsa",
    "nested/key.p12",
    ".pypirc",
    ".aws/credentials",
    "x/.aws/config",
    "id_ed25519.pub",
  ])
    assert.equal(sensitiveFilename(path), true, path);
  for (const path of ["README.md", "src/key.ts", "public/environment.js"])
    assert.equal(sensitiveFilename(path), false, path);
  assert.deepEqual(sensitiveContent(credential()), ["provider credential"]);
  assert.deepEqual(
    sensitiveContent(["-----BEGIN ", "OPENSSH PRIVATE KEY-----"].join("")),
    ["private key"],
  );
  assert.deepEqual(
    sensitiveContent(
      'api_key="' + ["AbCdEfGh", "12345678", "IjKlMnOp", "90123456"].join("") + '"',
    ),
    ["credential assignment"],
  );
  assert.deepEqual(
    sensitiveContent('api_key="example_placeholder_that_is_not_a_secret"'),
    [],
  );
  assert.equal(binaryNumstat("2\t1\tBinary files documentation.txt\0"), false);
  assert.equal(binaryNumstat("-\t-\tphoto.png\0"), true);
  assert.throws(() => acceptBlob(contentScan(), "a", "1048577"), /size limit/);
});
test("review scans both exact blobs, withholds suspect patches, and classifies actual binary metadata", () => {
  assert.throws(
    () => commitSnapshot("/nonexistent", "a", "b", "c", credential()),
    /credential content/,
  );
  const repo = mkdtempSync(join(tmpdir(), "sensitive-review-"));
  const state = mkdtempSync(join(tmpdir(), "sensitive-state-"));
  const git = (args) =>
    execFileSync("/usr/bin/git", ["-C", repo, ...args], {
      encoding: "utf8",
      stdio: "pipe",
    }).trim();
  try {
    git(["init", "-b", "main"]);
    git(["config", "user.name", "test"]);
    git(["config", "user.email", "test@localhost"]);
    writeFileSync(join(repo, "README.md"), "base");
    git(["add", "."]);
    git(["commit", "-m", "initial"]);
    const head = git(["rev-parse", "HEAD"]);
    writeFileSync(join(repo, "README.md"), "Binary files are explained here.\n");
    let review = snapshot(repo, head, state);
    assert.deepEqual(review.blocked, []);
    assert.match(review.patch, /Binary files are explained/);
    writeFileSync(join(repo, "README.md"), credential());
    review = snapshot(repo, head, state);
    assert.ok(review.blocked.length);
    assert.ok(!JSON.stringify(review).includes(credential()));
    git(["add", "README.md"]);
    git(["commit", "-m", "fixture"]);
    const secretHead = git(["rev-parse", "HEAD"]);
    writeFileSync(join(repo, "README.md"), "removed");
    review = snapshot(repo, secretHead, state);
    assert.ok(review.blocked.length);
    assert.ok(!review.patch.includes(credential()));
    writeFileSync(join(repo, "README.md"), "removed");
    git(["add", "."]);
    git(["commit", "-m", "clean"]);
    const clean = git(["rev-parse", "HEAD"]);
    writeFileSync(join(repo, "image.bin"), Buffer.from([0, 1, 2]));
    review = snapshot(repo, clean, state);
    assert.ok(review.blocked.some((v) => v.includes("binary")));
  } finally {
    rmSync(repo, { recursive: true, force: true });
    rmSync(state, { recursive: true, force: true });
  }
});
