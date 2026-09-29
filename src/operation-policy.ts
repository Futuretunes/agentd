/** Directional admission rules extracted from the runner. This is not a lock.
 * A listed state blocks STARTING the row operation. Existing work keeps its slot.
 * Project-specific ownership, approvals, manager locks and shutdown remain separate.
 */
export const admission = {
  repository: ["repository", "publication", "dependency", "github"],
  publication: ["publication", "repository", "dependency", "github"],
  dependencies: [
    "dependency",
    "repository",
    "publication",
    "worker",
    "account",
    "preparing",
    "queued",
  ],
  feedback: [
    "publication",
    "repository",
    "dependency",
    "worker",
    "account",
    "github",
    "queued",
  ],
  accountProbe: ["probes", "closing", "worker", "models", "account"],
  dispatch: ["closing", "worker", "dependency", "models", "account", "renewalProbe"],
  storage: [
    "worker",
    "preparing",
    "account",
    "dependency",
    "repository",
    "publication",
    "models",
    "unsettled",
    "reviewPreparation",
  ],
  models: ["worker", "preparing", "account", "probes", "dependency", "models"],
  githubChange: ["repository", "publication"],
  accountChange: ["worker", "dependency", "preparing", "renewal", "probes", "queued"],
  checks: ["account", "dependency"],
  review: ["worker", "queued"],
  // Installing an update stops the runner and gateway.
  update: [
    "closing",
    "worker",
    "queued",
    "unsettled",
    "preparing",
    "account",
    "renewal",
    "probes",
    "dependency",
    "repository",
    "publication",
    "github",
    "models",
    "reviewPreparation",
  ],
} as const;
export type Operation = keyof typeof admission;
export type BusyState = (typeof admission)[Operation][number];
// Lazy reads retain short-circuit behavior and avoid unrelated database probes.
export function admissionBlocked(
  operation: Operation,
  read: (state: BusyState) => boolean,
) {
  return admission[operation].some(read);
}
