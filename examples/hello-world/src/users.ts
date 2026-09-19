import { capability, endpoint, event, listener, module } from "@arc/core"
import { object, string } from "./schema.js"

export interface User {
  id: string
  name: string
}

export interface UserRepository {
  find(id: string): Promise<User | undefined>
  create(input: { name: string }): Promise<User>
  all(): Promise<User[]>
}

export interface AuditSink {
  write(entry: string): Promise<void>
}

export const userRepository = capability<UserRepository>("users.repository")
export const auditSink = capability<AuditSink>("audit.sink")

export const UserCreated = event<{ id: string; name: string }>("user.created", { version: 1 })

const UserSchema = object({
  id: string(),
  name: string()
})

const UserListSchema = object({
  count: string(),
  query: string()
})

const GetUserParams = object({
  id: string({ min: 1 })
})

const CreateUserBody = object({
  name: string({ min: 1 })
})

const SearchQuery = object({
  q: string()
})

export const getUser = endpoint({
  method: "GET",
  path: "/users/:id",
  requires: [userRepository],
  input: { params: GetUserParams },
  output: UserSchema,
  async handler(ctx) {
    const user = await ctx.use(userRepository).find(ctx.input.params.id)
    return user ?? { id: ctx.input.params.id, name: "Unknown" }
  }
})

export const createUser = endpoint({
  method: "POST",
  path: "/users",
  status: 201,
  requires: [userRepository],
  emits: [UserCreated],
  input: { body: CreateUserBody },
  output: UserSchema,
  async handler(ctx) {
    const user = await ctx.use(userRepository).create(ctx.input.body)
    await ctx.events.emit(UserCreated, user)
    return user
  }
})

export const searchUsers = endpoint({
  method: "GET",
  path: "/users",
  requires: [userRepository],
  input: { query: SearchQuery },
  output: UserListSchema,
  async handler(ctx) {
    const users = await ctx.use(userRepository).all()
    const query = ctx.input.query.q.toLowerCase()
    const count = users.filter((user) => user.name.toLowerCase().includes(query)).length
    return { count: String(count), query: ctx.input.query.q }
  }
})

export const auditUserCreated = listener({
  event: UserCreated,
  requires: [auditSink],
  async handler(payload, ctx) {
    await ctx.use(auditSink).write(`user.created:${payload.id}:${payload.name}`)
  }
})

export const users = module({
  name: "users",
  endpoints: { getUser, createUser, searchUsers },
  listeners: { auditUserCreated }
})
