import { provide, withProviders } from "@qroz/core"
import { createCloudflareWorker } from "@qroz/runtime-cloudflare"
import { createCloudflareJobConsumer } from "@qroz/jobs-cloudflare"
import { createR2Storage, type R2BucketLike } from "@qroz/storage-r2"
import { createCloudflareQueue, type CloudflareQueueBindingLike } from "@qroz/queue-cloudflare"
import { provideQueue } from "@qroz/queue"
import { provideIdempotencyStore } from "@qroz/idempotency"
import { createDurableObjectIdempotencyStore, type DurableObjectNamespaceLike } from "@qroz/idempotency-cloudflare-do"
import { notificationDeliverySink, notificationIdempotency, notificationJobsQueue, notificationsQueue, type NotificationMessage } from "./notifications.js"
import type { JobEnvelope } from "@qroz/core"
import { application, audit, repository } from "./app.js"
import { filesStorage } from "./files.js"
import { auditSink, userRepository } from "./users.js"

export interface Env {
  FILES: R2BucketLike
  NOTIFICATIONS: CloudflareQueueBindingLike<NotificationMessage>
  JOBS: CloudflareQueueBindingLike<JobEnvelope>
  IDEMPOTENCY: DurableObjectNamespaceLike
}

const cloudflareApplication = withProviders(application, [
  provide(userRepository, repository),
  provide(auditSink, audit)
])

const http = createCloudflareWorker<Env>(cloudflareApplication, {
  providers(env) {
    return [
      provide(filesStorage, createR2Storage(env.FILES)),
      provideQueue(notificationsQueue, createCloudflareQueue(env.NOTIFICATIONS)),
      provideQueue(notificationJobsQueue, createCloudflareQueue(env.JOBS))
    ]
  }
})

const jobs = createCloudflareJobConsumer<Env>(cloudflareApplication, {
  providers(env) {
    return [
      provideQueue(notificationJobsQueue, createCloudflareQueue(env.JOBS)),
      provideIdempotencyStore(notificationIdempotency, createDurableObjectIdempotencyStore(env.IDEMPOTENCY)),
      provide(notificationDeliverySink, {
        async deliver(message: string) {
          console.log("deliver notification", message)
        }
      })
    ]
  }
})

export default {
  fetch: http.fetch,
  queue: jobs.queue
}
