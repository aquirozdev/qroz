import { access, app, capability, endpoint, module, provide, withProviders } from "@qroz/core"

const store = capability("review.store", {
  kind: "resource",
  resourceType: "object-store",
  operationMethods: {
    read: ["get"],
    write: ["put"]
  }
})

const output = {
  "~standard": {
    version: 1,
    vendor: "qroz-diff-fixture",
    validate(value) {
      return { value }
    }
  }
}

const readItem = endpoint({
  method: "GET",
  path: "/items/:id",
  auth: {
    required: true,
    permissions: ["items.read"]
  },
  requires: [access(store, "read")],
  output,
  async handler() {
    return { ok: true }
  }
})

const items = module({
  name: "items",
  endpoints: { readItem }
})

export default withProviders(app({
  name: "change-review",
  modules: [items]
}), [
  provide(store, {
    async get() {},
    async put() {}
  })
])
