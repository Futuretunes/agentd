/** Best-effort ntfy delivery. Failures must never affect task state. */
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

export function ntfyUrl(destination: NtfyDestination) {
  if (!serverPattern.test(destination.server) || !topicPattern.test(destination.topic))
    throw Error("Invalid ntfy destination");
  return `${destination.server.replace(/\/+$/, "")}/${destination.topic}`;
}

export async function publishNtfy(
  destination: NtfyDestination,
  payload: NtfyPayload,
  fetchImpl: typeof fetch = fetch,
) {
  const headers: Record<string, string> = {
    Title: payload.title.slice(0, 120),
    "User-Agent": "agentd-notifications/0.79",
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
