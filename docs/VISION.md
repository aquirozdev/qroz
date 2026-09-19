# Vision

## Problem

Modern TypeScript backend development is fragmented. Some frameworks offer excellent HTTP ergonomics but little application structure. Others provide architecture but add ceremony and runtime magic. Serverless platforms expose powerful primitives but couple application code to provider details. AI coding agents further expose weaknesses that humans previously compensated for manually: implicit conventions, unstructured errors, hidden infrastructure dependencies and sprawling repositories.

Arc explores a framework where application code declares **semantic intent** and platform adapters provide execution.

## Product thesis

> Build an application framework for humans and AI agents, designed from the start for serverless and distributed systems.

The differentiated unit is not the router. It is the **Application Model / Application Graph** shared by:

- runtime execution;
- validation;
- CLI and IDE tooling;
- documentation;
- architecture inspection;
- test generation and test harnesses;
- deployment adapters;
- IAM/binding generation;
- observability;
- MCP/agent context;
- semantic pull-request diffs.

## Desired developer experience

Simple code should remain simple:

```ts
export const hello = endpoint({
  method: "GET",
  path: "/hello",
  output: Hello,
  handler: () => ({ hello: "world" })
})
```

As the application grows, the same model should support explicit capabilities, events, jobs, workflows, policies, storage, database access, retries, idempotency and module isolation without forcing that complexity on small applications.

## Long-term positioning

Arc is not intended to be:

- another Express-compatible router;
- another ORM;
- another schema library;
- an infrastructure-as-code replacement;
- an AI coding agent;
- a Cloudflare-only framework;
- an AWS abstraction that reduces every provider to the lowest common denominator.

It should become the **application layer above cloud primitives**, retaining provider-specific escape hatches while making the common architectural intent portable.

## Human + agent DX

A coding agent should not need to infer basic architecture by grepping hundreds of files. The framework should answer deterministic questions such as:

- What modules exist?
- Which endpoints expose this module?
- Which capability does this action require?
- Which listeners consume this event?
- What tests cover this feature?
- What would this change affect?
- Which permissions are necessary?

The current `arc inspect --json` command is the first executable step toward this goal.
