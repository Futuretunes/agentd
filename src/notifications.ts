/** Best-effort ntfy delivery. Failures must never affect task state. */
import {
  closeSync,
  fsyncSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";

export type NtfyDestination = {
  server: string;
  topic: string;
  origin?: string | null;
};

export type NtfyPayload = {
  title: string;
  message: string;
  click?: string;
  tags?: string[];
};

const serverPattern =
  /^https:\/\/[a-z0-9.-]{1,253}(?::[0-9]{2,5})?(?:\/[a-zA-Z0-9._~/-]{0,200})?$/;
const topicPattern = /^[A-Za-z0-9_-]{1,64}$/;
const httpsOrigin = /^https:\/\/[a-z0-9.-]{1,253}(?::[0-9]{2,5})?$/i;

export const notifiedKeysPath = (stateDir: string) =>
  join(stateDir, "notifications-sent.json");

export function ntfyUrl(destination: NtfyDestination) {
  if (!serverPattern.test(destination.server) || !topicPattern.test(destination.topic))
    throw Error("Invalid ntfy destination");
  return `${destination.server.replace(/\/+$/, "")}/${destination.topic}`;
}

/** Deep link into signed-in work. Never put access keys or session tokens in the URL. */
export function taskNotificationClick(
  origin: string | null | undefined,
  detail: {
    project?: string | null;
    conversation?: string | null;
    task?: string | null;
  },
) {
  if (!origin || !httpsOrigin.test(origin.replace(/\/+$/, ""))) return undefined;
  const base = origin.replace(/\/+$/, "");
  if (!detail.project) return base;
  const parts = [`project=${encodeURIComponent(detail.project)}`];
  if (detail.conversation)
    parts.push(`conversation=${encodeURIComponent(detail.conversation)}`);
  if (detail.task) parts.push(`task=${encodeURIComponent(detail.task)}`);
  return `${base}/?${parts.join("&")}`;
}

export function loadNotifiedKeys(path: string): Set<string> {
  try {
    const value = JSON.parse(readFileSync(path, "utf8"));
    if (!Array.isArray(value)) return new Set();
    return new Set(value.filter((key): key is string => typeof key === "string"));
  } catch {
    return new Set();
  }
}

export function saveNotifiedKeys(path: string, keys: Set<string>) {
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  const temporary = `${path}.${randomUUID()}`;
  const fd = openSync(temporary, "wx", 0o600);
  try {
    writeFileSync(fd, JSON.stringify([...keys]) + "\n");
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
  try {
    renameSync(temporary, path);
    const dir = openSync(dirname(path), "r");
    try {
      fsyncSync(dir);
    } finally {
      closeSync(dir);
    }
  } finally {
    rmSync(temporary, { force: true });
  }
}

export function rememberNotifiedKey(keys: Set<string>, key: string) {
  keys.add(key);
  if (keys.size > 500)
    for (const old of [...keys].slice(0, keys.size - 400)) keys.delete(old);
}

export async function publishNtfy(
  destination: NtfyDestination,
  payload: NtfyPayload,
  fetchImpl: typeof fetch = fetch,
) {
  const headers: Record<string, string> = {
    Title: payload.title.slice(0, 120),
    "User-Agent": "agentd-notifications/0.80",
  };
  if (payload.click) headers.Click = payload.click;
  if (payload.tags?.length) headers.Tags = payload.tags.slice(0, 5).join(",");
  const response = await fetchImpl(ntfyUrl(destination), {
    method: "POST",
    headers,
    body: payload.message.slice(0, 1000),
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw Error("ntfy delivery refused");
}

export function taskNotificationCopy(
  status: string,
  detail: { projectName?: string | null; adapter?: string | null; error?: string | null },
) {
  const project = detail.projectName?.trim() || "a project";
  const adapter = detail.adapter?.trim() || "agent";
  switch (status) {
    case "waiting_for_approval":
      return {
        title: "AgentD needs approval",
        message: `${adapter} work in ${project} is waiting for approval.`,
        tags: ["bell"],
      };
    case "succeeded":
      return {
        title: "AgentD run finished",
        message: `${adapter} work in ${project} succeeded.`,
        tags: ["white_check_mark"],
      };
    case "failed":
      return {
        title: "AgentD run failed",
        message: `${adapter} work in ${project} failed${
          detail.error ? `: ${detail.error.slice(0, 200)}` : "."
        }`,
        tags: ["x"],
      };
    case "timed_out":
      return {
        title: "AgentD run timed out",
        message: `${adapter} work in ${project} timed out.`,
        tags: ["hourglass"],
      };
    case "interrupted":
      return {
        title: "AgentD run interrupted",
        message: `${adapter} work in ${project} was interrupted.`,
        tags: ["warning"],
      };
    default:
      return null;
  }
}
