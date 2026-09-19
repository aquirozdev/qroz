# Provider lifecycle

`ProviderScope` is Arc's minimal invocation lifecycle primitive.

A scope contains providers plus an optional disposer. It intentionally avoids a large DI-container lifecycle model until we have evidence that more phases are required.

```ts
const scope = providerScope(providers, async () => {
  await resource.close()
})
```

## Guarantees

- HTTP runtimes dispose after a successful response.
- HTTP runtimes dispose after handler/validation/runtime failures.
- Cloudflare queue consumers dispose once after the batch invocation.
- Existing plain provider arrays remain valid and require no migration.

## Why it exists

This supports resources such as database clients, temporary locks and future transaction scopes while retaining explicit resource ownership.
