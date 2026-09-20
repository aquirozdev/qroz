import { defineCollection } from "astro:content"
import { docsLoader } from "@astrojs/starlight/loaders"
import { docsSchema } from "@astrojs/starlight/schema"

export const collections = {
  docs: defineCollection({
    loader: docsLoader({
      generateId({ entry }) {
        const normalized = entry.replace(/\\/g, "/")
        const withoutExtension = normalized.replace(/\.md$/i, "")
        if (withoutExtension.toLowerCase() === "readme") return "index"
        return withoutExtension.replace(/\/README$/i, "/index")
      }
    }),
    schema: docsSchema()
  })
}
