---
title: Design principles
description: Non-negotiable principles used to evaluate Arc API and architecture decisions.
---

# Design principles

## Explicit over magical

Important dependencies, effects and distributed semantics should be readable from definitions and inspectable by tools.

## Capabilities over vendors

Application code requests semantic abilities. Platform composition chooses implementations.

## Application Graph over configuration sprawl

Runtime, CLI, agents and future platform tooling should share one semantic model instead of separate metadata files.

## Web Standards over runtime-specific HTTP APIs

Portable boundaries prefer TC55-compatible Web APIs.

## Progressive architecture

Easy things should be easy. Sophisticated patterns are available when complexity justifies them.

## Local-first with production evidence

Developer feedback must be fast, but production/platform compatibility claims require official-runtime integration gates.

## No fake portability

Feature differences are explicit. Portability never means silently discarding useful provider behavior.

## Native escape hatches

A framework abstraction must not trap the application away from platform capabilities.

## At-least-once aware by default

Retries, duplicates and partial failures are normal distributed behavior. Exactly-once claims require evidence.

## Human DX equals machine DX

Errors, graph output and tooling should be understandable by people and deterministic for agents/CI.

## Design from examples inward

Public application ergonomics are specified before internal machinery.

## Evidence before abstraction

A portable abstraction normally needs at least two implementations or equally strong cross-provider evidence before stabilization.
