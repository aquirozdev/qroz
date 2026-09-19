import { createCloudflareTracer, type CloudflareTracingLike } from "@arc/telemetry-cloudflare"
import type { AppDefinition, JobEnvelope, MaybePromise, Provider } from "@arc/core"
import { executeJobEnvelope } from "@arc/jobs"

export interface CloudflareQueueMessageLike<T = unknown> {
  readonly id: string
  readonly timestamp: Date
  readonly body: T
  readonly attempts: number
  ack(): void
  retry(options?: { readonly delaySeconds?: number }): void
}

export interface CloudflareMessageBatchLike<T = unknown> {
  readonly queue: string
  readonly messages: readonly CloudflareQueueMessageLike<T>[]
  ackAll(): void
  retryAll(options?: { readonly delaySeconds?: number }): void
}

export interface CloudflareQueueExecutionContextLike {
  waitUntil(promise: Promise<unknown>): void
  readonly tracing?: CloudflareTracingLike
}

export interface CloudflareJobConsumerOptions<Env> {
  readonly providers?: (env: Env, executionCtx: CloudflareQueueExecutionContextLike) => MaybePromise<readonly Provider<any>[]>
  readonly onError?: (error: unknown) => void
}

export interface CloudflareJobConsumerHandler<Env> {
  queue(
    batch: CloudflareMessageBatchLike<JobEnvelope>,
    env: Env,
    executionCtx: CloudflareQueueExecutionContextLike
  ): Promise<void>
}

export function createCloudflareJobConsumer<Env extends object = Record<string, unknown>>(
  application: AppDefinition,
  options: CloudflareJobConsumerOptions<Env> = {}
): CloudflareJobConsumerHandler<Env> {
  return {
    async queue(batch, env, executionCtx) {
      const providers = await options.providers?.(env, executionCtx) ?? []
      const tracer = executionCtx.tracing ? createCloudflareTracer(executionCtx.tracing) : undefined
      for (const message of batch.messages) {
        const outcome = await executeJobEnvelope(application, message.body, {
          providers,
          attempts: message.attempts,
          ...(options.onError ? { onError: options.onError } : {}),
          ...(tracer ? { tracer } : {})
        })
        if (outcome.action === "retry") {
          message.retry(outcome.delaySeconds === undefined ? undefined : { delaySeconds: outcome.delaySeconds })
        } else {
          // Invalid/unknown/non-retryable jobs are poison messages. Explicitly ack them
          // so a malformed payload cannot consume the queue retry budget forever.
          message.ack()
        }
      }
    }
  }
}
