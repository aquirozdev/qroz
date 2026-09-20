---
applyTo: "**/*.md,docs/**,.github/ISSUE_TEMPLATE/**"
---

# Documentation instructions

- `docs/` is canonical; the future website renders it instead of copying it.
- Prefer links over duplicated explanations.
- Distinguish **Implemented**, **Verified**, **Contract**, **Experimental**, and **Planned** precisely.
- Put time-sensitive external facts in `docs/research/` with a date and primary source.
- Put planned but unimplemented architecture in `docs/proposals/`.
- Put exact commands/schemas/error codes in `docs/reference/`.
- Use relative links for repository-local pages.
- After changes, run `npm run docs:check`.
