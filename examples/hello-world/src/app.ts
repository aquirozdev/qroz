import { app, provide, withProviders } from "@arc/core"
import { createMemoryStorage } from "@arc/storage-memory"
import { createMemoryQueue } from "@arc/queue-memory"
import { provideQueue } from "@arc/queue"
import { notifications, notificationsQueue, notificationJobsQueue, notificationDeliverySink, type NotificationMessage } from "./notifications.js"
import { files, filesStorage } from "./files.js"
import { auditSink, type AuditSink, userRepository, type User, type UserRepository, users } from "./users.js"

const records = new Map<string, User>([["123", { id: "123", name: "Angel" }]])
let sequence = 0

export const auditEntries: string[] = []
export const deliveredNotifications: string[] = []

export const repository: UserRepository = {
  async find(id) {
    return records.get(id)
  },
  async create(input) {
    sequence += 1
    const user = { id: `generated-${sequence}`, name: input.name }
    records.set(user.id, user)
    return user
  },
  async all() {
    return [...records.values()]
  }
}

export const audit: AuditSink = {
  async write(entry) {
    auditEntries.push(entry)
  }
}

// Portable application definition: no infrastructure providers.
export const application = app({
  name: "example",
  modules: [users, files, notifications]
})

export const notificationQueueMemory = createMemoryQueue<NotificationMessage>()
export const notificationJobQueueMemory = createMemoryQueue()

// Local/reference composition.
export default withProviders(application, [
  provide(userRepository, repository),
  provide(auditSink, audit),
  provide(filesStorage, createMemoryStorage()),
  provideQueue(notificationsQueue, notificationQueueMemory),
  provideQueue(notificationJobsQueue, notificationJobQueueMemory),
  provide(notificationDeliverySink, { async deliver(message: string) { deliveredNotifications.push(message) } })
])
