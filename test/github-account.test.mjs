import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  writeFileSync,
  mkdirSync,
  readFileSync,
  rmSync,
  existsSync,
  statSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { githubAccount } from "../src/github-account.ts";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function wait(account, owner, condition) {
  for (let i = 0; i < 200; i++) {
    const v = account.view(owner);
    if (condition(v)) return v;
    await sleep(10);
  }
  throw Error("timeout");
}
test("GitHub device sign-in is owner-bound, serial, sanitized and keeps prior credentials on cancellation", async () => {
  const root = mkdtempSync(join(tmpdir(), "gh-account-")),
    bin = join(root, "gh"),
    profile = join(root, "private");
  const owner = "a".repeat(64);
  writeFileSync(
    bin,
    `#!${process.execPath}\nconsole.log('First copy your one-time code: ABCD-1234');console.error('secret-value https://evil.example');setInterval(()=>{},1000);`,
    { mode: 0o700 },
  );
  const account = githubAccount(profile, bin);
  try {
    mkdirSync(join(profile, "profile"), { recursive: true });
    writeFileSync(join(profile, "profile/hosts.yml"), "existing");
    assert.deepEqual(account.view(owner).access, {
      level: "repositories",
      configured: false,
      valid: true,
    });
    account.start(owner, "repositories");
    let v = await wait(account, owner, (v) => v.session?.code);
    assert.equal(v.session.url, "https://github.com/login/device");
    assert.equal(account.view("b".repeat(64)).session, null);
    assert.ok(!JSON.stringify(v).includes("secret-value"));
    assert.throws(() => account.start(owner, "repositories"), /progress/);
    assert.throws(() => account.cancel("b".repeat(64), v.session.id), /not found/);
    account.cancel(owner, v.session.id);
    v = await wait(account, owner, (v) => !v.busy);
    assert.equal(v.session.state, "cancelled");
    assert.equal(v.session.code, null);
    assert.equal(readFileSync(join(profile, "profile/hosts.yml"), "utf8"), "existing");
    account.logout();
    assert.equal(account.view(owner).connected, false);
  } finally {
    await account.close();
    rmSync(root, { recursive: true, force: true });
  }
});
test("GitHub successful native login publishes private files; failed login preserves them", async () => {
  const root = mkdtempSync(join(tmpdir(), "gh-save-")),
    bin = join(root, "gh"),
    profile = join(root, "private"),
    owner = "a".repeat(64);
  writeFileSync(
    bin,
    `#!${process.execPath}\nrequire('fs').writeFileSync(process.env.GH_CONFIG_DIR+'/hosts.yml','fixture-credential');`,
    { mode: 0o700 },
  );
  const account = githubAccount(profile, bin);
  try {
    account.start(owner, "publish");
    let v = await wait(account, owner, (v) => !v.busy);
    assert.equal(v.session.state, "succeeded");
    assert.equal(v.connected, true);
    assert.equal(statSync(join(profile, "profile/hosts.yml")).mode & 0o777, 0o600);
    assert.ok(!JSON.stringify(v).includes("fixture-credential"));
    writeFileSync(bin, `#!${process.execPath}\nprocess.exit(1);`, { mode: 0o700 });
    account.start(owner, "publish");
    v = await wait(account, owner, (v) => !v.busy);
    assert.equal(v.session.state, "failed");
    assert.equal(
      readFileSync(join(profile, "profile/hosts.yml"), "utf8"),
      "fixture-credential",
    );
  } finally {
    await account.close();
    rmSync(root, { recursive: true, force: true });
  }
});

test("restart discards an obsolete profile backup so logout cannot restore it", async () => {
  const root = mkdtempSync(join(tmpdir(), "gh-recovery-"));
  try {
    for (const dir of ["profile", "previous"]) {
      mkdirSync(join(root, dir));
      writeFileSync(join(root, dir, "hosts.yml"), "fixture");
    }
    let account = githubAccount(root);
    assert.equal(existsSync(join(root, "previous")), false);
    account.logout();
    await account.close();
    account = githubAccount(root);
    assert.equal(account.view("a".repeat(64)).connected, false);
    await account.close();
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("ownerless status is safe before, during and after sign-in and never returns a device session", async () => {
  const root = mkdtempSync(join(tmpdir(), "gh-ownerless-")),
    bin = join(root, "gh"),
    owner = "a".repeat(64);
  writeFileSync(
    bin,
    `#!${process.execPath}\nconsole.log('ABCD-1234');setInterval(()=>{},1000);`,
    { mode: 0o700 },
  );
  const account = githubAccount(join(root, "profile"), bin);
  try {
    let status = account.view();
    assert.equal(status.installed, true);
    assert.equal(status.connected, false);
    assert.equal(status.busy, false);
    assert.equal(status.session, null);
    assert.deepEqual(status.authorization.providerGrant, ["repo", "read:org", "gist"]);
    account.start(owner, "repositories");
    const active = await wait(account, owner, (v) => v.session?.code);
    status = account.view();
    assert.equal(status.busy, true);
    assert.equal(status.session, null);
    account.cancel(owner, active.session.id);
    await wait(account, owner, (v) => !v.busy);
    status = account.view();
    assert.equal(status.busy, false);
    assert.equal(status.session, null);
  } finally {
    await account.close();
    rmSync(root, { recursive: true, force: true });
  }
});

test("GitHub access ceiling persists and rejects higher-authority profiles", async () => {
  const root = mkdtempSync(join(tmpdir(), "gh-access-")),
    bin = join(root, "gh"),
    profile = join(root, "private"),
    owner = "a".repeat(64);
  writeFileSync(
    bin,
    `#!${process.execPath}\nrequire('fs').writeFileSync(process.env.GH_CONFIG_DIR+'/hosts.yml','fixture-credential');`,
    { mode: 0o700 },
  );
  let account = githubAccount(profile, bin);
  try {
    assert.throws(() => account.start(owner, "invalid"), /supported GitHub access/);
    account.start(owner, "feedback");
    await wait(account, owner, (v) => !v.busy);
    assert.deepEqual(account.view(owner).access, {
      level: "feedback",
      configured: true,
      valid: true,
    });
    assert.equal(account.profile("repositories"), join(profile, "profile"));
    assert.equal(account.profile("feedback"), join(profile, "profile"));
    assert.throws(() => account.profile("publish"), /does not allow publishing/);
    await account.close();
    account = githubAccount(profile, bin);
    assert.equal(account.view(owner).access.level, "feedback");
    assert.throws(() => account.profile("publish"), /does not allow publishing/);
    writeFileSync(join(profile, "profile/agentd-access.json"), "not-json");
    assert.equal(account.view(owner).access.valid, false);
    assert.throws(() => account.profile("repositories"), /policy is invalid/);
  } finally {
    await account.close();
    rmSync(root, { recursive: true, force: true });
  }
});
