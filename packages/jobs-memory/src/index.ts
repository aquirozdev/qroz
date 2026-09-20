import type { AppDefinition, JobEnvelope, Provider } from "@qroz/core"
import { executeJobEnvelope, type JobExecutionOutcome } from "@qroz/jobs"
import type { MemoryQueue, MemoryQueuedMessage } from "@qroz/queue-memory"

export interface MemoryJobRun {
  readonly message: MemoryQueuedMessage<JobEnvelope>
  readonly outcome: JobExecutionOutcome
}

export interface RunMemoryJobsOptions {
  readonly providers?: readonly Provider<any>[]
  readonly attempts?: number
  readonly onError?: (error: unknown) => void
  readonly requeueRetries?: boolean
}

export async function runMemoryJobs(
  application: AppDefinition,
  queue: MemoryQueue<JobEnvelope>,
  options: RunMemoryJobsOptions = {}
): Promise<readonly MemoryJobRun[]> {
  const batch = queue.drain()
  const runs: MemoryJobRun[] = []

  for (const message of batch) {
    const outcome = await executeJobEnvelope(application, message.body, {
      providers: options.providers ?? [],
      attempts: options.attempts ?? 1,
      ...(options.onError ? { onError: options.onError } : {})
    })
    runs.push({ message, outcome })
    if (outcome.action === "retry" && options.requeueRetries !== false) {
      await queue.send(message.body, outcome.delaySeconds === undefined ? undefined : { delaySeconds: outcome.delaySeconds })
    }
  }

  return runs
}
