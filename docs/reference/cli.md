---
title: CLI reference
description: Current deterministic Arc CLI commands for humans, CI and agents.
---

# CLI reference

Current commands:

```text
arc inspect <app> [--json]
arc validate <app> [--json]
arc explain <ARCxxxx> [--json]
arc context <app> <module> [--json]
arc diff <before> <after> [--json]
```

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

## Machine mode

`--json` output must remain deterministic, free from spinners/ANSI decoration and suitable for CI or agents.

Future commands such as deployment or migration are not considered part of this stable reference until their authorization and provider models exist.
