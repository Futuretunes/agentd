export type Request = { op?: unknown; [key: string]: unknown };

export type RequestRoute = {
  name: string;
  operations: readonly string[];
  handle: (input: any) => unknown;
};

export const reviewPreparationOperations = [
  "review-job",
  "review-cancel",
  "review-start",
  "validation-job",
  "validation-cancel",
  "validation-start",
  "commit-job",
  "commit-cancel",
  "commit-start",
  "revision-job",
  "revision-cancel",
  "revision-start",
  "restart-job",
  "restart-cancel",
  "restart-start",
] as const;

export const managedOperationOperations = [
  "feedback-targets",
  "feedback-status",
  // Local compatibility name used by publication lifecycle tests and admin clients.
  "feedback-preview",
  "feedback-prepare",
  "feedback-apply",
  "feedback-cancel",
  "publication-targets",
  "publication-status",
  "publication-preview",
  "publication-approve",
  "check-setup",
  "check-prepare",
  "check-cancel",
  "github-status",
  "github-start",
  "github-cancel",
  "github-logout",
  "repository-jobs",
  "repository-start",
  "repository-cancel",
  "account-session",
  "account-start",
  "account-code",
  "account-cancel",
  "account-refresh",
] as const;

export const serviceReadOperations = ["capabilities", "operations", "audit"] as const;

/**
 * Build the runner's operation table once at startup. An operation has one owner;
 * duplicate claims fail before either handler can receive a request.
 */
export function requestRouter(
  routes: readonly RequestRoute[],
  fallback: (input: any) => unknown,
) {
  const handlers = new Map<string, RequestRoute>();
  for (const route of routes) {
    if (!route.name || !route.operations.length) throw Error("Invalid request route");
    for (const operation of route.operations) {
      if (!operation || handlers.has(operation))
        throw Error(`Duplicate request operation: ${operation}`);
      handlers.set(operation, route);
    }
  }
  return (input: Request) => {
    if (!input || typeof input !== "object" || typeof input.op !== "string")
      return fallback(input);
    return (handlers.get(input.op)?.handle ?? fallback)(input);
  };
}
