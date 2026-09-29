import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { normalizeCodexUsage, usageCache, usageResponse } from "../src/provider-usage.ts";
import { readNativeUsage } from "../src/native-usage.ts";
import { parseHTML } from "linkedom";
import { renderUsage } from "../public/ui.js";
const raw = {
  rateLimits: { primary: { usedPercent: 99 } },
  rateLimitsByLimitId: {
    codex: {
      primary: { usedPercent: 25, windowDurationMins: 300, resetsAt: 2000000000 },
      secondary: { usedPercent: 105, windowDurationMins: 10080, resetsAt: 2000100000 },
      credits: { balance: "12.50", hasCredits: true, unlimited: false },
      accountEmail: "private@example.test",
      limitName: "SECRET",
    },
  },
  rateLimitResetCredits: { availableCount: 2, credits: [{ id: "SECRET" }] },
  token: "SECRET",
};
test("usage prefers multi-bucket quotas, keeps missing fields unknown and exposes no account data", () => {
  const value = normalizeCodexUsage(raw);
  assert.deepEqual(
    value.windows.map((w) => w.remainingPercent),
    [75, 0],
  );
  assert.equal(value.credits[0].balance, "12.50");
  assert.equal(value.resetCredits, 2);
  assert.doesNotMatch(JSON.stringify(value), /SECRET|private|token|Email/);
  assert.deepEqual(normalizeCodexUsage(usageResponse(value)), value);
  assert.throws(() =>
    normalizeCodexUsage({ rateLimits: { primary: { usedPercent: null } } }),
  );
  const missing = normalizeCodexUsage({ rateLimits: { primary: { usedPercent: 0 } } });
  assert.equal(missing.windows[0].remainingPercent, 100);
  assert.equal(missing.windows[0].resetsAt, null);
  assert.equal(missing.resetCredits, null);
  assert.deepEqual(missing.credits, []);
  assert.throws(() =>
    normalizeCodexUsage({ rateLimitsByLimitId: {}, rateLimits: raw.rateLimits }),
  );
  assert.throws(() =>
    normalizeCodexUsage({ rateLimits: { primary: { usedPercent: -5 } } }),
  );
});
test("cache throttles refresh, marks failures/reset boundaries stale and clears account history", () => {
  let now = 1900000000000;
  const cache = usageCache(() => now);
  assert.equal(cache.due(), true);
  cache.begin();
  cache.save(raw);
  assert.equal(cache.due(), false);
  assert.equal(cache.view("codex").state, "available");
  now += 60000;
  assert.equal(cache.due(), true);
  cache.fail();
  assert.equal(cache.view("codex").state, "stale");
  assert.equal(cache.view("codex").windows[0].remainingPercent, 75);
  cache.save(raw);
  now = 2000000000001;
  assert.equal(cache.view("codex").state, "stale");
  cache.clear();
  assert.equal(cache.view("codex").checkedAt, null);
  assert.deepEqual(cache.view("codex").windows, []);
  assert.equal(cache.view("claude").state, "unavailable");
  assert.equal(cache.view("cursor").state, "unavailable");
});
function nativeFixture(mode) {
  const root = mkdtempSync(join(tmpdir(), "usage-rpc-")),
    bin = join(root, "codex");
  writeFileSync(
    bin,
    `#!${process.execPath}\nconst fs=require('fs');if(process.argv.includes('--version')){console.log('codex-cli 0.157.1');process.exit(0)}
 const rl=require('readline').createInterface({input:process.stdin});rl.on('line',line=>{const m=JSON.parse(line);fs.appendFileSync(${JSON.stringify(join(root, "methods"))},m.method+'\\n');
 const emit=v=>console.log(JSON.stringify(v));
 if(m.method==='initialize')emit({id:1,result:{}});
 if(m.method==='account/read')emit({id:2,result:{account:{type:'chatgpt',email:'SECRET'}}});
 if(m.method==='account/rateLimits/read'){
 ${mode === "request" ? "emit({id:99,method:'item/commandExecution/requestApproval'});" : mode === "overflow" ? "console.log('x'.repeat(70000));" : mode === "hang" ? "" : `emit({id:3,result:${JSON.stringify(raw)}});`}
 }});`,
    { mode: 0o700 },
  );
  return { root, bin };
}
import { readFileSync } from "node:fs";
test("native usage makes only initialized account reads, never model, reset or approval requests", async () => {
  const f = nativeFixture("ok");
  try {
    const value = normalizeCodexUsage(
      await readNativeUsage(f.bin, new AbortController().signal),
    );
    assert.equal(value.windows[0].remainingPercent, 75);
    assert.equal(
      readFileSync(join(f.root, "methods"), "utf8"),
      "initialize\ninitialized\naccount/read\naccount/rateLimits/read\n",
    );
  } finally {
    rmSync(f.root, { recursive: true, force: true });
  }
});
test("native usage rejects server tool requests, oversized output and cancellation", async () => {
  for (const mode of ["request", "overflow", "hang"]) {
    const f = nativeFixture(mode),
      abort = new AbortController();
    const timer = mode === "hang" ? setTimeout(() => abort.abort(), 100) : null;
    try {
      await assert.rejects(readNativeUsage(f.bin, abort.signal));
    } finally {
      clearTimeout(timer);
      rmSync(f.root, { recursive: true, force: true });
    }
  }
});
test("usage UI separates credits from quotas and never claims a cached reset replenished allowance", () => {
  globalThis.document = parseHTML("<html><body></body></html>").document;
  try {
    const cache = usageCache(() => 1900000000000);
    cache.save(raw);
    const fresh = renderUsage("codex", cache.view("codex"));
    assert.match(fresh.textContent, /75% remaining/);
    assert.match(fresh.textContent, /12.50 provider credits/);
    assert.match(fresh.textContent, /window is exhausted/);
    assert.equal(fresh.querySelectorAll("progress").length, 2);
    cache.fail();
    const stale = renderUsage("codex", cache.view("codex"));
    assert.match(stale.textContent, /last known/);
    assert.doesNotMatch(stale.textContent, /window is exhausted/);
    const unknown = renderUsage("claude", cache.view("claude"));
    assert.equal(unknown.querySelectorAll("progress").length, 0);
    assert.equal(
      unknown.querySelector("a").getAttribute("href"),
      "https://claude.ai/settings/usage",
    );
  } finally {
    delete globalThis.document;
  }
});
