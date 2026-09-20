import { app, capability, endpoint, module } from "@qroz/core"

const database = capability("example.database")

const output = {
  "~standard": {
    version: 1,
    vendor: "qroz-error-fixture",
    validate(value) {
      return { value }
    }
  }
}

const list = endpoint({
  method: "GET",
  path: "/items",
  requires: [database],
  output,
  handler() {
    return []
  }
})

export default app({
  name: "missing-provider",
  modules: [module({
    name: "items",
    endpoints: { list }
  })]
})
