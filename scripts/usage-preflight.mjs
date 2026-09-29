// Run as the service user. Reads subscription metadata only; never sends a model prompt.
import { probeUsage } from "../src/usage-probe.ts";
import { normalizeCodexUsage } from "../src/provider-usage.ts";
try {
  const result = normalizeCodexUsage(
    await probeUsage(
      process.env.AGENTD_STATE_DIR ?? "/srv/agentd/state",
      new AbortController().signal,
    ),
  );
  console.log(
    "codex: isolated native usage query verified; " +
      result.windows.length +
      " quota windows; no model, reset, purchase or account mutation requested",
  );
} catch {
  console.log(
    "codex: usage unavailable; check CLI compatibility and reconnect in Operations if needed. No model request was submitted.",
  );
  process.exitCode = 1;
}
