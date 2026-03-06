# TypeORM Entity Conventions in LaunchFrame

## Required Decorators

Every entity must have these four:

```typescript
@Entity('snake_case_table_name')
export class MyEntity {
  @PrimaryGeneratedColumn()
  id: number;

  // ... domain columns ...

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

## Naming Strategy

A global `SnakeNamingStrategy` is configured in TypeORM. This means:
- `createdAt` → `created_at` automatically
- `userId` → `user_id` automatically
- Do NOT add `name: 'column_name'` unless you need to deviate from the convention.

Exception: some legacy entities specify explicit `name:` — that is acceptable but not required for new entities.

## Column Types

```typescript
// String
@Column() name: string;
@Column({ type: 'text', nullable: true }) description: string;
@Column({ type: 'varchar', length: 255, nullable: true }) slug: string;

// Number
@Column({ type: 'int' }) count: number;
@Column({ type: 'decimal', precision: 10, scale: 2, nullable: true }) amount: number;

// Boolean
@Column({ default: false }) isActive: boolean;

// JSON
@Column({ type: 'jsonb' }) metadata: Record<string, any>;
@Column({ type: 'jsonb', nullable: true }) options: Record<string, any>;

// Enum (define enum in same file)
export enum MyStatus { ACTIVE = 'active', INACTIVE = 'inactive' }
@Column({ type: 'enum', enum: MyStatus }) status: MyStatus;

// UUID primary key
@PrimaryGeneratedColumn('uuid') id: string;
```

## Relations

```typescript
// Foreign key column + relation (preferred pattern)
@Column({ type: 'int' })
userId: number;

@ManyToOne(() => User, { onDelete: 'CASCADE' })
user: User;

// One-to-many
@OneToMany(() => CreditTransaction, (tx) => tx.user)
transactions: CreditTransaction[];
```

## Multi-Tenancy

For multi-tenant variants, add `projectId` to every domain entity:

```typescript
// MULTI_TENANT_FIELDS_START
@Column() projectId: number;
// MULTI_TENANT_FIELDS_END
```

Leave the section markers in place — the CLI uses them to splice in multi-tenant fields.

## File Location

```
src/modules/<domain>/entities/<entity-name>.entity.ts
```

Register in the module via `TypeOrmModule.forFeature([MyEntity])`.

## Migration

Migrations live in `src/migrations/`. Name format: `<timestamp>-<PascalCaseDescription>.ts`.
Run inside the backend container: `npm run migration:run`.
