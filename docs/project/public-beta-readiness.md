---
title: Public beta readiness
description: Concrete release gates for publishing the framework without overstating production maturity.
---

# Public beta readiness

This document separates **publishable beta**, **production-credible**, and **1.0** so Qroz can ship useful software without pretending unfinished areas are complete.

## Current verdict

Qroz is not ready for npm publication yet.

The architecture and evidence base are strong enough to justify a public beta effort. The product identity is finalized as Qroz and package publication mechanics are now normalized around one prerelease line. Qroz is licensed under Apache-2.0 and package publication mechanics are normalized around one prerelease line. Publication remains blocked by npm package ownership/trusted-publisher configuration and completion of the remaining public documentation/product acceptance gates.

## Release levels

### Public beta

A public beta means:

- packages can be installed safely from a public registry;
- the first-run developer journey is coherent;
- advertised features have executable evidence;
- incomplete surfaces are marked experimental or unsupported;
- package/release provenance is verifiable;
- breaking changes remain possible under a documented pre-1.0 policy.

It does **not** mean every planned production capability is complete.

### Production-credible

Production-credible claims additionally require provider failure-path evidence, operational telemetry, real identity-provider proof, durable execution evidence, recovery/rollback semantics and security hardening appropriate to the advertised surface.

### 1.0

1.0 additionally requires compatibility commitments for public APIs and graph schemas, mature release/migration policy, sustained production-scale reference evidence and stable support expectations.

## Interaction audit

| Interaction | Current state | Public-beta gate |
| --- | --- | --- |
| discover/install | repository only | final name, npm identity, license, package metadata, provenance |
| scaffold | implemented | clean install from public packed/published artifacts |
| first run | build + compiled entrypoint knowledge leaks through | source-first dev loop |
| dev reload | full-process reload verified | compile-error recovery + source-first evidence |
| Studio | browser evidence exists | navigation/detail UX + accessibility smoke |
| request runner | browser verified | error/validation/auth journeys |
| test client | implemented | public package install acceptance |
| errors | stable codes + remediation | source metadata for key failures |
| inspect/validate | implemented | packaged CLI smoke on supported OSes |
| context | implemented | docs + deterministic contract |
| diff | security-aware implemented | compatibility semantics + golden examples |
| plan | provider-neutral implemented | stable schema + provider consequence docs |
| auth | permissions/policies/decisions | external IdP proof before production claim |
| jobs/queues | multi-provider evidence | failure/poison/retry matrix documented |
| idempotency | memory/Cloudflare/AWS evidence | HTTP mutation story remains incomplete |
| workflows | experimental | clearly experimental in beta; second execution path before stronger claim |
| tracing | semantic tracing | exporter/bridge story required for production claim |
| MCP/agents | read-only | current protocol compatibility; mutations remain deferred |
| docs | canonical Markdown | public docs site, links, search, versioning |
| upgrade | implicit | pre-1.0 migration policy + release notes |
| release | beta workflow present; registry trust setup pending | trusted publishing/OIDC + Git tag/GitHub Release/npm alignment |

## Package publication blockers

Before any npm publish:

1. [done] product identity is finalized as **Qroz**; verify npm ownership/availability for the intended `@qroz/*` packages;
2. [done] license Qroz under Apache-2.0 and commit LICENSE/NOTICE;
3. [done] normalize package versions into one deliberate prerelease line (`0.12.0-beta.1`);
4. [done] replace internal `file:` dependency specifications with publication-safe version ranges;
5. [done] add package metadata:
   - description;
   - keywords;
   - repository;
   - bugs;
   - homepage;
   - license;
   - supported Node engines;
   - publishConfig/access;
6. [done] verify publishable tarballs through the packed-consumer release gate;
7. [done] install packed tarballs into a clean external fixture and exercise the consumer flow;
8. [workflow done; registry setup pending] publish through npm trusted publishing/OIDC rather than a long-lived write token.

## Release integrity

Canonical publication should run from GitHub Actions using npm trusted publishing/OIDC. For a public repository publishing public packages, npm can generate provenance automatically through trusted publishing.

A release must bind together:

- source commit;
- version changes;
- changelog/release notes;
- Git tag;
- GitHub Release;
- npm package versions;
- provenance attestation;
- release evidence run.

## Compatibility policy needed for beta

Before public beta, explicitly declare:

- supported Node majors;
- TypeScript version policy;
- ESM-only status;
- supported package manager baseline;
- OS support for CLI/dev tooling;
- Cloudflare/AWS feature support and experimental boundaries.

The CI matrix must prove the claims that appear in docs.

## Documentation gate

Public beta requires:

- public documentation site;
- installation and first-ten-minutes guide;
- package reference for every published package;
- CLI reference;
- error catalog;
- support matrix;
- security reporting instructions;
- release/migration policy;
- provider limitations;
- experimental-feature labels;
- visual product evidence for canonical DX claims.

## Legal/community gate

The repository owner must make the license decision. This cannot be inferred safely from code.

Before publication also add/verify:

- [done] LICENSE (Apache-2.0);
- SUPPORT.md;
- Code of Conduct if community contributions are invited;
- private vulnerability reporting path;
- copyright/license metadata in packages.

## Naming gate

**Qroz is the final public identity.**

The naming decision is closed. Repository-facing product names, CLI commands, package scope, scaffold, Studio, internal dev namespace and stable framework error codes are being normalized to Qroz.

Remaining release checks are registry ownership/availability and any legal/domain review needed before public publication; they do not reopen product naming.

See the [naming decision](./naming.md).

## Exit condition

Public beta is ready only when `npm run release:check` passes, clean-tarball installation is green, public docs are deployed, supported compatibility claims are CI-backed and the release workflow can produce a prerelease without manual registry credentials.
