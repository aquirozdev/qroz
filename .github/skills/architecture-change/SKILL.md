---
name: architecture-change
description: Use when adding or changing an Qroz framework abstraction, runtime/resource contract, Application Graph field, job/event semantic, or cross-package architectural behavior.
---

# Qroz architecture change workflow

1. Read `docs/project/vision.md`, `docs/project/principles.md`, and relevant ADRs.
2. Write the desired application-facing API before internal design.
3. Identify which semantic declarations and graph fields change.
4. Identify every execution surface affected.
5. For a portable abstraction, name at least two real provider implementations and list incompatible features.
6. Define evidence:
   - outside-in behavior test;
   - contract test;
   - official-runtime/service integration gate.
7. Implement the smallest vertical slice.
8. Update canonical docs, support matrix and roadmap status.
9. Add an ADR if the choice constrains future packages/providers.
10. Run `npm run verify`.

Never downgrade a real provider semantic to fit a fake common denominator.
