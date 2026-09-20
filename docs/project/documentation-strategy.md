---
title: Documentation strategy
description: How repository documentation becomes a future public docs website without creating a second source of truth.
---

# Documentation strategy

Documentation is part of Arc's product surface.

## Canonical source

Markdown in this `docs/` hierarchy is canonical. A future website renders it; the website must not fork or manually copy core documentation.

## Information architecture

The hierarchy follows documentation intent:

- **getting started** — learning path;
- **concepts** — explanation;
- **guides** — tasks;
- **reference** — exact interfaces/contracts;
- **architecture** — maintainers/internal design;
- **platforms** — provider-specific behavior;
- **agents** — machine/agent interfaces;
- **project** — vision/governance/roadmap;
- **research** — dated external facts;
- **decisions** — ADRs.

This roughly follows the useful separation between tutorial/how-to/explanation/reference while retaining project/platform material Arc specifically needs.

## Future site generator

Preferred current target: **Astro Starlight**.

Reasons:

- designed specifically for documentation;
- Markdown/MDX/Markdoc support;
- built-in navigation/search;
- accessibility-focused defaults;
- SEO support;
- internationalization support;
- typed frontmatter/content integration;
- framework-neutral UI extension through Astro.

The decision is reversible because canonical docs stay mostly plain Markdown.

VitePress remains a credible alternative, especially for minimal Vue-centric docs and built-in local search. Site framework selection should not affect Arc architecture.

## Writing rules

- one authoritative page per concept;
- link instead of copy;
- examples must distinguish current API from proposed API;
- use **Implemented**, **Verified**, **Experimental**, **Planned** language precisely;
- time-sensitive claims go in research pages with source/date;
- reference pages should eventually be generated/validated from code where practical;
- no undocumented compatibility promises before 1.0.

## AI/LLM distribution

The future docs build should produce machine-friendly artifacts such as:

- `llms.txt`;
- a full Markdown bundle;
- Application Graph JSON Schema;
- CLI reference JSON;
- versioned docs index.

These should derive from canonical docs and metadata rather than separate prose.
