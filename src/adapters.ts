import { testedVersions, claudeMaxTurns, nativeLimits } from "./native-policy.ts";
import { readCredentials } from "./credentials.ts";
import { accessSync, constants, statSync } from "node:fs";
import { homedir } from "node:os";
import { join, isAbsolute } from "node:path";
import { execFile, execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export type Mode = "ask" | "edit" | "chat";
export type Selection = { model: string; effort: string };
export type Invocation = {
  prompt: string;
  mode: Mode;
  images: readonly string[];
  selection?: Selection;
};
export function selectionArguments(id: string, selection?: Selection) {
  if (!selection) return [];
  const { model, effort } = selection;
  if (
    !/^[a-zA-Z0-9][a-zA-Z0-9._/-]{0,99}$/.test(model) ||
    !["provider", "none", "low", "medium", "high", "xhigh", "max", "ultra"].includes(
      effort,
    )
  )
    throw Error("Invalid model selection");
  if (id === "cursor" && effort !== "provider")
    throw Error("Cursor effort must be selected through a native model variant");
  return [
    ...(model === "provider" ? [] : ["--model", model]),
    ...(effort === "provider"
      ? []
      : id === "claude"
        ? ["--effort", effort]
        : ["-c", "model_reasoning_effort=" + JSON.stringify(effort)]),
  ];
}
export type Adapter = {
  id: string;
  name: string;
  images: boolean;
  executable: () => string;
  arguments: (input: Invocation) => string[];
};
export type AccountStatus = {
  state: "signed_in" | "signed_out" | "checking" | "error" | "unavailable";
  method: string | null;
  checkedAt: string | null;
  message: string;
};
// Trusted application code only: repositories cannot install adapters or supply shell commands.
const registry: readonly Adapter[] = [
  {
    id: "cursor",
    name: "Cursor",
    images: false,
    executable: () =>
      process.env.AGENTD_CURSOR_BIN ?? join(homedir(), ".local/bin/cursor-agent"),
    arguments: () => {
      throw Error("Cursor requires the ACP wrapper");
    },
  },
  {
    id: "codex",
    name: "Codex",
    images: true,
    executable: () => process.env.AGENTD_CODEX_BIN ?? join(homedir(), ".local/bin/codex"),
    arguments: ({ prompt, mode, images }) => [
      "-c",
      'forced_login_method="chatgpt"',
      "exec",
      "--sandbox",
      mode === "edit" ? "workspace-write" : "read-only",
      "--ephemeral",
      ...images.flatMap((path) => ["--image", path]),
      prompt,
    ],
  },
  {
    id: "claude",
    name: "Claude",
    images: true,
    executable: () =>
      process.env.AGENTD_CLAUDE_BIN ?? join(homedir(), ".local/bin/claude"),
    arguments: ({ prompt, mode }) => {
      const tools = mode === "edit" ? "Read,Glob,Grep,Edit,Write" : "Read,Glob,Grep";
      return [
        "-p",
        "--permission-mode",
        "dontAsk",
        "--tools",
        tools,
        "--allowedTools",
        tools,
        "--max-turns",
        String(claudeMaxTurns),
        prompt,
      ];
    },
  },
];
export const adapterIds = registry.map((adapter) => adapter.id);
export function adapter(id: string) {
  const value = registry.find((value) => value.id === id);
  if (!value) throw Error("Unsupported adapter");
  return value;
}
export function verifySelectionVersion(id: string) {
  try {
    const found = execFileSync(adapter(id).executable(), ["--version"], {
      encoding: "utf8",
      timeout: 5000,
      maxBuffer: 4096,
      stdio: ["ignore", "pipe", "ignore"],
      env: {
        HOME: homedir(),
        PATH: process.env.PATH,
        AGENT_CLI_CREDENTIAL_STORE: "file",
        NO_OPEN_BROWSER: "1",
        DIRENV_DISABLE: "1",
      },
    }).trim();
    if (found !== testedVersions[id]) throw Error();
  } catch {
    throw Error(
      "Model selection requires the tested native CLI version. Check Operations before retrying.",
    );
  }
}
export function invocation(id: string, input: Invocation): [string, string[]] {
  if (input.mode === "chat") {
    if (id !== "codex" || input.images.length)
      throw Error("Chat only supports Codex text prompts");
    return [
      process.execPath,
      [
        fileURLToPath(new URL("./codex-chat.ts", import.meta.url)),
        adapter(id).executable(),
        input.prompt,
        JSON.stringify(input.selection ?? { model: "provider", effort: "provider" }),
      ],
    ];
  }
  if (id === "cursor" && ["ask", "edit"].includes(input.mode)) {
    if (input.images.length) throw Error("Cursor currently accepts text only");
    return [
      process.execPath,
      [
        fileURLToPath(new URL("./cursor-acp.ts", import.meta.url)),
        adapter(id).executable(),
        input.mode,
        input.prompt,
        JSON.stringify(input.selection ?? { model: "provider", effort: "provider" }),
      ],
    ];
  }
  if (!["ask", "edit"].includes(input.mode)) throw Error("Unsupported work mode");
  const value = adapter(id);
  if (input.images.length && !value.images)
    throw Error("This adapter does not support images");
  return [
    value.executable(),
    [...selectionArguments(id, input.selection), ...value.arguments(input)],
  ];
}
function installed(path: string) {
  try {
    return (
      isAbsolute(path) &&
      statSync(path).isFile() &&
      (accessSync(path, constants.X_OK), true)
    );
  } catch {
    return false;
  }
}
export function discover(
  enabled: readonly string[],
  editing: readonly string[],
  customCommand = false,
  chatOnly = false,
) {
  return registry.map((value) => {
    const present = customCommand || installed(value.executable()),
      chat = value.id === "codex" && chatOnly,
      permitted = enabled.includes(value.id) || chat;
    const available = present && permitted;
    return {
      id: value.id,
      name: value.name,
      installed: present,
      enabled: permitted,
      available,
      reason: !permitted
        ? "Adapter disabled by security policy"
        : !present
          ? "CLI is missing or not executable"
          : null,
      modes: available
        ? chat
          ? ["chat"]
          : editing.includes(value.id)
            ? ["ask", "edit"]
            : ["ask"]
        : [],
      features: { images: !chat && value.images },
      nativeLimits: nativeLimits(value.id),
      authentication: "not_checked",
    };
  });
}

export function probeAccount(id: string, home = homedir()): Promise<AccountStatus> {
  const value = adapter(id),
    executable = value.executable(),
    args =
      id === "cursor"
        ? ["status", "--format", "json"]
        : id === "codex"
          ? ["login", "status"]
          : ["auth", "status", "--text"];
  if (!installed(executable))
    return Promise.resolve({
      state: "unavailable",
      method: null,
      checkedAt: new Date().toISOString(),
      message: "CLI is missing or not executable",
    });
  return new Promise((resolve) =>
    execFile(
      executable,
      args,
      {
        cwd: home,
        timeout: 10000,
        killSignal: "SIGKILL",
        maxBuffer: 4096,
        env: {
          HOME: home,
          CODEX_HOME: join(home, ".codex"),
          PATH: process.env.PATH ?? "/usr/local/bin:/usr/bin:/bin",
          LANG: "C.UTF-8",
          TERM: "dumb",
          AGENT_CLI_CREDENTIAL_STORE: "file",
          NO_OPEN_BROWSER: "1",
          DIRENV_DISABLE: "1",
          DISABLE_AUTOUPDATER: "1",
          DISABLE_TELEMETRY: "1",
          DISABLE_ERROR_REPORTING: "1",
        },
      },
      (error, stdout, stderr) => {
        const output = String(stdout) + String(stderr),
          checkedAt = new Date().toISOString();
        if (id === "cursor") {
          try {
            const value = JSON.parse(stdout);
            if (value.status === "unauthenticated") {
              resolve({
                state: "signed_out",
                method: null,
                checkedAt,
                message: "Sign-in required",
              });
              return;
            }
            readCredentials(home, id);
            if (
              !error &&
              value.status === "authenticated" &&
              value.isAuthenticated &&
              value.userInfo
            ) {
              resolve({
                state: "signed_in",
                method: "Cursor account",
                checkedAt,
                message: "Native browser account is signed in",
              });
              return;
            }
          } catch {}
          resolve({
            state: "error",
            method: null,
            checkedAt,
            message: "Could not verify Cursor account. Reconnect in Activity.",
          });
          return;
        }
        if (/not logged in|not authenticated|login required/i.test(output))
          resolve({
            state: "signed_out",
            method: null,
            checkedAt,
            message: "Sign-in required",
          });
        else if (!error && (/logged in/i.test(output) || /login method:/i.test(output)))
          resolve({
            state: "signed_in",
            method:
              id === "codex" && /chatgpt/i.test(output)
                ? "ChatGPT subscription"
                : id === "claude" &&
                    /login method:\s*Claude (?:Pro|Max|Team|Enterprise|subscription|account)/i.test(
                      output,
                    )
                  ? "Claude subscription"
                  : "Native account",
            checkedAt,
            message: "Account is signed in",
          });
        else
          resolve({
            state: "error",
            method: null,
            checkedAt,
            message: error?.killed
              ? "Status check timed out"
              : "Could not verify sign-in",
          });
      },
    ),
  );
}

export type NativeVersion = {
  state: "checking" | "verified" | "mismatch" | "unavailable";
  version: string | null;
  testedVersion: string;
  checkedAt: string | null;
};
export function probeNativeVersion(id: string): Promise<NativeVersion> {
  const executable = adapter(id).executable(),
    testedVersion = testedVersions[id];
  const result = (
    state: NativeVersion["state"],
    version: string | null,
  ): NativeVersion => ({
    state,
    version,
    testedVersion,
    checkedAt: new Date().toISOString(),
  });
  if (!installed(executable)) return Promise.resolve(result("unavailable", null));
  return new Promise((resolve) =>
    execFile(
      executable,
      ["--version"],
      {
        cwd: homedir(),
        encoding: "utf8",
        timeout: 5000,
        killSignal: "SIGKILL",
        maxBuffer: 4096,
        env: {
          HOME: homedir(),
          PATH: "/usr/local/bin:/usr/bin:/bin",
          LANG: "C.UTF-8",
          NO_OPEN_BROWSER: "1",
          AGENT_CLI_CREDENTIAL_STORE: "file",
          DIRENV_DISABLE: "1",
          DISABLE_AUTOUPDATER: "1",
          DISABLE_TELEMETRY: "1",
        },
      },
      (error, stdout) => {
        const value = String(stdout).trim(),
          valid =
            id === "claude"
              ? /^\d+\.\d+\.\d+ \(Claude Code\)$/.test(value)
              : id === "codex"
                ? /^codex-cli \d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?$/.test(value)
                : /^\d{4}\.\d{2}\.\d{2}-[a-f0-9]{7,40}$/.test(value);
        if (error || !valid) {
          resolve(result("unavailable", null));
          return;
        }
        resolve(result(value === testedVersion ? "verified" : "mismatch", value));
      },
    ),
  );
}
