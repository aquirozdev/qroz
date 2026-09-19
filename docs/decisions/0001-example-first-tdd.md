# ADR 0001: Example-first outside-in development

**Status:** accepted

## Decision

Design public APIs by first writing the application we want framework users to write, then drive implementation using outside-in executable tests.

## Rationale

The project's largest risk is framework ergonomics and architectural feasibility, not lack of implementation techniques for routers or containers. Starting from internal abstractions would optimize the wrong surface.

## Consequence

No large framework subsystem should be considered real until an example application uses it successfully.
