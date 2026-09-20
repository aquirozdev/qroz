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
        { label: "Concepts", autogenerate: { directory: "concepts" } },
        { label: "Guides", autogenerate: { directory: "guides" } },
        { label: "Reference", autogenerate: { directory: "reference" } },
        { label: "Architecture", autogenerate: { directory: "architecture" } },
        { label: "Platforms", autogenerate: { directory: "platforms" } },
        { label: "Agents", autogenerate: { directory: "agents" } },
        { label: "Project", autogenerate: { directory: "project" } },
        { label: "Research", autogenerate: { directory: "research" } },
        { label: "Decisions", autogenerate: { directory: "decisions" } }
      ],
      customCss: ["./src/styles/custom.css"]
    })
  ]
})
