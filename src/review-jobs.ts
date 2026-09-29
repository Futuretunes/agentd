import { randomUUID } from "node:crypto";
import { operationSlot } from "./operation-slot.ts";
import { prepareReview, type ReviewInput } from "./review-preview.ts";
import { publicError } from "./public-errors.ts";
export function reviewJobs(prepare = prepareReview, settled = () => {}) {
  const slot = operationSlot("review-preview");
  const jobs = new Map<string, any>();
  function view(owner: string, id: string) {
    const job = jobs.get(id);
    if (!job || job.owner !== owner || (!slot.busy() && job.expires < Date.now()))
      throw Error("Review preview expired. Open the review again.");
    const { owner: _, expires: __, task, ...value } = job;
    return { ...value, task };
  }
  return {
    busy: slot.busy,
    view,
    start(
      owner: string,
      task: string,
      input: ReviewInput,
      decorate: (value: any) => any,
    ) {
      const current = slot.view();
      if (current) {
        const existing = jobs.get(current.id);
        if (existing.owner === owner && existing.task === task)
          return view(owner, current.id);
      }
      slot.assertAvailable();
      for (const [id, job] of jobs) if (job.expires < Date.now()) jobs.delete(id);
      while (jobs.size >= 20) jobs.delete(jobs.keys().next().value!);
      const id = randomUUID();
      const job: {
        id: string;
        owner: string;
        task: string;
        status: string;
        expires: number;
        result: any;
        error: string | null;
      } = {
        id,
        owner,
        task,
        status: "preparing",
        expires: Date.now() + 300000,
        result: null,
        error: null,
      };
      jobs.set(id, job);
      void slot.start(
        id,
        async (signal) => {
          try {
            if (signal.aborted) throw Error("Review preparation stopped.");
            const value = await prepare(input, signal);
            if (signal.aborted) throw Error("Review preparation stopped.");
            job.result = decorate(value);
            job.status = "succeeded";
          } catch (error) {
            job.status = signal.aborted ? "cancelled" : "failed";
            job.error = publicError(error);
          } finally {
            job.expires = Date.now() + 300000;
          }
        },
        settled,
      );
      return view(owner, id);
    },
    cancel(owner: string, id: string) {
      view(owner, id);
      slot.cancel(id);
      return view(owner, id);
    },
    close: slot.close,
  };
}
