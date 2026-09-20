import { access, capability, endpoint, module } from "@arc/core"
import { object, string } from "./schema.js"

export interface Project {
  id: string
  tenantId: string
  name: string
}

export interface ProjectRepository {
  find(id: string): Promise<Project | undefined>
  rename(id: string, name: string): Promise<Project | undefined>
}

export interface MembershipRepository {
  canUpdateProject(userId: string, tenantId: string): Promise<boolean>
}

export const projectRepository = capability<ProjectRepository>("projects.repository")

export const membershipRepository = capability<MembershipRepository, "read">("tenants.memberships", {
  kind: "resource",
  resourceType: "membership-store",
  operationMethods: {
    read: ["canUpdateProject"]
  }
})

const ProjectParams = object({
  id: string({ min: 1 })
})

const RenameProjectBody = object({
  name: string({ min: 1 })
})

const ProjectSchema = object({
  id: string(),
  tenantId: string(),
  name: string()
})

export const renameProject = endpoint({
  method: "PATCH",
  path: "/projects/:id",
  auth: {
    required: true,
    permissions: ["projects.update"],
    policies: [{
      name: "projects.member",
      requires: [access(membershipRepository, "read")],
      async evaluate(ctx) {
        const project = await ctx.use(projectRepository).find(ctx.input.params.id)
        if (!project) return false
        return ctx.use(membershipRepository).canUpdateProject(ctx.principal.id, project.tenantId)
      }
    }]
  },
  requires: [projectRepository],
  input: {
    params: ProjectParams,
    body: RenameProjectBody
  },
  output: ProjectSchema,
  async handler(ctx) {
    const project = await ctx.use(projectRepository).rename(
      ctx.input.params.id,
      ctx.input.body.name
    )
    return project ?? {
      id: ctx.input.params.id,
      tenantId: "unknown",
      name: ctx.input.body.name
    }
  }
})

export const projects = module({
  name: "projects",
  endpoints: { renameProject }
})
