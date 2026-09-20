import { app, provide, withProviders } from "@qroz/core"
import { taskRepository, tasks, type Task, type TaskRepository } from "./tasks.js"

const records = new Map<string, Task>([
  ["task-1", { id: "task-1", title: "Ship the first Qroz app", completed: false }]
])

let sequence = 1

export const repository: TaskRepository = {
  async find(id) {
    return records.get(id)
  },
  async create(input) {
    sequence += 1
    const task = {
      id: `task-${sequence}`,
      title: input.title,
      completed: false
    }
    records.set(task.id, task)
    return task
  }
}

export const application = app({
  name: "taskboard",
  modules: [tasks]
})

export default withProviders(application, [
  provide(taskRepository, repository)
])
