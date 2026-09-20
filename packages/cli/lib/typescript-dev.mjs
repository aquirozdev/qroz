import { existsSync } from "node:fs"
import { spawnSync } from "node:child_process"
import { createRequire } from "node:module"
import { dirname, extname, isAbsolute, join, relative, resolve } from "node:path"

function nearestTsconfig(sourcePath) {
  let directory = dirname(sourcePath)
  const root = resolve(directory, "/")

  while (true) {
    const candidate = join(directory, "tsconfig.json")
    if (existsSync(candidate)) return candidate
    if (directory === root) return undefined
    const parent = dirname(directory)
    if (parent === directory) return undefined
    directory = parent
  }
}

function resolveTypeScriptCompiler(cwd) {
  const requireFromProject = createRequire(join(cwd, "package.json"))
  try {
    return requireFromProject.resolve("typescript/bin/tsc")
  } catch {
    throw new Error("source-first arc dev requires TypeScript in the application. Install it with 'npm install -D typescript'.")
  }
}

function runCompiler(tscPath, args, options = {}) {
  return spawnSync(process.execPath, [tscPath, ...args], {
    cwd: options.cwd,
    encoding: options.capture ? "utf8" : undefined,
    stdio: options.capture ? ["ignore", "pipe", "pipe"] : "inherit"
  })
}

function emittedExtension(sourcePath) {
  const extension = extname(sourcePath)
  if (extension === ".mts") return ".mjs"
  if (extension === ".cts") return ".cjs"
  return ".js"
}

export function prepareTypeScriptDev(appPath, cwd = process.cwd()) {
  const sourcePath = resolve(cwd, appPath)
  const tsconfigPath = nearestTsconfig(sourcePath)
  if (!tsconfigPath) {
    throw new Error(`no tsconfig.json found for TypeScript application entry '${appPath}'`)
  }

  const tscPath = resolveTypeScriptCompiler(cwd)
  const shown = runCompiler(tscPath, ["--showConfig", "-p", tsconfigPath], { cwd, capture: true })
  if (shown.status !== 0) {
    const diagnostic = (shown.stderr || shown.stdout || "").trim()
    throw new Error(`unable to read TypeScript project for '${appPath}'${diagnostic ? `: ${diagnostic}` : ""}`)
  }

  const config = JSON.parse(shown.stdout)
  const configDirectory = dirname(tsconfigPath)
  const configuredRoot = config.compilerOptions?.rootDir
  const configuredOut = config.compilerOptions?.outDir

  if (!configuredRoot || !configuredOut) {
    throw new Error(
      "source-first arc dev currently requires compilerOptions.rootDir and compilerOptions.outDir so Arc can map source to emitted JavaScript truthfully"
    )
  }

  const rootDir = isAbsolute(configuredRoot) ? configuredRoot : resolve(configDirectory, configuredRoot)
  const outDir = isAbsolute(configuredOut) ? configuredOut : resolve(configDirectory, configuredOut)
  const sourceRelative = relative(rootDir, sourcePath)

  if (sourceRelative.startsWith("..") || isAbsolute(sourceRelative)) {
    throw new Error(`TypeScript application entry '${appPath}' is outside compilerOptions.rootDir '${rootDir}'`)
  }

  const built = runCompiler(tscPath, ["-p", tsconfigPath, "--pretty", "false"], { cwd, capture: true })
  if (built.status !== 0) {
    const diagnostic = (built.stdout || built.stderr || "").trim()
    throw new Error(`TypeScript build failed for '${appPath}'${diagnostic ? `:\n${diagnostic}` : ""}`)
  }

  const compiledRelative = sourceRelative.replace(/\.(?:cts|mts|tsx|ts)$/, emittedExtension(sourcePath))
  const compiledPath = join(outDir, compiledRelative)

  if (!existsSync(compiledPath)) {
    throw new Error(`TypeScript build completed but Arc could not find emitted application '${compiledPath}'`)
  }

  return {
    sourcePath,
    compiledPath,
    tsconfigPath,
    watchCommand: {
      command: process.execPath,
      args: [
        tscPath,
        "-p",
        tsconfigPath,
        "--watch",
        "--preserveWatchOutput",
        "--pretty",
        "false"
      ]
    }
  }
}
