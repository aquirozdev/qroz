import { capability } from "@arc/core";
export function storage(name) {
    return capability(`storage.${name}`, {
        kind: "resource",
        resourceType: "object-storage",
        features: ["get", "head", "put", "delete", "streaming"]
    });
}
export async function readStorageText(object) {
    return new Response(object.body).text();
}
export async function probeStorageContract(store) {
    const key = `__arc_contract__/${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const content = "arc-storage-contract";
    const saved = await store.put(key, content, {
        contentType: "text/plain",
        custom: { source: "contract" }
    });
    if (saved.key !== key)
        throw new Error("Storage contract failed: put returned wrong key");
    const head = await store.head(key);
    if (!head || head.key !== key)
        throw new Error("Storage contract failed: head did not find object");
    const object = await store.get(key);
    if (!object)
        throw new Error("Storage contract failed: get did not find object");
    if (await readStorageText(object) !== content)
        throw new Error("Storage contract failed: object body mismatch");
    await store.delete(key);
    if (await store.get(key))
        throw new Error("Storage contract failed: delete did not remove object");
    return { put: true, get: true, head: true, delete: true };
}
//# sourceMappingURL=index.js.map