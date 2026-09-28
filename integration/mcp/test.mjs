import assert from "node:assert/strict"
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client"
import { createMcpHandler, McpServer } from "@modelcontextprotocol/server"
import * as z from "zod/v4"
import application from "../../examples/hello-world/dist/app.js"
import { explainError, inspect, inspectModuleContext } from "../../packages/core/dist/index.js"
import { planDeployment } from "../../packages/deployment/dist/index.js"

function jsonResult(value) {
  return {
    content: [{ type: "text", text: JSON.stringify(value) }],
    structuredContent: value
  }
}

function createArcMcpServer() {
  const server = new McpServer({ name: "qroz", version: "0.7.0" })

  server.registerTool("qroz.inspect", {
    description: "Return Qroz's deterministic Application Graph.",
    inputSchema: z.object({})
  }, async () => jsonResult(inspect(application)))

  server.registerTool("qroz.plan", {
    description: "Return Qroz's provider-neutral deployment plan and execution-surface resource access.",
    inputSchema: z.object({})
  }, async () => jsonResult(planDeployment(application)))

  server.registerTool("qroz.context", {
    description: "Return compact semantic context for one Qroz module.",
    inputSchema: z.object({ module: z.string().min(1) })
  }, async ({ module }) => {
    const context = inspectModuleContext(application, module)
    if (!context) return { content: [{ type: "text", text: `Unknown Qroz module: ${module}` }], isError: true }
    return jsonResult(context)
  })

  server.registerTool("qroz.explain", {
    description: "Explain a stable ARCxxxx framework error code.",
    inputSchema: z.object({ code: z.string().regex(/^ARC\d{4}$/) })
  }, async ({ code }) => {
    const descriptor = explainError(code)
    if (!descriptor) return { content: [{ type: "text", text: `Unknown Qroz error code: ${code}` }], isError: true }
    return jsonResult(descriptor)
  })

  return server
}

const handler = createMcpHandler(createArcMcpServer)
const transport = new StreamableHTTPClientTransport(new URL("http://qroz.test/mcp"), {
  fetch: (url, init) => handler.fetch(new Request(url, init))
})
const client = new Client({ name: "qroz-integration-test", version: "1.0.0" })
await client.connect(transport)

const listed = await client.listTools()
const names = listed.tools.map((tool) => tool.name).sort()
assert.deepEqual(names, ["qroz.context", "qroz.explain", "qroz.inspect", "qroz.plan"])

const inspectResult = await client.callTool({ name: "qroz.inspect", arguments: {} })
const graph = JSON.parse(inspectResult.content[0].text)
assert.equal(graph.name, "example")
assert.ok(graph.modules.some((mod) => mod.name === "users"))

const planResult = await client.callTool({ name: "qroz.plan", arguments: {} })
const plan = JSON.parse(planResult.content[0].text)
assert.ok(plan.surfaces.some((surface) =>
  surface.id === "endpoint:files.putFile" &&
  surface.resourceAccess.some((access) => access.operations.includes("write"))
))

const contextResult = await client.callTool({ name: "qroz.context", arguments: { module: "users" } })
const context = JSON.parse(contextResult.content[0].text)
assert.equal(context.module.name, "users")
assert.ok(context.module.endpoints.some((endpoint) => endpoint.path === "/users/:id"))

const explainResult = await client.callTool({ name: "qroz.explain", arguments: { code: "ARC1004" } })
const explanation = JSON.parse(explainResult.content[0].text)
assert.equal(explanation.code, "ARC1004")

await transport.close()
console.log("Qroz MCP v2 read-only integration passed")
