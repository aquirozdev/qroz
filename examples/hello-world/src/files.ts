import { access, endpoint, module } from "@qroz/core"
import { readStorageText, storage } from "@qroz/storage"
import { object, string } from "./schema.js"

export const filesStorage = storage("files")

const FileParams = object({ key: string({ min: 1 }) })
const PutFileBody = object({ key: string({ min: 1 }), content: string() })
const FileResult = object({ key: string(), content: string() })

export const putFile = endpoint({
  method: "POST",
  path: "/files",
  status: 201,
  requires: [access(filesStorage, "write")],
  input: { body: PutFileBody },
  output: FileResult,
  async handler(ctx) {
    const store = ctx.use(filesStorage)
    await store.put(ctx.input.body.key, ctx.input.body.content, { contentType: "text/plain" })
    return { key: ctx.input.body.key, content: ctx.input.body.content }
  }
})

export const getFile = endpoint({
  method: "GET",
  path: "/files/:key",
  requires: [access(filesStorage, "read")],
  input: { params: FileParams },
  output: FileResult,
  async handler(ctx) {
    const store = ctx.use(filesStorage)
    const object = await store.get(ctx.input.params.key)
    return {
      key: ctx.input.params.key,
      content: object ? await readStorageText(object) : ""
    }
  }
})

export const files = module({
  name: "files",
  endpoints: { putFile, getFile }
})
