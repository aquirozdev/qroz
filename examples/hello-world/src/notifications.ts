import { access, capability, endpoint, job, module, type JobEnvelope } from "@arc/core"
import { queue } from "@arc/queue"
import { idempotencyStore } from "@arc/idempotency"
import { object, string } from "./schema.js"

export interface NotificationMessage {
  message: string
}

export interface NotificationDeliverySink {
  deliver(message: string): Promise<void>
}

export const notificationsQueue = queue<NotificationMessage>("notifications", { requires: ["delay"] })
export const notificationJobsQueue = queue<JobEnvelope>("jobs.notifications", { requires: ["delay"] })
export const notificationDeliverySink = capability<NotificationDeliverySink>("notifications.delivery")
export const notificationIdempotency = idempotencyStore("jobs.notifications.idempotency")

const NotificationBody = object({ message: string({ min: 1 }) })
const NotificationResult = object({ queued: string() })
const JobDispatchResult = object({ id: string() })

export const DeliverNotification = job({
  name: "notifications.deliver",
  version: 1,
  transport: notificationJobsQueue,
  input: NotificationBody,
  requires: [notificationDeliverySink],
  retry: { strategy: "exponential", delaySeconds: 5, maxDelaySeconds: 60 },
  idempotency: {
    store: notificationIdempotency,
    leaseSeconds: 30,
    ttlSeconds: 86_400,
    key(input) { return `notification:${input.message}` }
  },
  async handler(input, ctx) {
    await ctx.use(notificationDeliverySink).deliver(input.message)
  }
})

export const enqueueNotification = endpoint({
  method: "POST",
  path: "/notifications",
  requires: [access(notificationsQueue, "publish")],
  input: { body: NotificationBody },
  output: NotificationResult,
  async handler(ctx) {
    await ctx.use(notificationsQueue).send(
      { message: ctx.input.body.message },
      { delaySeconds: 1 }
    )
    return { queued: "yes" }
  }
})

export const dispatchNotification = endpoint({
  method: "POST",
  path: "/notification-jobs",
  dispatches: [DeliverNotification],
  input: { body: NotificationBody },
  output: JobDispatchResult,
  async handler(ctx) {
    const id = await ctx.jobs.dispatch(DeliverNotification, ctx.input.body)
    return { id }
  }
})

export const notifications = module({
  name: "notifications",
  endpoints: { enqueueNotification, dispatchNotification },
  jobs: { DeliverNotification }
})
