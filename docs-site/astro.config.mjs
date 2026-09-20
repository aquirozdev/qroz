import { defineConfig } from "astro/config"
import starlight from "@astrojs/starlight"

export default defineConfig({
  site: "https://docs.example.invalid",
  integrations: [
    starlight({
      title: "Arc",
      description: "Application framework for humans and agents.",
      lastUpdated: true,
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/aquirozdev/arc"
        }
      ],
      editLink: {
        baseUrl: "https://github.com/aquirozdev/arc/edit/main/docs/"
      },
      sidebar: [
        {
          label: "Start",
          items: [
            { label: "Documentation", link: "/" },
            { label: "Getting started", link: "/getting-started/" }
          ]
        },
        { label: "Concepts", items: [{ autogenerate: { directory: "concepts" } }] },
        { label: "Guides", items: [{ autogenerate: { directory: "guides" } }] },
        { label: "Reference", items: [{ autogenerate: { directory: "reference" } }] },
        { label: "Architecture", items: [{ autogenerate: { directory: "architecture" } }] },
        { label: "Platforms", items: [{ autogenerate: { directory: "platforms" } }] },
        { label: "Agents", items: [{ autogenerate: { directory: "agents" } }] },
        { label: "Project", items: [{ autogenerate: { directory: "project" } }] },
        { label: "Research", items: [{ autogenerate: { directory: "research" } }] },
        { label: "Decisions", items: [{ autogenerate: { directory: "decisions" } }] }
      ],
      customCss: ["./src/styles/custom.css"]
    })
  ]
})
