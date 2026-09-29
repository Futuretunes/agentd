import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  rmSync,
  readFileSync,
  writeFileSync,
  existsSync,
  symlinkSync,
  statSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { renewals, renewalFailure } from "../src/renewal.ts";
import {
  durableJSON,
  readCredentials,
  credentialFile,
  fingerprint,
  workerCredentials,
} from "../src/credentials.ts";
import { nativeRenewal } from "../src/native-renewal.ts";
const token = (suffix, expiry = Date.now() + 3600000) => ({
  claudeAiOauth: {
    accessToken: "secret-access-" + suffix,
    refreshToken: "secret-refresh-" + suffix,
    expiresAt: expiry,
    scopes: ["user:profile", "user:inference"],
  },
});
function fixture(renew) {
  const base = mkdtempSync(join(tmpdir(), "renewal-")),
    home = join(base, "home"),
    root = join(base, "renewal"),
    stateDir = join(base, "state");
  mkdirSync(home);
  mkdirSync(stateDir);
  const config = { home, root, stateDir, renew };
  return {
    base,
    home,
    root,
    config,
    app: renewals(config),
    save: (v) => durableJSON(join(home, credentialFile("claude")), v),
    async close() {
      await this.app.close();
      rmSync(base, { recursive: true, force: true });
    },
  };
}
test("renewal is serialized, durable, sanitized and skips healthy sessions", async () => {
  let calls = 0,
    release;
  const f = fixture(async (id, profile) => {
    calls++;
    await new Promise((r) => (release = r));
    durableJSON(join(profile, credentialFile(id)), token("new"));
  });
  try {
    f.save(token("old", 0));
    const pending = f.app.ensure("claude");
    await new Promise((r) => setImmediate(r));
    assert.equal(f.app.busy(), true);
    assert.equal(f.app.view("claude").state, "renewing");
    await assert.rejects(f.app.ensure("claude"), /busy/);
    release();
    await pending;
    assert.equal(
      readCredentials(f.home, "claude").claudeAiOauth.refreshToken,
      "secret-refresh-new",
    );
    assert.equal(statSync(join(f.home, credentialFile("claude"))).mode & 0o777, 0o600);
    await f.app.ensure("claude");
    assert.equal(calls, 1);
    assert.ok(!JSON.stringify(f.app.view("claude")).includes("secret"));
    assert.equal(existsSync(join(f.root, "claude")), false);
  } finally {
    await f.close();
  }
});
test("rotation saved before native failure survives and is never replaced by the old token", async () => {
  const f = fixture(async (id, profile) => {
    durableJSON(join(profile, credentialFile(id)), token("rotated"));
    throw Error("secret diagnostic");
  });
  try {
    f.save(token("old", 0));
    await assert.rejects(f.app.ensure("claude"), (e) => e.message === renewalFailure);
    assert.equal(
      readCredentials(f.home, "claude").claudeAiOauth.refreshToken,
      "secret-refresh-rotated",
    );
    await f.app.ensure("claude");
  } finally {
    await f.close();
  }
});
test("restart recovers saved rotations, rejects ambiguous exchanges and respects reconnect/logout", async () => {
  for (const mode of ["rotated", "ambiguous", "reconnected", "signed-out"]) {
    const f = fixture(async () => {
      throw Error("must not execute");
    });
    try {
      const old = token("old", 0);
      f.save(old);
      const p = join(f.root, "claude");
      durableJSON(
        join(p, "profile", credentialFile("claude")),
        mode === "rotated" ? token("new") : old,
      );
      durableJSON(join(p, "journal.json"), { base: fingerprint(old) });
      if (mode === "reconnected") f.save(token("gui"));
      if (mode === "signed-out") rmSync(join(f.home, credentialFile("claude")));
      await f.app.close();
      f.app = renewals(f.config);
      if (mode === "ambiguous") {
        await assert.rejects(f.app.ensure("claude"), /reconnect/);
        assert.equal(f.app.view("claude").state, "reconnect_required");
        f.save(token("gui"));
        await f.app.ensure("claude");
        assert.equal(
          readCredentials(f.home, "claude").claudeAiOauth.refreshToken,
          "secret-refresh-gui",
        );
      } else if (mode === "signed-out")
        assert.equal(existsSync(join(f.home, credentialFile("claude"))), false);
      else
        assert.equal(
          readCredentials(f.home, "claude").claudeAiOauth.refreshToken,
          "secret-refresh-" + (mode === "rotated" ? "new" : "gui"),
        );
    } finally {
      await f.close();
    }
  }
});
test("shutdown aborts renewal; malformed and symlink candidates never reach saved credentials", async () => {
  const f = fixture(async (id, profile, signal) => {
    await new Promise((r) => signal.addEventListener("abort", r, { once: true }));
    throw Error("cancelled");
  });
  try {
    f.save(token("old", 0));
    const pending = f.app.ensure("claude");
    const rejected = assert.rejects(pending, /reconnect/);
    await new Promise((r) => setImmediate(r));
    await f.app.close();
    await rejected;
    assert.equal(
      readCredentials(f.home, "claude").claudeAiOauth.refreshToken,
      "secret-refresh-old",
    );
  } finally {
    await f.close();
  }
  for (const kind of ["link", "malformed", "api"]) {
    const g = fixture(async (id, profile) => {
      const p = join(profile, credentialFile(id));
      rmSync(p);
      if (kind === "link") symlinkSync(join(g.home, credentialFile(id)), p);
      else
        writeFileSync(
          p,
          kind === "malformed" ? "bad" : JSON.stringify({ OPENAI_API_KEY: "secret" }),
        );
    });
    try {
      g.save(token("old", 0));
      await assert.rejects(g.app.ensure("claude"));
      assert.equal(
        readCredentials(g.home, "claude").claudeAiOauth.refreshToken,
        "secret-refresh-old",
      );
    } finally {
      await g.close();
    }
  }
});
test("worker credential snapshots omit refresh grants and unrelated fields", () => {
  const claude = workerCredentials("claude", { ...token("x"), extra: "private" });
  assert.equal(claude.claudeAiOauth.refreshToken, undefined);
  assert.ok(!JSON.stringify(claude).includes("private"));
  const codex = workerCredentials("codex", {
    tokens: {
      access_token: "access",
      refresh_token: "private",
      id_token: "id",
      account_id: "account",
    },
    extra: "private",
  });
  assert.equal(codex.tokens.refresh_token, "");
  assert.ok(!JSON.stringify(codex).includes("private"));
});
test("native renewal sends only authentication RPCs and no Claude prompt", async () => {
  const f = fixture();
  try {
    for (const id of ["codex", "claude"]) {
      const path = join(f.home, credentialFile(id));
      durableJSON(
        path,
        id === "claude"
          ? token("synthetic", 0)
          : { tokens: { access_token: "synthetic", refresh_token: "synthetic" } },
      );
      const bin = join(f.base, id);
      writeFileSync(
        bin,
        `#!${process.execPath}\nconst fs=require('fs');if(process.argv.includes('--version')){console.log(${JSON.stringify(id === "claude" ? "2.1.283 (Claude Code)" : "codex-cli 0.157.1")});process.exit(0)}\n` +
          (id === "claude"
            ? `if(JSON.stringify(process.argv.slice(2))!==JSON.stringify(['auth','login','--claudeai'])||!process.env.CLAUDE_CODE_OAUTH_REFRESH_TOKEN||!process.env.CLAUDE_CODE_OAUTH_SCOPES)process.exit(9);`
            : `require('readline').createInterface({input:process.stdin}).on('line',line=>{let m=JSON.parse(line);if(m.method==='initialize')console.log(JSON.stringify({id:1,result:{}}));else if(m.method==='initialized'){}else if(m.method==='account/read'&&m.params.refreshToken===true)console.log(JSON.stringify({id:2,result:{account:{type:'chatgpt'}}}));else process.exit(9);});`),
        { mode: 0o700 },
      );
      await nativeRenewal(id, bin, f.home);
    }
  } finally {
    await f.close();
  }
});
