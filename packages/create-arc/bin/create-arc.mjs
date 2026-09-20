#!/usr/bin/env node
import { mkdir, readdir, writeFile } from "node:fs/promises"
import { basename, resolve } from "node:path"

const args = process.argv.slice(2)
const directory = args.find((arg) => !arg.startsWith("--")) ?? "arc-app"
const target = resolve(process.cwd(), directory)
const yes = args.includes("--yes")

function packageName(input) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "arc-app"
}

async function assertEmpty(path) {
  try {
    const entries = await readdir(path)
    if (entries.length > 0) throw new Error(`target directory '${directory}' is not empty`)
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") return
    throw error
  }
}

const appName = packageName(basename(target))

const files = {
  "package.json": JSON.stringify({
    name: appName,
    private: true,
    version: "0.0.0",
    type: "module",
    scripts: {
      build: "tsc -p tsconfig.json",
      dev: "arc dev src/app.ts --watch",
      test: "npm run build && node --test test/*.test.mjs"
    },
    dependencies: {
      "@arc/core": "latest",
      "@arc/testing": "latest",
      zod: "^4.0.0"
    },
    devDependencies: {
      "@arc/cli": "latest",
      typescript: "^5.8.0"
    }
  }, null, 2) + "\n",
  "tsconfig.json": JSON.stringify({
    compilerOptions: {
      target: "ES2022",
      module: "NodeNext",
      moduleResolution: "NodeNext",
      strict: true,
      outDir: "dist",
      rootDir: "src",
      skipLibCheck: true
    },
    include: ["src/**/*.ts"]
  }, null, 2) + "\n",
  "src/app.ts": `import { app, endpoint, module } from "@arc/core"
import { z } from "zod"

const Health = z.object({
  ok: z.boolean()
})

export const health = endpoint({
  method: "GET",
  path: "/health",
  output: Health,
  handler() {
    return { ok: true }
  }
})

const system = module({
  name: "system",
  endpoints: { health }
})

export default app({
  name: "${appName}",
  modules: [system]
})
`,
  "test/app.test.mjs": `import assert from "node:assert/strict"
import test from "node:test"
import application from "../dist/app.js"
import { createTestClient } from "@arc/testing"

test("health endpoint", async () => {
  const response = await createTestClient(application).get("/health")
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { ok: true })
})
`,
  ".gitignore": "node_modules\ndist\n.env\n",
  "README.md": `# ${appName}

Created with Arc.

## Start

\`\`\`bash
npm install
npm test
npm run dev
\`\`\`

Arc Studio opens from the local development server and uses the same Application Graph as the runtime.
`
}

try {
  await assertEmpty(target)
  await mkdir(target, { recursive: true })
  for (const [relative, content] of Object.entries(files)) {
    const path = resolve(target, relative)
    await mkdir(resolve(path, ".."), { recursive: true })
    await writeFile(path, content, "utf8")
  }

  console.log(`Created ${appName} in ${target}\n`)
  console.log("Next steps:")
  console.log(`  cd ${directory}`)
  console.log("  npm install")
  console.log("  npm test")
  console.log("  npm run dev")
  if (!yes) console.log("\nTip: use --yes for non-interactive scaffolding.")
} catch (error) {
  console.error(`create-arc: ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
}
