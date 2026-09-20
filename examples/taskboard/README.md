# Taskboard example

This is Qroz's small application-facing reference example.

Its purpose is not to exercise every provider. It is an executable specification for the framework experience:

- define a module and endpoints;
- inject a capability through a provider;
- validate input/output through Standard Schema;
- test behavior from the outside through `@qroz/testing`.

The development rule for this example is outside-in TDD: change the desired application API or acceptance test first, then implement the smallest framework change needed to make it pass.
