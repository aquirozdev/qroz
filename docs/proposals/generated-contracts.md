---
title: Proposal — generated contracts
description: Planned OpenAPI, AsyncAPI, JSON Schema and SDK artifacts derived from Arc application definitions.
---

# Proposal — generated contracts

Status: **planned/partial**. MCP already consumes Arc semantics. HTTP/event description and SDK generation are not implemented.

## HTTP contracts

OpenAPI **3.2.x** is the current target family for generated HTTP descriptions.

Arc endpoint definitions already contain much of the semantic input:

```text
method
path
input schemas
output schema
status
future auth/policies
module/endpoint identity
```

## Schema conversion

Arc already accepts Standard Schema V1 for validation. The Standard Schema ecosystem now also defines **Standard JSON Schema V1**, a separate optional interface for generating JSON Schema.

Preferred strategy:

1. validate through Standard Schema;
2. when the schema also implements Standard JSON Schema, request a target JSON Schema representation;
3. generate OpenAPI using that representation;
4. if conversion is unavailable or lossy, mark the schema as opaque rather than fabricating a misleading contract.

Current JSON Schema published baseline is Draft 2020-12; OpenAPI 3.2's dialect builds on it.

## Event/message contracts

AsyncAPI 3.x is a candidate export format for externally meaningful event and messaging channels.

Important distinction:

- Arc Event/Job/Application Graph = internal semantic source model;
- AsyncAPI = external protocol/documentation representation.

Not every internal job should automatically become a public AsyncAPI channel.

## SDKs

Possible outputs:

- TypeScript client;
- external-language clients generated from OpenAPI;
- typed event contracts where an external boundary exists.

For same-workspace TypeScript callers, direct inferred types may provide better DX than code generation.

## MCP

MCP tools are not generated blindly from every endpoint. Exposure requires explicit intent and future authorization rules.

## Required proof

Before stabilizing this subsystem:

- validate OpenAPI 3.2 documents against official schemas;
- exercise Standard JSON Schema with multiple validation libraries;
- identify transformations that are not representable;
- establish stable operation IDs from Arc semantic identities;
- define API breaking-change detection from graph + generated contracts.
