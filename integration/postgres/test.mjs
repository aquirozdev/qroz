import assert from "node:assert/strict"
import { Client } from "pg"
import { drizzle } from "drizzle-orm/node-postgres"
import { sql } from "drizzle-orm"
import { app, endpoint, module, providerScope } from "../../packages/core/dist/index.js"
import { createWebRuntime } from "../../packages/runtime-web/dist/index.js"
import { database, provideDatabase } from "../../packages/database/dist/index.js"

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error("DATABASE_URL is required")

const client = new Client({ connectionString })
await client.connect()
const db = drizzle(client)
const postgres = database("integration.postgres", ["query", "transaction", "sql"])

const AnyOutput = {
  "~standard": {
    version: 1,
    vendor: "integration",
    validate(value) { return { value } }
  }
}

const probe = endpoint({
  method: "POST",
  path: "/database-probe",
  requires: [postgres],
  output: AnyOutput,
  async handler(ctx) {
    const databaseClient = ctx.use(postgres)
    await databaseClient.execute(sql`create table if not exists arc_probe (id serial primary key, value text not null)`)
    await databaseClient.execute(sql`insert into arc_probe (value) values ('arc-v0.6')`)
    const result = await databaseClient.execute(sql`select value from arc_probe order by id desc limit 1`)
    return { value: result.rows[0]?.value }
  }
})

const definition = app({
  name: "postgres-integration",
  modules: [module({ name: "postgres", endpoints: { probe } })]
})
const runtime = createWebRuntime(definition)
let disposed = false
const response = await runtime.fetch(new Request("http://arc.test/database-probe", { method: "POST" }), {
  ...providerScope([provideDatabase(postgres, db)], async () => {
    await client.end()
    disposed = true
  })
})

assert.equal(response.status, 200)
assert.deepEqual(await response.json(), { value: "arc-v0.6" })
assert.equal(disposed, true)
await assert.rejects(() => client.query("select 1"))
console.log("Arc PostgreSQL + Drizzle integration passed")
