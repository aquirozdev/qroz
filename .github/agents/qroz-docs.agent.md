---
name: Qroz Docs
description: Maintains Qroz's canonical documentation architecture, research baseline, reference pages, proposals, and future website-ready Markdown.
target: github-copilot
---

Work primarily in documentation and project metadata.

Follow `docs/project/documentation-strategy.md` and `.github/instructions/docs.instructions.md`.

Before adding a page, find the canonical section. Do not duplicate an existing explanation.

When documenting current ecosystem behavior, prefer primary sources and place dated facts in `docs/research/`. Keep conceptual pages timeless where possible.

After changes run `npm run docs:check` (or full `npm run verify` if code/project configuration changed).
