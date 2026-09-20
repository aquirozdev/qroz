import test from "node:test"
import assert from "node:assert/strict"
import { probeStorageContract, readStorageText } from "@qroz/storage"
import { createMemoryStorage } from "@qroz/storage-memory"
import { createR2Storage } from "@qroz/storage-r2"

function fakeR2() {
  const objects = new Map()
  let version = 0
  const toBytes = async (value) => {
    if (typeof value === "string") return new TextEncoder().encode(value)
    if (value instanceof Uint8Array) return value.slice()
    if (value instanceof ArrayBuffer) return new Uint8Array(value.slice(0))
    if (value instanceof Blob) return new Uint8Array(await value.arrayBuffer())
    return new Uint8Array(await new Response(value).arrayBuffer())
  }
  const object = (key, entry, withBody) => ({
    key,
    size: entry.bytes.byteLength,
    etag: entry.etag,
    httpMetadata: entry.httpMetadata,
    customMetadata: entry.customMetadata,
    ...(withBody ? { body: new ReadableStream({ start(c) { c.enqueue(entry.bytes.slice()); c.close() } }) } : {})
  })
  return {
    async get(key) { const e = objects.get(key); return e ? object(key, e, true) : null },
    async head(key) { const e = objects.get(key); return e ? object(key, e, false) : null },
    async put(key, value, options = {}) {
      const entry = { bytes: await toBytes(value), etag: `r2-${++version}`, ...options }
      objects.set(key, entry)
      return object(key, entry, false)
    },
    async delete(key) { objects.delete(key) }
  }
}

test("memory storage satisfies the shared object storage contract", async () => {
  assert.deepEqual(await probeStorageContract(createMemoryStorage()), {
    put: true, get: true, head: true, delete: true
  })
})

test("R2 adapter satisfies the same storage contract", async () => {
  assert.deepEqual(await probeStorageContract(createR2Storage(fakeR2())), {
    put: true, get: true, head: true, delete: true
  })
})

test("storage supports streaming bodies and metadata", async () => {
  const store = createMemoryStorage()
  await store.put("avatar.txt", "hello", { contentType: "text/plain", custom: { owner: "123" } })
  const object = await store.get("avatar.txt")
  assert.ok(object)
  assert.equal(object.contentType, "text/plain")
  assert.deepEqual(object.custom, { owner: "123" })
  assert.equal(await readStorageText(object), "hello")
})
