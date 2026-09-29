// Metadata only: never creates a native session/thread or sends a model prompt.
import { join } from "node:path";
import { discoverModels } from "../src/model-catalog.ts";
import { durableJSON } from "../src/credentials.ts";
const root = process.env.AGENTD_STATE_DIR ?? "/srv/agentd/state";
for (const id of ["claude", "codex", "cursor"]) {
  try {
    const models = await discoverModels(id, new AbortController().signal);
    if (!models.length) throw Error();
    durableJSON(join(root, "model-catalog", id + ".json"), {
      models,
      source:
        id === "claude"
          ? "Native CLI aliases; subscription availability checked at run time"
          : "Native model catalog; availability checked again at run time",
      checkedAt: new Date().toISOString(),
      error: null,
    });
    console.log(id + ": native model metadata verified; no model request");
  } catch {
    console.log(
      id +
        ": model metadata unavailable; Provider default remains available. Refresh models in Agent settings after signing in.",
    );
  }
}
