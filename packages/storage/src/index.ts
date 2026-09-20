import { capability, type Capability } from "@qroz/core"

export type StorageBody = string | Uint8Array | ArrayBuffer | Blob | ReadableStream<Uint8Array>

export interface StorageMetadata {
  readonly key: string
  readonly size?: number
  readonly etag?: string
  readonly contentType?: string
  readonly custom?: Readonly<Record<string, string>>
}

export interface StoredObject extends StorageMetadata {
  readonly body: ReadableStream<Uint8Array>
}

export interface PutStorageOptions {
  readonly contentType?: string
  readonly custom?: Readonly<Record<string, string>>
}

export interface ObjectStorage {
  get(key: string): Promise<StoredObject | null>
  head(key: string): Promise<StorageMetadata | null>
  put(key: string, body: StorageBody, options?: PutStorageOptions): Promise<StorageMetadata>
  delete(key: string): Promise<void>
  native?(): unknown
}

export type StorageAccess = "read" | "write" | "delete"

export function storage(name: string): Capability<ObjectStorage, StorageAccess> {
  return capability<ObjectStorage, StorageAccess>(`storage.${name}`, {
    kind: "resource",
    resourceType: "object-storage",
    features: ["get", "head", "put", "delete", "streaming"],
    operationMethods: {
      read: ["get", "head"],
      write: ["put"],
      delete: ["delete"]
    }
  })
}

export async function readStorageText(object: StoredObject): Promise<string> {
  return new Response(object.body).text()
}

export async function probeStorageContract(store: ObjectStorage): Promise<{
  put: true
  get: true
  head: true
  delete: true
}> {
  const key = `__arc_contract__/${Date.now()}-${Math.random().toString(16).slice(2)}`
  const content = "qroz-storage-contract"
  const saved = await store.put(key, content, {
    contentType: "text/plain",
    custom: { source: "contract" }
  })
  if (saved.key !== key) throw new Error("Storage contract failed: put returned wrong key")

  const head = await store.head(key)
  if (!head || head.key !== key) throw new Error("Storage contract failed: head did not find object")

  const object = await store.get(key)
  if (!object) throw new Error("Storage contract failed: get did not find object")
  if (await readStorageText(object) !== content) throw new Error("Storage contract failed: object body mismatch")

  await store.delete(key)
  if (await store.get(key)) throw new Error("Storage contract failed: delete did not remove object")

  return { put: true, get: true, head: true, delete: true }
}
