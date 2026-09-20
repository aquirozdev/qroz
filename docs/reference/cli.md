---
title: CLI reference
description: Current deterministic Arc CLI commands for humans, CI and agents.
---

# CLI reference

Current commands:

```text
arc dev <app.ts|app.js> [--watch] [--port <number>] [--no-open]
arc inspect <app> [--json]
arc validate <app> [--json]
arc explain <ARCxxxx> [--json]
arc context <app> <module> [--json]
arc diff <before> <after> [--json]
arc plan <app> [--json]
```

## dev

Runs the application and local Arc Studio.

When the entry is TypeScript, Arc uses the application's local TypeScript compiler and nearest `tsconfig.json`. Source-first mode currently requires explicit `compilerOptions.rootDir` and `compilerOptions.outDir` so Arc can map the source entry to emitted JavaScript without guessing.

With `--watch`, Arc watches the compiled module graph and restarts the isolated application process after TypeScript emits changes. This deliberately favors truthful full-module reload over partial ESM cache invalidation.

JavaScript entrypoints remain supported directly. `--build <command>` remains an escape hatch for custom build pipelines.

## inspect

Returns the full deterministic Application Graph.

## validate

Builds/validates structural invariants and reports machine-readable framework errors.

## explain

Returns the stable explanation/remediation metadata for an Arc framework error code.

## context

Returns a compact semantic view of one module so tools/agents do not need to scan the entire repository for architectural context.

## diff

Compares two Application Graphs semantically rather than as source lines.

## plan

Returns the provider-neutral deployment plan, including execution surfaces, resource access and warnings.

## Machine mode

`--json` output must remain deterministic, free from spinners/ANSI decoration and suitable for CI or agents.

Future commands such as deployment or migration are not considered part of this stable reference until their authorization and provider models exist.
