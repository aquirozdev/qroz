---
title: CLI reference
description: Current deterministic Qroz CLI commands for humans, CI and agents.
---

# CLI reference

Current commands:

```text
qroz dev <app.ts|app.js> [--watch|--no-watch] [--port <number>] [--no-open]
qroz inspect <app> [--json]
qroz validate <app> [--json]
qroz explain <QROZxxxx> [--json]
qroz context <app> <module> [--json]
qroz diff <before> <after> [--json]
qroz plan <app> [--json]
```

## dev

Runs the application and local Qroz Studio.

When the entry is TypeScript, Qroz uses the application's local TypeScript compiler and nearest `tsconfig.json`. Source-first mode currently requires explicit `compilerOptions.rootDir` and `compilerOptions.outDir` so Qroz can map the source entry to emitted JavaScript without guessing.

For TypeScript source entries, watch/reload is enabled by default. Qroz watches emitted changes and restarts the isolated application process while keeping the same local app/Studio URL. Compilation failures leave the last healthy runtime available and TypeScript diagnostics remain visible; fixing the source resumes reload automatically. Use `--no-watch` only when a one-shot source build is intentional. This deliberately favors truthful full-module reload over partial ESM cache invalidation.

JavaScript entrypoints remain supported directly. `--build <command>` remains an escape hatch for custom build pipelines.

## inspect

Returns the full deterministic Application Graph.

## validate

Builds/validates structural invariants and reports machine-readable framework errors.

## explain

Returns the stable explanation/remediation metadata for an Qroz framework error code.

## context

Returns a compact semantic view of one module so tools/agents do not need to scan the entire repository for architectural context.

## diff

Compares two Application Graphs semantically rather than as source lines.

## plan

Returns the provider-neutral deployment plan, including execution surfaces, resource access and warnings.

## Machine mode

`--json` output must remain deterministic, free from spinners/ANSI decoration and suitable for CI or agents.

Future commands such as deployment or migration are not considered part of this stable reference until their authorization and provider models exist.
