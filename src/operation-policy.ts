/** Directional admission rules extracted from the runner. This is not a lock.
 * A listed state blocks STARTING the row operation. Existing work keeps its slot.
 * Project-specific ownership, approvals, manager locks and shutdown remain separate.
 */
export const admission = {
  repository: ["repository", "publication", "dependency", "github", "localFolder"],
  publication: ["publication", "repository", "dependency", "github", "localFolder"],
  dependencies: [
    "dependency",
    "repository",
    "publication",
    "worker",
    "account",
    "preparing",
    "queued",
    "localFolder",
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
    "localFolder",
  ],
  models: ["worker", "preparing", "account", "probes", "dependency", "models"],
  githubChange: ["repository", "publication"],
  accountChange: ["worker", "dependency", "preparing", "renewal", "probes", "queued"],
  checks: ["account", "dependency"],
  review: ["worker", "queued"],
  // Importing writes Git metadata into a folder and registers a project; it must not
  // overlap task work, other repository writes, dependency work or publication.
  localFolder: [
    "closing",
    "localFolder",
    "repository",
    "publication",
    "dependency",
    "github",
    "worker",
    "preparing",
    "queued",
  ],
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
    "localFolder",
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
