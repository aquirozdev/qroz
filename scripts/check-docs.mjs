import { readdir, readFile, stat } from "node:fs/promises"
import { dirname, extname, join, normalize, resolve } from "node:path"

const root = process.cwd()
const docsRoot = join(root, "docs")
const failures = []

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) files.push(...await walk(path))
    else if (entry.isFile() && extname(entry.name) === ".md") files.push(path)
  }
  return files
}

const files = [
  join(root, "README.md"),
  join(root, "CONTRIBUTING.md"),
  join(root, "SECURITY.md"),
  join(root, "AGENTS.md"),
  ...await walk(docsRoot)
]

for (const file of files) {
  const content = await readFile(file, "utf8")
  const links = [...content.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)].map(match => match[1])

  for (const rawHref of links) {
    if (!rawHref || rawHref.startsWith("#") || /^[a-z]+:/i.test(rawHref) || rawHref.startsWith("mailto:")) continue
    const href = rawHref.split("#", 1)[0]
    if (!href) continue
    const target = normalize(resolve(dirname(file), decodeURIComponent(href)))
    try {
      await stat(target)
    } catch {
      failures.push(`${file.slice(root.length + 1)} -> missing local link: ${rawHref}`)
    }
  }
}

const navigation = JSON.parse(await readFile(join(docsRoot, "navigation.json"), "utf8"))
for (const section of navigation.sections ?? []) {
  for (const page of section.pages ?? []) {
    try {
      await stat(join(docsRoot, page))
    } catch {
      failures.push(`docs/navigation.json -> missing page: ${page}`)
    }
  }
}

if (failures.length) {
  console.error("Documentation integrity check failed:\n")
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`Documentation integrity: ${files.length} Markdown files checked; all local links/navigation targets resolve.`)
