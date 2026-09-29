// Run as the service user. No model calls unless --live is supplied explicitly.
import { mkdtempSync, mkdirSync, rmSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { spawnSync } from "node:child_process";
import { git } from "../src/changes.ts";
import { isolated } from "../src/isolation.ts";
const root = mkdtempSync("/srv/agentd/tmp/edit-preflight-"),
  repo = join(root, "repo"),
  state = join(root, "state");
mkdirSync(repo);
mkdirSync(state);
try {
  git(repo, ["init", "-b", "main"]);
  git(repo, [
    "-c",
    "user.name=agentd",
    "-c",
    "user.email=agentd@localhost",
    "commit",
    "--allow-empty",
    "-m",
    "Preflight fixture",
  ]);
  for (const adapter of process.argv.includes("--claude-only")
    ? ["claude"]
    : process.argv.includes("--codex-only")
      ? ["codex"]
      : ["codex", "claude"]) {
    const tree = join(root, adapter);
    git(repo, ["worktree", "add", "--detach", tree, "HEAD"]);
    const command = join(homedir(), ".local/bin", adapter),
      live = process.argv.includes("--live");
    const prompt =
      "Create a file named CHECK.txt containing exactly EDIT_OK followed by a newline. Do not commit, use the network, or modify any other file.";
    const args = !live
      ? ["--help"]
      : adapter === "codex"
        ? [
            "-c",
            'forced_login_method="chatgpt"',
            "exec",
            "--sandbox",
            "workspace-write",
            "--ephemeral",
            prompt,
          ]
        : [
            "-p",
            "--permission-mode",
            "dontAsk",
            "--tools",
            "Read,Glob,Grep,Edit,Write",
            "--allowedTools",
            "Read,Glob,Grep,Edit,Write",
            "--max-turns",
            "8",
            prompt,
          ];
    const sandbox = isolated(tree, state, command, args, adapter);
    let output = "";
    try {
      const result = spawnSync(sandbox.command, sandbox.args, {
        cwd: tree,
        env: { PATH: process.env.PATH, HOME: homedir(), LANG: "C.UTF-8", TERM: "dumb" },
        timeout: live ? 180000 : 30000,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      });
      output = String(result.stdout ?? "") + "\n" + String(result.stderr ?? "");
      if (result.error) throw result.error;
      if (result.status !== 0) throw Error("CLI exited with status " + result.status);
      if (live && readFileSync(join(tree, "CHECK.txt"), "utf8").trim() !== "EDIT_OK")
        throw Error(adapter + " did not create the expected edit");
      console.log(
        adapter +
          ": " +
          (live ? "native edit verified" : "CLI starts inside editing sandbox"),
      );
    } catch (error) {
      console.error(adapter + ": preflight failed: " + error.message.split("\n")[0]);
      const diagnostic =
        output + "\n" + String(error.stdout ?? "") + "\n" + String(error.stderr ?? "");
      const log = join("/srv/agentd/logs", `edit-preflight-${adapter}.log`);
      writeFileSync(log, diagnostic, { mode: 0o600 });
      console.error("Diagnostic log saved locally: " + log);
      const lines = diagnostic
        .split("\n")
        .filter((line) =>
          /bwrap|sandbox|denied|not permitted|read-only|error|failed|cannot|couldn.t|unable|permission/i.test(
            line,
          ),
        );
      for (const line of lines.slice(-15))
        console.error(
          line
            .replace(/(?:sk-|Bearer\s+)[A-Za-z0-9_.-]+/gi, "[redacted]")
            .replace(/[A-Za-z0-9_-]{60,}/g, "[redacted]")
            .slice(0, 240),
        );
      process.exitCode = 1;
    } finally {
      sandbox.cleanup();
    }
  }
} finally {
  rmSync(root, { recursive: true, force: true });
}
