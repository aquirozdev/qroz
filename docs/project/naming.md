---
title: Naming decision
description: Criteria and collision research for replacing the Arc codename before public package publication.
---

# Naming decision

## Decision status

**Arc remains a repository codename until a final name is selected. Do not publish public packages under the current Arc identity.**

## Why Arc should change

“Arc” has unusually high collision risk in developer tooling:

- Architect is an established serverless framework whose CLI is `arc` and whose documentation lives at `arc.codes`;
- active agent-framework projects also use Arc/ARC branding;
- “Arc” is broadly used across software products, making search and package discovery noisy.

The cost of renaming grows sharply after npm publication, documentation indexing and third-party integrations, so the right time is now.

## Name requirements

The final name should:

1. be short enough for a CLI;
2. be easy to pronounce in English and Spanish;
3. support a clean npm scope and create-* package;
4. not imply a single cloud, AI model or deployment style;
5. fit the semantic thesis: clear application structure, truth, graph, execution and explainability;
6. have low collision risk with frameworks, package managers, databases, cloud platforms and agent products;
7. support a distinctive visual identity;
8. survive a basic web/GitHub/npm collision search before adoption.

## Rejected / high-collision candidates

- **Arc** — conflicts directly with Architect's `arc` CLI and multiple Arc frameworks.
- **Kora** — active Java/Kotlin backend framework, offline-first JS framework and Solana infrastructure.
- **Lattice** — active software-semantics project very close to Arc's application-meaning thesis.
- **Velora / Veyra** — active framework/product names.
- **Anvil** — crowded developer-tooling name.
- **Auron** — active Apache project and existing software brand.
- **Kernia** — active authentication framework.
- **Nuvra** — active autonomous software engineering platform.
- **Semora** — active software product.
- **Tessyn** — existing npm/developer-tooling package and product name.

## Selection process

Before the rename PR:

1. produce 5–8 coined candidates;
2. search exact names on npm, GitHub and the public web;
3. reject names with close developer-tooling collisions;
4. check likely CLI and package spellings;
5. perform an external trademark/domain review before commercial branding;
6. choose one identity and rename repository-facing docs, package scope, CLI, scaffold and Studio together.

The code architecture should not depend on the brand name so this remains an atomic product migration rather than a semantic change.
