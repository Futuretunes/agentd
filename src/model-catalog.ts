import { testedVersions } from "./native-policy.ts";
import { spawn, execFile } from "node:child_process";
import { promisify, stripVTControlCharacters } from "node:util";
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { adapter } from "./adapters.ts";
import { durableJSON } from "./credentials.ts";
import { agents, efforts, type Catalog, type Model } from "./execution-settings.ts";
const exec = promisify(execFile);
const validId = (id: unknown): id is string =>
  typeof id === "string" &&
  /^[a-zA-Z0-9][a-zA-Z0-9._/-]{0,99}$/.test(id) &&
  !["auto", "provider"].includes(id);
export function normalizeModels(id: string, rows: any[]): Model[] {
  if (!Array.isArray(rows) || rows.length > 300) throw Error("Unsupported model catalog");
  const seen = new Set<string>();
  return rows.flatMap((row) => {
    const model = row?.model ?? row?.id ?? row?.modelId;
    if (!validId(model) || seen.has(model) || row.hidden) return [];
    seen.add(model);
    const levels = row.supportedReasoningEfforts ?? row.efforts ?? [],
      supported = Array.isArray(levels)
        ? levels
            .map((v: any) => (typeof v === "string" ? v : v?.reasoningEffort))
            .filter((v: any) => efforts.includes(v))
        : [];
    const tier =
      id === "codex" && /^gpt-6-luna$/.test(model)
        ? "light"
        : id === "codex" && /^gpt-6-sol$/.test(model)
          ? "balanced"
          : id === "codex" && /^gpt-6-astra$/.test(model)
            ? "deep"
            : undefined;
    return [
      {
        id: model,
        name: String(row.displayName ?? row.name ?? model)
          .replace(/[\x00-\x1f\x7f]/g, "")
          .slice(0, 120),
        efforts: [...new Set<string>(supported)],
        ...(tier ? { tier } : {}),
      } as Model,
    ];
  });
}
export function parseCursorModels(text: string) {
  const clean = stripVTControlCharacters(text);
  if (!/^Available models\s*$/m.test(clean))
    throw Error("Sign in to Cursor before refreshing models");
  return normalizeModels(
    "cursor",
    clean.split("\n").flatMap((line) => {
      const m = line.match(
        /^([a-zA-Z0-9][a-zA-Z0-9._/-]{0,99})\s+-\s+(.+?)(?: \((?:current|default|current, default)\))?$/,
      );
      return m ? [{ id: m[1], name: m[2], efforts: [] }] : [];
    }),
  );
}
export async function discoverModels(
  id: string,
  signal: AbortSignal,
  home = homedir(),
): Promise<Model[]> {
  if (id === "codex") mkdirSync(join(home, ".codex"), { recursive: true, mode: 0o700 });
  const bin = adapter(id).executable(),
    env = {
      HOME: home,
      CODEX_HOME: join(home, ".codex"),
      PATH: process.env.PATH,
      LANG: "C.UTF-8",
      TERM: "dumb",
      NO_COLOR: "1",
      NO_OPEN_BROWSER: "1",
      DIRENV_DISABLE: "1",
      AGENT_CLI_CREDENTIAL_STORE: "file",
      DISABLE_AUTOUPDATER: "1",
      DISABLE_TELEMETRY: "1",
    };
  const version = (
    await exec(bin, ["--version"], {
      env,
      cwd: home,
      signal,
      timeout: 10000,
      maxBuffer: 4096,
    })
  ).stdout.trim();
  if (id === "claude") {
    if (version !== testedVersions.claude)
      throw Error("Refresh requires the tested Claude CLI version");
    const help = (
      await exec(bin, ["--help"], {
        env,
        cwd: home,
        signal,
        timeout: 15000,
        maxBuffer: 65536,
      })
    ).stdout;
    if (!help.includes("--model") || !help.includes("--effort"))
      throw Error("Native selection controls unavailable");
    return [
      { id: "haiku", name: "Haiku (native alias)", efforts: [], tier: "light" },
      {
        id: "sonnet",
        name: "Sonnet (native alias)",
        efforts: ["low", "medium", "high"],
        tier: "balanced",
      },
      {
        id: "opus",
        name: "Opus (native alias)",
        efforts: ["low", "medium", "high"],
        tier: "deep",
      },
    ];
  }
  if (id === "cursor") {
    if (version !== testedVersions.cursor)
      throw Error("Refresh requires the tested Cursor CLI version");
    const value = await exec(bin, ["models"], {
      env,
      cwd: home,
      signal,
      timeout: 20000,
      maxBuffer: 65536,
    });
    return parseCursorModels(value.stdout);
  }
  if (id !== "codex" || version !== testedVersions.codex)
    throw Error("Refresh requires the tested Codex CLI version");
  return new Promise((resolve, reject) => {
    const child = spawn(
      bin,
      [
        "-c",
        'forced_login_method="chatgpt"',
        "-c",
        'model_provider="openai"',
        "app-server",
      ],
      { env, cwd: home, stdio: ["pipe", "pipe", "ignore"], detached: true },
    );
    let buffer = "",
      bytes = 0,
      finished = false;
    const kill = () => {
      if (child.pid)
        try {
          process.kill(-child.pid, "SIGKILL");
        } catch {}
    };
    const end = (error?: Error, models?: Model[]) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      signal.removeEventListener("abort", cancel);
      kill();
      error ? reject(error) : resolve(models!);
    };
    const cancel = () => end(Error("Model refresh cancelled"));
    const timer = setTimeout(() => end(Error("Model refresh timed out")), 20000);
    signal.addEventListener("abort", cancel, { once: true });
    if (signal.aborted) cancel();
    const send = (v: unknown) => child.stdin.write(JSON.stringify(v) + "\n");
    child.stdin.on("error", () => end(Error("Model discovery unavailable")));
    child.on("error", () => end(Error("Model discovery unavailable")));
    child.on("close", () => end(Error("Model discovery unavailable")));
    child.stdout.on("data", (chunk) => {
      bytes += chunk.length;
      if (bytes > 300000) return end(Error("Model catalog too large"));
      buffer += chunk.toString();
      while (buffer.includes("\n")) {
        const i = buffer.indexOf("\n"),
          line = buffer.slice(0, i);
        buffer = buffer.slice(i + 1);
        try {
          const m = JSON.parse(line);
          if (m.id === 1) {
            if (m.error) throw Error();
            send({ method: "initialized" });
            send({
              id: 2,
              method: "model/list",
              params: { includeHidden: false, limit: 100 },
            });
          } else if (m.id === 2) {
            if (m.error || !Array.isArray(m.result?.data) || m.result.nextCursor)
              throw Error();
            end(undefined, normalizeModels(id, m.result.data));
          } else if (m.method && m.id !== undefined) throw Error();
        } catch {
          end(Error("Native model catalog could not be verified"));
        }
      }
    });
    send({
      id: 1,
      method: "initialize",
      params: {
        clientInfo: { name: "agentd-models", version: "1.0.0" },
        capabilities: { experimentalApi: false },
      },
    });
  });
}
export function modelCatalog(
  root: string,
  changed: () => void,
  discover = discoverModels,
) {
  mkdirSync(root, { recursive: true, mode: 0o700 });
  const cache = new Map<string, Catalog>();
  let pending: Promise<void> | undefined, abort: AbortController | undefined;
  const fallback = (): Catalog => ({
    models: [],
    source: "Provider default only; refresh native models to choose explicitly",
    checkedAt: null,
    error: null,
  });
  for (const id of agents) {
    try {
      const v = JSON.parse(readFileSync(join(root, id + ".json"), "utf8"));
      if (
        !Array.isArray(v.models) ||
        v.models.length > 300 ||
        typeof v.source !== "string" ||
        typeof v.checkedAt !== "string"
      )
        throw Error();
      const models = v.models.map((m: any) => {
        if (
          !validId(m.id) ||
          !Array.isArray(m.efforts) ||
          m.efforts.some((e: string) => !efforts.includes(e)) ||
          !["light", "balanced", "deep", undefined].includes(m.tier)
        )
          throw Error();
        return m;
      });
      cache.set(id, { models, source: v.source, checkedAt: v.checkedAt, error: null });
    } catch {
      cache.set(id, fallback());
    }
  }
  function view(id: string) {
    if (!agents.includes(id)) throw Error("Unsupported agent");
    return { ...cache.get(id)!, busy: !!pending };
  }
  function refresh(id: string) {
    if (!agents.includes(id) || pending)
      throw Error("Wait for the current model refresh");
    abort = new AbortController();
    const signal = abort.signal;
    pending = Promise.resolve().then(async () => {
      try {
        const models = await discover(id, signal);
        if (!models.length) throw Error();
        const value = {
          models,
          source:
            id === "claude"
              ? "Native CLI aliases; subscription availability checked at run time"
              : "Native model catalog; availability checked again at run time",
          checkedAt: new Date().toISOString(),
          error: null,
        };
        durableJSON(join(root, id + ".json"), value);
        cache.set(id, value);
      } catch {
        cache.set(id, {
          ...cache.get(id)!,
          error:
            "Could not refresh native models. Check sign-in and the supported CLI version. Previous choices were kept.",
        });
      } finally {
        pending = undefined;
        abort = undefined;
        changed();
      }
    });
    return view(id);
  }
  return {
    view,
    refresh,
    invalidate() {
      for (const id of agents) {
        const value = fallback();
        cache.set(id, value);
        durableJSON(join(root, id + ".json"), value);
      }
      changed();
    },
    busy: () => !!pending,
    async close() {
      abort?.abort();
      await pending;
    },
  };
}
