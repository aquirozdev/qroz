import type { ObjectStorage, PutStorageOptions, StorageBody, StorageMetadata, StoredObject } from "@arc/storage"

export interface R2ObjectLike {
  readonly key: string
  readonly size: number
  readonly etag: string
  readonly httpMetadata?: { readonly contentType?: string }
  readonly customMetadata?: Readonly<Record<string, string>>
}

export interface R2ObjectBodyLike extends R2ObjectLike {
  readonly body: ReadableStream<Uint8Array>
}

export interface R2BucketLike {
  get(key: string): Promise<R2ObjectBodyLike | R2ObjectLike | null>
  head(key: string): Promise<R2ObjectLike | null>
  put(
    key: string,
    value: StorageBody,
    options?: {
      readonly httpMetadata?: { readonly contentType?: string }
      readonly customMetadata?: Readonly<Record<string, string>>
    }
  ): Promise<R2ObjectLike | null>
  delete(key: string): Promise<void>
}

function metadata(object: R2ObjectLike): StorageMetadata {
  return {
    key: object.key,
    size: object.size,
    etag: object.etag,
    ...(object.httpMetadata?.contentType ? { contentType: object.httpMetadata.contentType } : {}),
    ...(object.customMetadata ? { custom: object.customMetadata } : {})
  }
}

export function createR2Storage(bucket: R2BucketLike): ObjectStorage {
  return {
    async get(key): Promise<StoredObject | null> {
      const object = await bucket.get(key)
      if (!object || !("body" in object)) return null
      return { ...metadata(object), body: object.body }
    },

    async head(key) {
      const object = await bucket.head(key)
      return object ? metadata(object) : null
    },

    async put(key: string, body: StorageBody, options: PutStorageOptions = {}) {
      const object = await bucket.put(key, body, {
        ...(options.contentType ? { httpMetadata: { contentType: options.contentType } } : {}),
        ...(options.custom ? { customMetadata: options.custom } : {})
      })
      if (!object) throw new Error(`R2 put for '${key}' did not produce an object`)
      return metadata(object)
    },

    delete(key) {
      return bucket.delete(key)
    },

    native() {
      return bucket
    }
  }
}
