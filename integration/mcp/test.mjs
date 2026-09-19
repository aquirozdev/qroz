import assert from "node:assert/strict"
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client"
import { createMcpHandler, McpServer } from "@modelcontextprotocol/server"
import * as z from "zod/v4"
import application from "../../examples/hello-world/dist/app.js"
import { explainError, inspect, inspectModuleContext } from "../../packages/core/dist/index.js"

function jsonResult(value) {
  return {
    content: [{ type: "text", text: JSON.stringify(value) }],
    structuredContent: value
  }
}

function createArcMcpServer() {
  const server = new McpServer({ name: "arc", version: "0.7.0" })

  server.registerTool("arc.inspect", {
    description: "Return Arc's deterministic Application Graph.",
    inputSchema: z.object({})
  }, async () => jsonResult(inspect(application)))

  server.registerTool("arc.context", {
    description: "Return compact semantic context for one Arc module.",
    inputSchema: z.object({ module: z.string().min(1) })
  }, async ({ module }) => {
    const context = inspectModuleContext(application, module)
    if (!context) return { content: [{ type: "text", text: `Unknown Arc module: ${module}` }], isError: true }
    return jsonResult(context)
  })

  server.registerTool("arc.explain", {
    description: "Explain a stable ARCxxxx framework error code.",
    inputSchema: z.object({ code: z.string().regex(/^ARC\d{4}$/) })
  }, async ({ code }) => {
    const descriptor = explainError(code)
    if (!descriptor) return { content: [{ type: "text", text: `Unknown Arc error code: ${code}` }], isError: true }
    return jsonResult(descriptor)
  })

  return server
}

const handler = createMcpHandler(createArcMcpServer)
const transport = new StreamableHTTPClientTransport(new URL("http://arc.test/mcp"), {
  fetch: (url, init) => handler.fetch(new Request(url, init))
})
const client = new Client({ name: "arc-integration-test", version: "1.0.0" })
await client.connect(transport)

const listed = await client.listTools()
const names = listed.tools.map((tool) => tool.name).sort()
assert.deepEqual(names, ["arc.context", "arc.explain", "arc.inspect"])

const inspectResult = await client.callTool({ name: "arc.inspect", arguments: {} })
const graph = JSON.parse(inspectResult.content[0].text)
assert.equal(graph.name, "example")
assert.ok(graph.modules.some((mod) => mod.name === "users"))

const contextResult = await client.callTool({ name: "arc.context", arguments: { module: "users" } })
const context = JSON.parse(contextResult.content[0].text)
assert.equal(context.module.name, "users")
assert.ok(context.module.endpoints.some((endpoint) => endpoint.path === "/users/:id"))

const explainResult = await client.callTool({ name: "arc.explain", arguments: { code: "ARC1004" } })
const explanation = JSON.parse(explainResult.content[0].text)
assert.equal(explanation.code, "ARC1004")

await transport.close()
console.log("Arc MCP v2 read-only integration passed")
