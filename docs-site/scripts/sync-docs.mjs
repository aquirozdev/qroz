import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises"
import { basename, dirname, extname, join, relative, resolve, sep } from "node:path"

const siteRoot = resolve(import.meta.dirname, "..")
const repositoryRoot = resolve(siteRoot, "..")
const sourceRoot = join(repositoryRoot, "docs")
const targetRoot = join(siteRoot, "src", "content", "docs")
const publicRoot = join(siteRoot, "public")

function routeFor(relativePath) {
  const normalized = relativePath.split(sep).join("/")
  const withoutName = normalized.replace(/README\.md$/i, "").replace(/\.md$/i, "")
  return withoutName ? `/${withoutName}` : "/"
}

function rewriteRelativeMarkdownLinks(markdown) {
  return markdown.replace(/\]\(([^)]+\.md)(#[^)]+)?\)/g, (_match, path, hash = "") => {
    if (/^[a-z]+:/i.test(path)) return _match
    if (path.endsWith("/README.md") || path === "README.md") {
      return `](${path.replace(/README\.md$/i, "")}${hash})`
    }
    return `](${path.replace(/\.md$/i, "")}${hash})`
  })
}

function titleFromFrontmatter(markdown, fallback) {
  const match = markdown.match(/^---\n[\s\S]*?^title:\s*(.+?)\s*$[\s\S]*?^---/m)
  return match?.[1]?.replace(/^["']|["']$/g, "") ?? fallback
}

async function walk(directory) {
  const output = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) output.push(...await walk(path))
    else if (entry.isFile() && extname(entry.name).toLowerCase() === ".md") output.push(path)
  }
  return output
}

await rm(targetRoot, { recursive: true, force: true })
await mkdir(targetRoot, { recursive: true })
await mkdir(publicRoot, { recursive: true })

const pages = []
for (const sourcePath of await walk(sourceRoot)) {
  const sourceRelative = relative(sourceRoot, sourcePath)
  const targetRelative = sourceRelative
  const targetPath = join(targetRoot, targetRelative)
  const markdown = rewriteRelativeMarkdownLinks(await readFile(sourcePath, "utf8"))

  await mkdir(dirname(targetPath), { recursive: true })
  await writeFile(targetPath, markdown, "utf8")

  pages.push({
    title: titleFromFrontmatter(markdown, basename(sourceRelative, ".md")),
    route: routeFor(sourceRelative)
  })
}

pages.sort((left, right) => left.route.localeCompare(right.route))

const llms = [
  "# Arc documentation",
  "",
  "> Canonical documentation index generated from the repository's docs/ Markdown.",
  "",
  ...pages.map((page) => `- [${page.title}](${page.route})`),
  ""
].join("\n")

await writeFile(join(publicRoot, "llms.txt"), llms, "utf8")
console.log(`Projected ${pages.length} canonical documentation pages into Starlight.`)
