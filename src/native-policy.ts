export const testedVersions: Readonly<Record<string, string>> = Object.freeze({
  claude: "2.1.283 (Claude Code)",
  codex: "codex-cli 0.157.1",
  cursor: "2026.09.26-dd393fe",
});
export const claudeMaxTurns = 16;
export function nativeLimits(id: string) {
  return {
    testedVersion: testedVersions[id] ?? null,
    maxTurns: id === "claude" ? claudeMaxTurns : null,
    protocolOutputBytes: ["codex", "cursor"].includes(id) ? 2_000_000 : null,
    protocolTimeoutSeconds: id === "cursor" ? 900 : null,
    usage: "Account quota availability is shown in Operations",
  };
}
