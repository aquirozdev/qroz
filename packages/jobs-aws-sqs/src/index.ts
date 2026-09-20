import {
  normalizeProviderSource,
  type AppDefinition,
  type JobEnvelope,
  type MaybePromise,
  type ProviderSource
} from "@qroz/core"
import { executeJobEnvelope } from "@qroz/jobs"

export interface SqsLambdaRecord {
  readonly messageId: string
  readonly body: string
  readonly attributes?: Readonly<Record<string, string | undefined>>
}

export interface SqsLambdaEvent {
  readonly Records: readonly SqsLambdaRecord[]
}

export interface SqsBatchResponse {
  readonly batchItemFailures: readonly { readonly itemIdentifier: string }[]
}

export interface AwsSqsConsumerOptions {
  readonly providers?: (event: SqsLambdaEvent) => MaybePromise<ProviderSource>
  readonly onError?: (error: unknown) => void
}

function receiveCount(record: SqsLambdaRecord): number {
  const parsed = Number.parseInt(record.attributes?.ApproximateReceiveCount ?? "1", 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

export function createAwsSqsJobConsumer(
  application: AppDefinition,
  options: AwsSqsConsumerOptions = {}
): (event: SqsLambdaEvent) => Promise<SqsBatchResponse> {
  return async (event) => {
    const scope = normalizeProviderSource(await options.providers?.(event))
    const failures: { itemIdentifier: string }[] = []

    try {
      for (const record of event.Records) {
        let envelope: JobEnvelope | unknown
        try {
          envelope = JSON.parse(record.body)
        } catch (error) {
          // Invalid JSON is a poison message: report it but do not request retry.
          options.onError?.(error)
          continue
        }

        const outcome = await executeJobEnvelope(application, envelope, {
          providers: scope.providers,
          attempts: receiveCount(record),
          ...(options.onError ? { onError: options.onError } : {})
        })

        if (outcome.action === "retry") {
          failures.push({ itemIdentifier: record.messageId })
        }
      }
    } finally {
      await scope.dispose?.()
    }

    return { batchItemFailures: failures }
  }
}
