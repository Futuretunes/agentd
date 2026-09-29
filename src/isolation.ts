import { namespacePolicy, sandboxCommand } from "./sandbox-policy.ts";
import { cursorCredentialPath, cursorSettings, cursorTeam } from "./cursor-policy.ts";
import {
  existsSync,
  copyFileSync,
  mkdirSync,
  rmSync,
  mkdtempSync,
  realpathSync,
  lstatSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { join, resolve, dirname } from "node:path";
import { homedir } from "node:os";
import { spawn, type ChildProcess } from "node:child_process";
import { fileURLToPath } from "node:url";
import { readCredentials, workerCredentials, durableJSON } from "./credentials.ts";
import { git } from "./changes.ts";

// Explicit mounts only: unrelated projects, daemon state, sockets and profiles are absent.
export function isolated(
  worktree: string,
  stateDir: string,
  command: string,
  args: string[],
  adapter?: string,
  dependencies?: string,
  writable = true,
  promptOnly = false,
  credentials?: { renewalHome?: string; accessOnly?: boolean },
) {
  if (process.platform !== "linux")
    throw Error("Worker isolation requires Linux with bubblewrap");
  if (adapter && !["claude", "codex", "cursor"].includes(adapter))
    throw Error("Unsupported adapter");
  const runtime = mkdtempSync(join(stateDir, "worker-")),
    home = join(runtime, "home");
  mkdirSync(home, { mode: 0o700 });
  let broker: ChildProcess | undefined;
  const cleanup = () => {
    broker?.kill("SIGTERM");
    rmSync(runtime, { recursive: true, force: true });
  };
  try {
    const hostHome = homedir();
    if (adapter && !credentials?.renewalHome) {
      // Only the selected CLI's login is copied; no other provider or Git credentials.
      const files =
        adapter === "cursor"
          ? [cursorCredentialPath]
          : adapter === "codex"
            ? [".codex/auth.json"]
            : [".claude.json", ".claude/.credentials.json"];
      for (const file of files) {
        const source = join(hostHome, file);
        if (existsSync(source)) {
          mkdirSync(dirname(join(home, file)), { recursive: true, mode: 0o700 });
          if (credentials?.accessOnly && file !== ".claude.json")
            durableJSON(
              join(home, file),
              workerCredentials(adapter, readCredentials(hostHome, adapter)),
            );
          else copyFileSync(source, join(home, file));
        }
      }
    }
    const authentication = !!credentials?.renewalHome,
      empty = promptOnly || authentication;
    if (authentication && (!adapter || writable || dependencies || promptOnly))
      throw Error("Invalid authentication isolation policy");
    if (promptOnly && (adapter !== "codex" || writable || dependencies))
      throw Error("Invalid chat isolation policy");
    const common = empty
      ? null
      : realpathSync(resolve(worktree, git(worktree, ["rev-parse", "--git-common-dir"])));
    const executable = realpathSync(command),
      node = realpathSync(process.execPath),
      source = dirname(fileURLToPath(import.meta.url));
    const mounts = [
      ...namespacePolicy,
      "--proc",
      "/proc",
      "--dev",
      "/dev",
      "--tmpfs",
      "/tmp",
      "--dir",
      "/run",
    ];
    // System runtime only. Never bind the host root, /home, /srv or /var wholesale.
    for (const path of ["/usr", "/bin", "/sbin", "/lib", "/lib64"])
      if (existsSync(path)) mounts.push("--ro-bind", path, path);
    for (const path of [
      "/etc/ssl/certs",
      "/etc/ca-certificates",
      "/etc/ld.so.cache",
      "/etc/nsswitch.conf",
      "/etc/passwd",
      "/etc/group",
      "/etc/hosts",
      "/etc/localtime",
    ])
      if (existsSync(path)) mounts.push("--ro-bind", realpathSync(path), path);
    if (!node.startsWith("/usr/")) {
      const prefix = dirname(dirname(node));
      mounts.push("--ro-bind", prefix, prefix);
    }
    // Pin the child entry/check code to this application, never a repository-supplied path.
    mounts.push(
      "--bind",
      credentials?.renewalHome ?? home,
      hostHome,
      "--ro-bind",
      source,
      source,
    );
    const native = empty || adapter === "cursor" ? realpathSync(args[1]) : executable;
    if (adapter && !native.startsWith("/usr/")) {
      const modules = native.indexOf("/node_modules/");
      const install =
        adapter === "cursor"
          ? dirname(native)
          : modules < 0
            ? native
            : native.slice(0, modules + 14) + native.slice(modules + 14).split("/")[0];
      mounts.push("--ro-bind", install, install);
    }
    if (empty) {
      const empty = join(runtime, "empty");
      mkdirSync(empty, { mode: 0o700 });
      mounts.push("--ro-bind", empty, worktree);
    } else
      mounts.push(
        "--ro-bind",
        common!,
        common!,
        writable ? "--bind" : "--ro-bind",
        worktree,
        worktree,
        "--ro-bind",
        join(worktree, ".git"),
        join(worktree, ".git"),
      );
    mounts.push("--chdir", worktree, "--setenv", "HOME", hostHome);
    if (credentials?.accessOnly && adapter === "claude")
      mounts.push("--setenv", "AGENTD_ACCESS_ONLY", "claude");
    if (adapter === "cursor") {
      if (!credentials?.accessOnly)
        throw Error("Cursor requires access-only worker credentials");
      const config = join(home, ".cursor");
      mkdirSync(config, { recursive: true, mode: 0o700 });
      durableJSON(join(config, "cli-config.json"), cursorSettings(cursorTeam(hostHome)));
      const blank = join(runtime, "masked");
      mkdirSync(blank, { mode: 0o700 });
      const json = join(runtime, "empty.json");
      writeFileSync(json, "{}", { mode: 0o600 });
      for (const dir of ["managed", "plugins", "skills", "rules"]) {
        mkdirSync(join(config, dir));
        mounts.push("--ro-bind", blank, join(hostHome, ".cursor", dir));
      }
      for (const file of ["hooks.json", "mcp.json"]) {
        writeFileSync(join(config, file), "{}", { mode: 0o600 });
        mounts.push("--ro-bind", json, join(hostHome, ".cursor", file));
      }
      mkdirSync(join(home, ".claude"));
      mounts.push("--ro-bind", blank, join(hostHome, ".claude"));
      let visited = 0;
      const scan = (dir: string) => {
        for (const name of readdirSync(dir)) {
          if (++visited > 100000)
            throw Error("Cursor workspace exceeds the configuration scan limit");
          const path = join(dir, name),
            s = lstatSync(path);
          if ([".cursor", ".claude"].includes(name)) {
            if (!s.isDirectory() || s.isSymbolicLink())
              throw Error("Cursor configuration paths must be ordinary directories");
            mounts.push("--ro-bind", blank, path);
          } else if (name === ".mcp.json") {
            if (!s.isFile() || s.isSymbolicLink())
              throw Error("Unsupported MCP configuration path");
            mounts.push("--ro-bind", json, path);
          } else if (s.isDirectory() && !s.isSymbolicLink() && name !== ".git")
            scan(path);
        }
      };
      scan(worktree);
      mounts.push(
        "--setenv",
        "AGENTD_ACCESS_ONLY",
        "cursor",
        "--setenv",
        "AGENT_CLI_CREDENTIAL_STORE",
        "file",
        "--setenv",
        "NO_OPEN_BROWSER",
        "1",
        "--setenv",
        "DIRENV_DISABLE",
        "1",
        "--setenv",
        "GIT_CONFIG_GLOBAL",
        "/dev/null",
        "--setenv",
        "GIT_CONFIG_NOSYSTEM",
        "1",
        "--setenv",
        "GIT_CONFIG_COUNT",
        "2",
        "--setenv",
        "GIT_CONFIG_KEY_0",
        "core.hooksPath",
        "--setenv",
        "GIT_CONFIG_VALUE_0",
        "/dev/null",
        "--setenv",
        "GIT_CONFIG_KEY_1",
        "core.fsmonitor",
        "--setenv",
        "GIT_CONFIG_VALUE_1",
        "false",
      );
    }
    if (dependencies)
      mounts.push(
        "--ro-bind",
        realpathSync(dependencies),
        join(worktree, "node_modules"),
      );
    // The original CLI path may be a symlink in the hidden service profile.
    const nativeArgs =
      empty || adapter === "cursor" ? [args[0], native, ...args.slice(2)] : args;
    let childCommand = executable,
      childArgs = nativeArgs;
    if (adapter) {
      const network = join(runtime, "network");
      mkdirSync(network, { mode: 0o700 });
      const socket = join(network, "egress.sock");
      // Separate host process: DNS and outbound connections happen outside the worker namespace.
      broker = spawn(
        node,
        [join(source, "egress-proxy.ts"), socket, adapter, String(process.pid)],
        { env: { PATH: "/usr/local/bin:/usr/bin:/bin" }, stdio: "ignore" },
      );
      broker.on("error", () => {});
      mounts.push("--ro-bind", network, "/run/agentd-egress");
      childCommand = node;
      childArgs = [
        join(source, "worker-entry.ts"),
        "/run/agentd-egress/egress.sock",
        executable,
        ...nativeArgs,
      ];
    }
    return {
      ...sandboxCommand(
        [...mounts, "--", childCommand, ...childArgs],
        process.env.AGENTD_BWRAP_BIN ?? "/usr/bin/bwrap",
      ),
      cleanup,
    };
  } catch (error) {
    cleanup();
    throw error;
  }
}
