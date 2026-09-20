---
applyTo: "**/*.ts,**/*.mts,**/*.cts"
---

# TypeScript instructions

- Preserve `strict`, `exactOptionalPropertyTypes` and `noUncheckedIndexedAccess`.
- Prefer explicit data structures and discriminated unions over reflection.
- Public framework types should describe semantics rather than vendor SDK details.
- Do not add `any` to silence design/type errors; use narrow unknown/type guards where needed.
- Keep package boundaries intentional. A vendor adapter may depend on its vendor; `@qroz/core` may not.
- Public APIs need outside-in behavioral tests, not only type-level tests.
- If a type affects the Application Graph or job envelope, consider schema/version compatibility.
