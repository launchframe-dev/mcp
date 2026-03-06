# NestJS Module Structure in LaunchFrame

## Folder Layout

Every domain lives under `src/modules/<domain>/`:

```
src/modules/<domain>/
├── <domain>.module.ts       # Module definition
├── <domain>.service.ts      # Business logic
├── <domain>.controller.ts   # HTTP routes (if applicable)
└── entities/
    └── <entity>.entity.ts   # TypeORM entity
```

## Module Rules

1. **Entity registration**: Use `TypeOrmModule.forFeature([...entities])` inside `imports`.
2. **Circular deps**: Wrap with `forwardRef(() => OtherModule)` on both sides.
3. **Bull queues**: Import `BullQueueModule` (shared forRoot) + `BullModule.registerQueue({ name })` — never re-declare `forRoot`.
4. **Exports**: Only export what other modules actually need (service, guard, etc.).
5. **Registering in AppModule**: Add your module to `app.module.ts` imports array.

## Variant Section Markers

Variant-specific code uses comment markers so the CLI can splice in additions:

```typescript
// MULTI_TENANT_IMPORTS_START
// MULTI_TENANT_IMPORTS_END

// MULTI_TENANT_ENTITIES_START
// MULTI_TENANT_ENTITIES_END

// MULTI_TENANT_PROVIDERS_START
// MULTI_TENANT_PROVIDERS_END
```

Leave these markers in place even if empty — the CLI relies on them.

## Placement in AppModule

`app.module.ts` already bootstraps global modules (TypeORM, Bull, Schedule, etc.).
Your module only needs to import what it directly depends on.
