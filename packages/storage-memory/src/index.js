async function toBytes(body) {
    if (typeof body === "string")
        return new TextEncoder().encode(body);
    if (body instanceof Uint8Array)
        return body.slice();
    if (body instanceof ArrayBuffer)
        return new Uint8Array(body.slice(0));
    if (body instanceof Blob)
        return new Uint8Array(await body.arrayBuffer());
    return new Uint8Array(await new Response(body).arrayBuffer());
}
function stream(bytes) {
    const copy = bytes.slice();
    return new ReadableStream({
        start(controller) {
            controller.enqueue(copy);
            controller.close();
        }
    });
}
function metadata(key, entry) {
    return {
        key,
        size: entry.bytes.byteLength,
        etag: entry.etag,
        ...(entry.contentType ? { contentType: entry.contentType } : {}),
        ...(entry.custom ? { custom: entry.custom } : {})
    };
}
export function createMemoryStorage() {
    const objects = new Map();
    let version = 0;
    return {
        async get(key) {
            const entry = objects.get(key);
            if (!entry)
                return null;
            return { ...metadata(key, entry), body: stream(entry.bytes) };
        },
        async head(key) {
            const entry = objects.get(key);
            return entry ? metadata(key, entry) : null;
        },
        async put(key, body, options = {}) {
            const bytes = await toBytes(body);
            const entry = {
                bytes,
                etag: `memory-${++version}`,
                ...(options.contentType ? { contentType: options.contentType } : {}),
                ...(options.custom ? { custom: Object.freeze({ ...options.custom }) } : {})
            };
            objects.set(key, entry);
            return metadata(key, entry);
        },
        async delete(key) {
            objects.delete(key);
        },
        native() {
            return objects;
        }
    };
}
//# sourceMappingURL=index.js.map