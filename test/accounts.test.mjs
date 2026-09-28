import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  rmSync,
  existsSync,
  symlinkSync,
  readdirSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { accounts, loginDetails, saveLogin } from "../src/accounts.ts";
const owner = "a".repeat(64),
  other = "b".repeat(64);
const url =
  "https://claude.com/cai/oauth/authorize?response_type=code&redirect_uri=https%3A%2F%2Fplatform.claude.com%2Foauth%2Fcode%2Fcallback&state=fixture&code_challenge=fixture&code_challenge_method=S256";
const wait = async (fn) => {
  for (let i = 0; i < 300; i++) {
    if (fn()) return;
    await new Promise((r) => setTimeout(r, 10));
  }
  throw Error("Timeout");
};
function fixture(script, options = {}) {
  const root = mkdtempSync(join(tmpdir(), "account-flow-")),
    home = join(root, "home");
  mkdirSync(home);
  let changes = 0;
  const app = accounts({
    root: join(root, "sessions"),
    home,
    command: () => [process.execPath, ["-e", script]],
    probe: async () => ({
      state: "signed_in",
      method: "Claude subscription",
      checkedAt: new Date().toISOString(),
      message: "Account is signed in",
    }),
    changed: () => changes++,
    ...options,
  });
  return {
    root,
    home,
    app,
    changes: () => changes,
    async close() {
      await app.close();
      rmSync(root, { recursive: true, force: true });
    },
  };
}
test("login output only exposes fixed provider URLs and one-time device codes", () => {
  assert.equal(loginDetails("claude", url + "\nPaste code here >").needsCode, true);
  for (const bad of [
    url.replace("claude.com", "claude.com.evil.test"),
    url.replace("https://claude.com", "https://user@claude.com"),
    url.replace("platform.claude.com", "evil.test"),
    url.replace("https:", "http:"),
    url.replace("/cai/oauth/authorize", "/unexpected"),
  ])
    assert.equal(loginDetails("claude", bad).url, null);
  assert.deepEqual(
    loginDetails(
      "codex",
      "https://auth.openai.com/codex/device\nABCD-EFGHI\nBearer secret",
    ),
    { url: "https://auth.openai.com/codex/device", code: "ABCD-EFGHI", needsCode: false },
  );
  assert.equal(
    loginDetails("codex", "https://auth.openai.com/codex/device?token=secret").url,
    null,
  );
});
test("login is owner-bound, serial and publishes verified credentials without output or codes", async () => {
  const script = `const fs=require('fs'),p=require('path');console.log(${JSON.stringify(url)});console.log('Paste code here >');process.stdin.once('data',()=>{fs.mkdirSync(p.join(process.env.HOME,'.claude'),{recursive:true});fs.writeFileSync(p.join(process.env.HOME,'.claude/.credentials.json'),JSON.stringify({claudeAiOauth:{accessToken:'fixture-access',refreshToken:'fixture-refresh'}}));console.log('private@example.test');process.exit(0);});`;
  const f = fixture(script);
  try {
    writeFileSync(
      join(f.home, ".claude.json"),
      JSON.stringify({
        theme: "dark",
        oauthAccount: { emailAddress: "old@example.test" },
      }),
    );
    const s = f.app.start(owner, "claude", "login");
    assert.equal(f.app.busy(), true);
    assert.equal(f.app.view(other), null);
    assert.throws(() => f.app.start(other, "codex", "login"), /progress/);
    await wait(() => f.app.view(owner).needsCode);
    assert.throws(() => f.app.submit(other, s.id, "valid-code"), /not found/);
    assert.throws(() => f.app.submit(owner, s.id, "bad\ninput"), /Paste/);
    f.app.submit(owner, s.id, "valid-code");
    await wait(() => !f.app.busy());
    assert.equal(f.app.view(owner).state, "succeeded");
    assert.equal(f.changes(), 1);
    assert.match(
      readFileSync(join(f.home, ".claude/.credentials.json"), "utf8"),
      /fixture-access/,
    );
    assert.deepEqual(JSON.parse(readFileSync(join(f.home, ".claude.json"), "utf8")), {
      theme: "dark",
    });
    const publicView = JSON.stringify(f.app.view(owner));
    for (const secret of [
      "fixture-access",
      "fixture-refresh",
      "private@",
      "valid-code",
      url,
    ])
      assert.ok(!publicView.includes(secret));
    assert.deepEqual(readdirSync(join(f.root, "sessions")), []);
  } finally {
    await f.close();
  }
});
test("failed, cancelled and expired sign-ins preserve existing credentials and release locks", async () => {
  for (const kind of ["failed", "cancelled", "expired"]) {
    const f = fixture(kind === "failed" ? "process.exit(1)" : "setInterval(()=>{},100)", {
      timeoutMs: kind === "expired" ? 50 : 10000,
    });
    mkdirSync(join(f.home, ".claude"));
    writeFileSync(join(f.home, ".claude/.credentials.json"), "old credentials");
    try {
      const s = f.app.start(owner, "claude", "login");
      if (kind === "cancelled") f.app.cancel(owner, s.id);
      await wait(() => !f.app.busy());
      assert.equal(f.app.view(owner).state, kind);
      assert.equal(
        readFileSync(join(f.home, ".claude/.credentials.json"), "utf8"),
        "old credentials",
      );
      assert.deepEqual(readdirSync(join(f.root, "sessions")), []);
    } finally {
      await f.close();
    }
  }
});
test("credential publishing refuses symlinks, malformed JSON and API credentials", () => {
  const root = mkdtempSync(join(tmpdir(), "credential-copy-")),
    source = join(root, "source"),
    target = join(root, "target");
  mkdirSync(join(source, ".codex"), { recursive: true });
  mkdirSync(target);
  try {
    const file = join(source, ".codex/auth.json");
    writeFileSync(file, JSON.stringify({ OPENAI_API_KEY: "fixture" }));
    assert.throws(() => saveLogin("codex", source, target), /Subscription/);
    rmSync(file);
    symlinkSync("/etc/passwd", file);
    assert.throws(() => saveLogin("codex", source, target), /Invalid/);
    rmSync(file);
    writeFileSync(file, "not json");
    assert.throws(() => saveLogin("codex", source, target));
    assert.equal(existsSync(join(target, ".codex/auth.json")), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
test("logout verifies native signed-out result and shutdown cancels pending login", async () => {
  const f = fixture("process.exit(0)", {
    probe: async () => ({
      state: "signed_out",
      method: null,
      checkedAt: null,
      message: "Sign-in required",
    }),
  });
  try {
    f.app.start(owner, "claude", "logout");
    await wait(() => !f.app.busy());
    assert.equal(f.app.view(owner).state, "succeeded");
    assert.ok(existsSync(f.home));
  } finally {
    await f.close();
  }
  const pending = fixture("setInterval(()=>{},100)");
  pending.app.start(owner, "codex", "login");
  await pending.app.close();
  assert.equal(pending.app.busy(), false);
  assert.equal(pending.app.view(owner).state, "cancelled");
  await pending.close();
});
