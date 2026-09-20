# SaaS reference application

This example is an executable specification for Qroz's tenant/resource authorization model.

It proves that:

- authentication and static permissions are distinct from object/tenant authorization;
- authorization policies may declare capabilities explicitly;
- policy capability access is runtime-enforced;
- policy dependencies remain visible in the Application Graph;
- deployment planning includes policy resource access for least-privilege bindings/IAM.

The acceptance tests live in `test/app.test.mjs`.
