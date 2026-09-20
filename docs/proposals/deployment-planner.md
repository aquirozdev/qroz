---
title: Proposal — deployment planner
description: Planned transformation from Application Graph and environment configuration into reviewable deployment requirements.
---

# Proposal — deployment planner

Status: **planned**.

Arc should not begin by building another cloud control plane. It should first produce a deterministic **deployment plan**.

```text
Application Graph
+ environment/platform configuration
        │
        ▼
Deployment Plan
        ├── execution surfaces
        ├── resource requirements
        ├── bindings/environment inputs
        ├── candidate IAM
        ├── provider feature requirements
        └── semantic diff
```

## Important separation

Application semantics answer **what is needed**.

Platform configuration answers **where/how it is provisioned**.

Terraform/Pulumi/CDK/SST/provider APIs may implement the resulting plan.

## Desired CLI

```text
arc plan
arc plan --json
arc diff deployment main
```

## Safety

Before automated apply exists, the plan should be human-reviewable. Production deployment must eventually integrate approvals, environment policy and auditability.
