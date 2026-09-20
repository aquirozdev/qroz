import { app, endpoint, module } from "@qroz/core"
import { object, string } from "./dist/schema.js"
const Output = object({ ok: string() })
const health = endpoint({ method: "GET", path: "/health", output: Output, handler() { return { ok: "yes" } } })
export default app({ name: "after", modules: [module({ name: "health", endpoints: { health } })] })
