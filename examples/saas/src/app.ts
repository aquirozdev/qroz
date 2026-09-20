import { app, provide, withProviders } from "@qroz/core"
import {
  membershipRepository,
  projectRepository,
  projects,
  type MembershipRepository,
  type Project,
  type ProjectRepository
} from "./projects.js"

const records = new Map<string, Project>([
  ["project-a", { id: "project-a", tenantId: "tenant-a", name: "Alpha" }],
  ["project-b", { id: "project-b", tenantId: "tenant-b", name: "Beta" }]
])

const memberships = new Set([
  "user-a:tenant-a",
  "user-b:tenant-b"
])

export const projectsStore: ProjectRepository = {
  async find(id) {
    return records.get(id)
  },
  async rename(id, name) {
    const current = records.get(id)
    if (!current) return undefined
    const updated = { ...current, name }
    records.set(id, updated)
    return updated
  }
}

export const membershipStore: MembershipRepository = {
  async canUpdateProject(userId, tenantId) {
    return memberships.has(`${userId}:${tenantId}`)
  }
}

export const application = app({
  name: "saas-reference",
  modules: [projects]
})

export default withProviders(application, [
  provide(projectRepository, projectsStore),
  provide(membershipRepository, membershipStore)
])
