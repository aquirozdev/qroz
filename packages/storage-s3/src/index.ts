import type { ObjectStorage, PutStorageOptions, StorageBody, StorageMetadata, StoredObject } from "@arc/storage"

export interface S3GetObjectOutput {
  readonly Body?: ReadableStream<Uint8Array> | Uint8Array | ArrayBuffer | Blob | string
  readonly ContentLength?: number
  readonly ETag?: string
  readonly ContentType?: string
  readonly Metadata?: Readonly<Record<string, string>>
}

export interface S3HeadObjectOutput {
  readonly ContentLength?: number
  readonly ETag?: string
  readonly ContentType?: string
  readonly Metadata?: Readonly<Record<string, string>>
}

export interface S3PutObjectOutput {
  readonly ETag?: string
}

export interface S3Operations {
  getObject(input: { readonly Bucket: string; readonly Key: string }): Promise<S3GetObjectOutput | null>
  headObject(input: { readonly Bucket: string; readonly Key: string }): Promise<S3HeadObjectOutput | null>
  putObject(input: {
    readonly Bucket: string
    readonly Key: string
    readonly Body: StorageBody
    readonly ContentType?: string
    readonly Metadata?: Readonly<Record<string, string>>
  }): Promise<S3PutObjectOutput>
  deleteObject(input: { readonly Bucket: string; readonly Key: string }): Promise<unknown>
}

function metadata(key: string, value: S3HeadObjectOutput | S3GetObjectOutput): StorageMetadata {
  return {
    key,
    ...(value.ContentLength === undefined ? {} : { size: value.ContentLength }),
    ...(value.ETag === undefined ? {} : { etag: value.ETag }),
    ...(value.ContentType === undefined ? {} : { contentType: value.ContentType }),
    ...(value.Metadata === undefined ? {} : { custom: value.Metadata })
  }
}

function bodyToStream(body: NonNullable<S3GetObjectOutput["Body"]>): ReadableStream<Uint8Array> {
  if (body instanceof ReadableStream) return body
  if (typeof body === "string") {
    const bytes = new TextEncoder().encode(body)
    return new ReadableStream({ start(controller) { controller.enqueue(bytes); controller.close() } })
  }
  if (body instanceof Uint8Array) {
    return new ReadableStream({ start(controller) { controller.enqueue(body); controller.close() } })
  }
  if (body instanceof ArrayBuffer) {
    const bytes = new Uint8Array(body)
    return new ReadableStream({ start(controller) { controller.enqueue(bytes); controller.close() } })
  }
  return body.stream() as ReadableStream<Uint8Array>
}

export function createS3Storage(operations: S3Operations, bucket: string): ObjectStorage {
  return {
    async get(key): Promise<StoredObject | null> {
      const object = await operations.getObject({ Bucket: bucket, Key: key })
      if (!object?.Body) return null
      return { ...metadata(key, object), body: bodyToStream(object.Body) }
    },

    async head(key) {
      const object = await operations.headObject({ Bucket: bucket, Key: key })
      return object ? metadata(key, object) : null
    },

    async put(key: string, body: StorageBody, options: PutStorageOptions = {}) {
      const result = await operations.putObject({
        Bucket: bucket,
        Key: key,
        Body: body,
        ...(options.contentType ? { ContentType: options.contentType } : {}),
        ...(options.custom ? { Metadata: options.custom } : {})
      })
      return {
        key,
        ...(result.ETag === undefined ? {} : { etag: result.ETag }),
        ...(options.contentType ? { contentType: options.contentType } : {}),
        ...(options.custom ? { custom: options.custom } : {})
      }
    },

    async delete(key) {
      await operations.deleteObject({ Bucket: bucket, Key: key })
    },

    native() {
      return operations
    }
  }
}
