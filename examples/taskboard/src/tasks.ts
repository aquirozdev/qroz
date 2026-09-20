import { capability, endpoint, module } from "@qroz/core"
import { boolean, object, string } from "./schema.js"

export interface Task {
  id: string
  title: string
  completed: boolean
}

export interface TaskRepository {
  find(id: string): Promise<Task | undefined>
  create(input: { title: string }): Promise<Task>
}

export const taskRepository = capability<TaskRepository>("tasks.repository")

const TaskSchema = object({
  id: string(),
  title: string(),
  completed: boolean()
})

const TaskParams = object({
  id: string({ min: 1 })
})

const CreateTaskBody = object({
  title: string({ min: 1 })
})

export const getTask = endpoint({
  method: "GET",
  path: "/tasks/:id",
  requires: [taskRepository],
  input: { params: TaskParams },
  output: TaskSchema,
  async handler(ctx) {
    const task = await ctx.use(taskRepository).find(ctx.input.params.id)
    return task ?? {
      id: ctx.input.params.id,
      title: "Unknown",
      completed: false
    }
  }
})

export const createTask = endpoint({
  method: "POST",
  path: "/tasks",
  status: 201,
  requires: [taskRepository],
  input: { body: CreateTaskBody },
  output: TaskSchema,
  async handler(ctx) {
    return ctx.use(taskRepository).create(ctx.input.body)
  }
})

export const tasks = module({
  name: "tasks",
  endpoints: { getTask, createTask }
})
