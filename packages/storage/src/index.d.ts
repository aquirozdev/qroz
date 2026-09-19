import { type Capability } from "@arc/core";
export type StorageBody = string | Uint8Array | ArrayBuffer | Blob | ReadableStream<Uint8Array>;
export interface StorageMetadata {
    readonly key: string;
    readonly size?: number;
    readonly etag?: string;
    readonly contentType?: string;
    readonly custom?: Readonly<Record<string, string>>;
}
export interface StoredObject extends StorageMetadata {
    readonly body: ReadableStream<Uint8Array>;
}
export interface PutStorageOptions {
    readonly contentType?: string;
    readonly custom?: Readonly<Record<string, string>>;
}
export interface ObjectStorage {
    get(key: string): Promise<StoredObject | null>;
    head(key: string): Promise<StorageMetadata | null>;
    put(key: string, body: StorageBody, options?: PutStorageOptions): Promise<StorageMetadata>;
    delete(key: string): Promise<void>;
    native?(): unknown;
}
export declare function storage(name: string): Capability<ObjectStorage>;
export declare function readStorageText(object: StoredObject): Promise<string>;
export declare function probeStorageContract(store: ObjectStorage): Promise<{
    put: true;
    get: true;
    head: true;
    delete: true;
}>;
//# sourceMappingURL=index.d.ts.map