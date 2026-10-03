import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { chatArguments } from "../src/codex-chat.ts";
test("chat pins CLI version, disables every active feature and separates literal prompt", () => {
  const root = mkdtempSync(join(tmpdir(), "chat-cli-")),
    bin = join(root, "codex");
  const fixture = (version, listing) =>
    writeFileSync(
      bin,
      `#!${process.execPath}\nconsole.log(process.argv.includes('--version')?${JSON.stringify(version)}:${JSON.stringify(listing)});`,
      { mode: 0o700 },
    );
  try {
    fixture(
      "codex-cli 0.157.1",
      "shell_tool stable true\nnew_capability under development false\nold removed false",
    );
    const args = chatArguments(bin, "--unsafe");
    assert.ok(args.includes("features.shell_tool=false"));
    assert.ok(args.includes("features.new_capability=false"));
    assert.ok(!args.includes("features.old=false"));
    assert.ok(args.includes("--ignore-user-config"));
    assert.ok(args.includes("--strict-config"));
    assert.equal(args.at(-2), "--");
    assert.equal(args.at(-1), "--unsafe");
    assert.equal(args[args.indexOf("--sandbox") + 1], "read-only");
    fixture("codex-cli 0.158.0", "shell_tool stable true");
    assert.throws(() => chatArguments(bin, "test"), /validated/);
    fixture("codex-cli 0.157.1", "unrecognized listing");
    assert.throws(() => chatArguments(bin, "test"), /inventory/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
test("chat wrapper emits answer text only and fails on incomplete or execution events", () => {
  const root = mkdtempSync(join(tmpdir(), "chat-stream-")),
    bin = join(root, "codex");
  const wrapper = fileURLToPath(new URL("../src/codex-chat.ts", import.meta.url));
  const fixture = (events) =>
    writeFileSync(
      bin,
      `#!${process.execPath}\nif(process.argv.includes('--version'))console.log('codex-cli 0.157.1');else if(process.argv.includes('list'))console.log('shell_tool stable true');else{console.error('private diagnostic');for(const event of ${JSON.stringify(events)})console.log(JSON.stringify(event));}`,
      { mode: 0o700 },
    );
  try {
    fixture([
      { type: "item.completed", item: { type: "error", message: "private diagnostic" } },
      { type: "item.completed", item: { type: "agent_message", text: "Answer" } },
      { type: "turn.completed" },
    ]);
    const output = execFileSync(process.execPath, [wrapper, bin, "test"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    assert.equal(output, "Answer\n");
    fixture([{ type: "turn.failed", error: { message: "credential detail" } }]);
    assert.throws(() =>
      execFileSync(process.execPath, [wrapper, bin, "test"], { stdio: "pipe" }),
    );
    fixture([{ type: "item.started", item: { type: "command_execution" } }]);
    assert.throws(() =>
      execFileSync(process.execPath, [wrapper, bin, "test"], { stdio: "pipe" }),
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
