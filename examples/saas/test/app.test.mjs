import test from "node:test"
import assert from "node:assert/strict"

import { app, buildApplication, inspect, module } from "@arc/core"
import { planDeployment } from "@arc/deployment"
import { createTestClient } from "@arc/testing"
import application from "../dist/app.js"
import {
  membershipRepository,
  projectRepository,
  renameProject
} from "../dist/projects.js"

function client(principal) {
  return createTestClient(application, {
    context: principal ? { principal } : undefined
  })
}

test("requires authentication before evaluating tenant policy", async () => {
  const response = await client().patch("/projects/project-a", {
    json: { name: "Renamed" }
  })

  assert.equal(response.status, 401)
})

test("static permission does not bypass tenant resource policy", async () => {
  const response = await client({
    id: "user-b",
    permissions: ["projects.update"]
  }).patch("/projects/project-a", {
    json: { name: "Cross tenant write" }
  })

  assert.equal(response.status, 403)
  assert.deepEqual(await response.json(), {
    error: "Permission denied",
    code: "ARC3002",
    policy: "projects.member"
  })
})

test("tenant member with permission can mutate the resource", async () => {
  const response = await client({
    id: "user-a",
    permissions: ["projects.update"]
  }).patch("/projects/project-a", {
    json: { name: "Alpha renamed" }
  })

  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), {
    id: "project-a",
    tenantId: "tenant-a",
    name: "Alpha renamed"
  })
})

test("Application Graph includes policy capabilities in the endpoint surface", () => {
  const graph = inspect(application)
  const endpoint = graph.modules
    .find((item) => item.name === "projects")
    .endpoints.find((item) => item.name === "renameProject")

  assert.deepEqual(endpoint.requires.sort(), [
    "projects.repository",
    "tenants.memberships"
  ])
  assert.deepEqual(endpoint.access, [{
    capability: "tenants.memberships",
    operations: ["read"]
  }])
})

test("deployment planning includes least-privilege resource access required by policies", () => {
  const plan = planDeployment(application)
  const surface = plan.surfaces.find((item) => item.id === "endpoint:projects.renameProject")

  assert.deepEqual(surface.resourceAccess, [{
    capability: "tenants.memberships",
    resourceType: "membership-store",
    operations: ["read"],
    unrestricted: false,
    reason: "declared"
  }])
})

test("build fails when a policy dependency has no provider", () => {
  const broken = app({
    name: "saas-broken",
    providers: application.providers.filter((provider) => provider.capability !== membershipRepository),
    modules: [module({
      name: "projects",
      endpoints: { renameProject }
    })]
  })

  assert.throws(
    () => buildApplication(broken),
    (error) => error.code === "ARC1004"
      && error.details.owner === "projects.renameProject.policy:projects.member"
  )
})

test("policy cannot access a capability it did not declare", async () => {
  const sneakyEndpoint = {
    ...renameProject,
    auth: {
      ...renameProject.auth,
      policies: [{
        name: "projects.sneaky",
        async evaluate(ctx) {
          ctx.use(membershipRepository)
          return true
        }
      }]
    }
  }
  const sneakyApp = app({
    name: "saas-sneaky",
    providers: application.providers,
    modules: [module({
      name: "projects",
      endpoints: { sneakyEndpoint }
    })]
  })

  let captured
  const response = await createTestClient(sneakyApp, {
    context: {
      principal: {
        id: "user-a",
        permissions: ["projects.update"]
      }
    },
    onError(error) {
      captured = error
    }
  }).patch("/projects/project-a", {
    json: { name: "Should fail" }
  })

  assert.equal(response.status, 500)
  assert.equal(captured.code, "ARC1005")
  assert.equal(captured.details.owner, "projects.sneakyEndpoint.policy:projects.sneaky")
  assert.equal(captured.details.capability, "tenants.memberships")
})
