export type Request = { op?: unknown; [key: string]: unknown };

export type RequestRoute = {
  name: string;
  operations: readonly string[];
  handle: (input: any) => unknown;
};

export const reviewPreparationOperations = [
  "review-job",
  "review-file",
  "review-file-acknowledge",
  "review-file-page",
  "review-file-page-acknowledge",
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
  "admin-access-rotate",
  "admin-update-start",
  "admin-rollback-start",
  "admin-service-restart",
  "admin-backups-prune",
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

export const serviceReadOperations = [
  "capabilities",
  "operations",
  "audit",
  "admin-diagnostics",
  "admin-updates",
  "admin-service-restart-plan",
  "admin-backups",
] as const;

export const workspaceReadOperations = [
  "projects",
  "archived-projects",
  "history",
  "conversations",
  "conversation-show",
  "list",
] as const;

export const workspaceMutationOperations = [
  "project-checks",
  "project-create",
  "project-register",
  "project-archive",
  "project-restore",
  "project-rename",
  "conversation-restore",
  "conversation-rename",
  "conversation-archive",
] as const;

export const taskOperations = [
  "create",
  "revise",
  "restart-settings",
  "retry",
  "task-output",
  "review",
  "validate",
  "discard",
  "commit",
  "show",
  "approve",
  "cancel",
] as const;

export const supportOperations = [
  "attachment-upload",
  "attachment-read",
  "settings-view",
  "settings-save",
  "models-refresh",
  "storage-preview",
  "storage-cleanup",
] as const;

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
