import type { ObjectStorage, PutStorageOptions, StorageBody, StorageMetadata, StoredObject } from "@qroz/storage"

type MemoryEntry = {
  bytes: Uint8Array
  contentType?: string
  custom?: Readonly<Record<string, string>>
  etag: string
}

async function toBytes(body: StorageBody): Promise<Uint8Array> {
  if (typeof body === "string") return new TextEncoder().encode(body)
  if (body instanceof Uint8Array) return body.slice()
  if (body instanceof ArrayBuffer) return new Uint8Array(body.slice(0))
  if (body instanceof Blob) return new Uint8Array(await body.arrayBuffer())
  return new Uint8Array(await new Response(body).arrayBuffer())
}

function stream(bytes: Uint8Array): ReadableStream<Uint8Array> {
  const copy = bytes.slice()
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(copy)
      controller.close()
    }
  })
}

function metadata(key: string, entry: MemoryEntry): StorageMetadata {
  return {
    key,
    size: entry.bytes.byteLength,
    etag: entry.etag,
    ...(entry.contentType ? { contentType: entry.contentType } : {}),
    ...(entry.custom ? { custom: entry.custom } : {})
  }
}

export function createMemoryStorage(): ObjectStorage {
  const objects = new Map<string, MemoryEntry>()
  let version = 0

  return {
    async get(key): Promise<StoredObject | null> {
      const entry = objects.get(key)
      if (!entry) return null
      return { ...metadata(key, entry), body: stream(entry.bytes) }
    },

    async head(key) {
      const entry = objects.get(key)
      return entry ? metadata(key, entry) : null
    },

    async put(key: string, body: StorageBody, options: PutStorageOptions = {}) {
      const bytes = await toBytes(body)
      const entry: MemoryEntry = {
        bytes,
        etag: `memory-${++version}`,
        ...(options.contentType ? { contentType: options.contentType } : {}),
        ...(options.custom ? { custom: Object.freeze({ ...options.custom }) } : {})
      }
      objects.set(key, entry)
      return metadata(key, entry)
    },

    async delete(key) {
      objects.delete(key)
    },

    native() {
      return objects
    }
  }
}
