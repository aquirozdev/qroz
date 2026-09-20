import { readFile, readdir } from "node:fs/promises"
import { join } from "node:path"

const root = process.cwd()
const failures = []

const agents = await readFile(join(root, "AGENTS.md"), "utf8")
const claude = await readFile(join(root, "CLAUDE.md"), "utf8")
const marker = "<!-- GENERATED from AGENTS.md by scripts/check-agent-compat.mjs conventions. Do not edit independently. -->\n\n"
if (claude !== marker + agents) {
  failures.push("CLAUDE.md drifted from canonical AGENTS.md")
}

const canonicalSkills = join(root, ".agents", "skills")
const adapters = [
  [".github", "skills"],
  [".claude", "skills"]
]

for (const entry of await readdir(canonicalSkills, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue
  const canonical = await readFile(join(canonicalSkills, entry.name, "SKILL.md"), "utf8")
  for (const parts of adapters) {
    const path = join(root, ...parts, entry.name, "SKILL.md")
    try {
      const actual = await readFile(path, "utf8")
      if (actual !== canonical) failures.push(`${path.slice(root.length + 1)} drifted from .agents/skills/${entry.name}/SKILL.md`)
    } catch {
      failures.push(`missing adapter skill: ${path.slice(root.length + 1)}`)
    }
  }
}

const requiredAdapters = {
  ".claude/agents": ["arc-architect.md", "arc-reviewer.md", "arc-implementer.md", "arc-docs.md"],
  ".opencode/agents": ["arc-architect.md", "arc-reviewer.md", "arc-implementer.md", "arc-docs.md"],
  ".codex/agents": ["arc-architect.toml", "arc-reviewer.toml", "arc-implementer.toml", "arc-docs.toml"]
}

for (const [dir, expected] of Object.entries(requiredAdapters)) {
  const names = new Set(await readdir(join(root, dir)))
  for (const file of expected) {
    if (!names.has(file)) failures.push(`missing agent adapter: ${dir}/${file}`)
  }
}

if (failures.length) {
  console.error("Agent compatibility check failed:\n")
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log("Agent compatibility: AGENTS/CLAUDE instructions, shared skills, and Codex/Claude/OpenCode adapters are synchronized.")
