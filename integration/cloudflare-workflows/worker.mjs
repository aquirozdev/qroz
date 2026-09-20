import { WorkflowEntrypoint } from "cloudflare:workers"

import application from "../../examples/hello-world/dist/app.js"
import { WelcomeUser } from "../../examples/hello-world/dist/workflows.js"
import { executeCloudflareWorkflow } from "../../packages/workflows-cloudflare/dist/index.js"

export class ArcWelcomeWorkflow extends WorkflowEntrypoint {
  async run(event, step) {
    const result = await executeCloudflareWorkflow(
      application,
      WelcomeUser,
      event,
      step
    )
    return result.output
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (request.method === "POST" && url.pathname === "/workflows/welcome") {
      const id = url.searchParams.get("id") ?? crypto.randomUUID()
      const params = await request.json()
      const instance = await env.ARC_WELCOME.create({ id, params })
      return Response.json({ id: instance.id }, { status: 202 })
    }

    if (request.method === "GET" && url.pathname === "/workflows/welcome") {
      const id = url.searchParams.get("id")
      if (!id) {
        return Response.json({ error: "missing id" }, { status: 400 })
      }
      const instance = await env.ARC_WELCOME.get(id)
      return Response.json(await instance.status())
    }

    return new Response("Not Found", { status: 404 })
  }
}
