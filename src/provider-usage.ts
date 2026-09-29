/** Only normalized provider fields cross into Operations. No raw identity or messages. */
export type UsageWindow = {
  bucket: string;
  period: "primary" | "secondary";
  usedPercent: number;
  remainingPercent: number;
  durationMins: number | null;
  resetsAt: string | null;
};
export type UsageData = {
  windows: UsageWindow[];
  credits: {
    bucket: string;
    hasCredits: boolean | null;
    unlimited: boolean | null;
    balance: string | null;
  }[];
  resetCredits: number | null;
};
export function normalizeCodexUsage(raw: any): UsageData {
  const map = raw?.rateLimitsByLimitId;
  if (map != null && (typeof map !== "object" || Array.isArray(map)))
    throw Error("Unsupported usage response");
  const entries: [string, any][] =
    map && typeof map === "object" && !Array.isArray(map)
      ? Object.entries(map)
      : raw?.rateLimits
        ? [["codex", raw.rateLimits]]
        : [];
  if (entries.length > 30) throw Error("Unsupported usage response");
  const windows: UsageWindow[] = [],
    credits: UsageData["credits"] = [];
  for (const [key, value] of entries) {
    if (!/^[a-zA-Z0-9_.-]{1,80}$/.test(key) || !value || typeof value !== "object")
      continue;
    for (const period of ["primary", "secondary"] as const) {
      const w = value[period];
      if (
        !w ||
        typeof w.usedPercent !== "number" ||
        !Number.isFinite(w.usedPercent) ||
        w.usedPercent < 0 ||
        w.usedPercent > 100000
      )
        continue;
      const reset =
        Number.isSafeInteger(w.resetsAt) && w.resetsAt > 0 && w.resetsAt < 8640000000000
          ? new Date(w.resetsAt * 1000).toISOString()
          : null;
      windows.push({
        bucket: key,
        period,
        usedPercent: w.usedPercent,
        remainingPercent: Math.max(0, 100 - w.usedPercent),
        durationMins:
          Number.isSafeInteger(w.windowDurationMins) && w.windowDurationMins > 0
            ? w.windowDurationMins
            : null,
        resetsAt: reset,
      });
    }
    const c = value.credits;
    if (c && typeof c === "object") {
      const balance =
        typeof c.balance === "string" && /^\d{1,18}(?:\.\d{1,8})?$/.test(c.balance)
          ? c.balance
          : null;
      credits.push({
        bucket: key,
        hasCredits: typeof c.hasCredits === "boolean" ? c.hasCredits : null,
        unlimited: typeof c.unlimited === "boolean" ? c.unlimited : null,
        balance,
      });
    }
  }
  const count = raw?.rateLimitResetCredits?.availableCount;
  const resetCredits =
    Number.isSafeInteger(count) && count >= 0 && count <= 100000 ? count : null;
  if (!windows.length && !credits.length && resetCredits === null)
    throw Error("Usage unavailable");
  return { windows, credits, resetCredits };
}
export function usageCache(now = Date.now) {
  let value: UsageData | undefined,
    checkedAt = 0,
    attemptedAt: number | null = null,
    failed = false;
  return {
    due: () => attemptedAt === null || now() - attemptedAt >= 60000,
    begin: () => {
      attemptedAt = now();
    },
    save(raw: any) {
      value = normalizeCodexUsage(raw);
      checkedAt = now();
      failed = false;
    },
    fail() {
      failed = true;
    },
    clear() {
      value = undefined;
      checkedAt = 0;
      attemptedAt = null;
      failed = false;
    },
    view(id: string) {
      const url =
        id === "codex"
          ? "https://chatgpt.com/codex/settings/usage"
          : id === "claude"
            ? "https://claude.ai/settings/usage"
            : "https://cursor.com/dashboard";
      if (id !== "codex" || !value)
        return {
          state: "unavailable",
          checkedAt: null,
          windows: [],
          credits: [],
          resetCredits: null,
          url,
          message:
            id === "codex"
              ? "Usage has not been verified. Refresh while idle; reconnect if the session has expired."
              : "No supported read-only usage query is integrated. Open the provider usage page.",
        };
      const stale =
        failed ||
        now() - checkedAt >= 300000 ||
        value.windows.some((w) => w.resetsAt && Date.parse(w.resetsAt) <= now());
      return {
        ...value,
        state: stale ? "stale" : "available",
        checkedAt: new Date(checkedAt).toISOString(),
        url,
        message: stale
          ? "Last known usage. Refresh to verify current allowance; a passed reset time does not confirm replenishment."
          : "Provider-reported account usage; activity outside agentd also counts.",
      };
    },
  };
}
// Canonical native-wire subset, safe to emit from the isolated probe and validate again.
export function usageResponse(data: UsageData) {
  const rateLimitsByLimitId: Record<string, any> = Object.create(null);
  for (const w of data.windows) {
    const b = (rateLimitsByLimitId[w.bucket] ??= {});
    b[w.period] = {
      usedPercent: w.usedPercent,
      windowDurationMins: w.durationMins,
      resetsAt: w.resetsAt ? Date.parse(w.resetsAt) / 1000 : null,
    };
  }
  for (const c of data.credits)
    (rateLimitsByLimitId[c.bucket] ??= {}).credits = {
      hasCredits: c.hasCredits,
      unlimited: c.unlimited,
      balance: c.balance,
    };
  return {
    rateLimitsByLimitId,
    rateLimitResetCredits:
      data.resetCredits === null ? null : { availableCount: data.resetCredits },
  };
}
