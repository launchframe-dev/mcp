import { z } from 'zod';
import { loadContent } from '../lib/content.js';
export function registerEntityTools(server) {
    server.tool('entity_get_conventions', 'Get TypeORM entity conventions for LaunchFrame: required decorators, naming strategy, column types, relations, and multi-tenancy.', {}, async () => ({
        content: [{ type: 'text', text: loadContent('entities/conventions.md') }],
    }));
    server.tool('entity_scaffold_typeorm', 'Generate a TypeORM entity file following LaunchFrame conventions.', {
        entityName: z
            .string()
            .describe('Entity class name in PascalCase (e.g. "FeedbackEntry", "AiSummary")'),
        tableName: z
            .string()
            .describe('Database table name in snake_case (e.g. "feedback_entries", "ai_summaries")'),
        primaryKeyType: z
            .enum(['int', 'uuid'])
            .default('int')
            .describe('Primary key type: "int" (auto-increment) or "uuid"'),
        multiTenant: z
            .boolean()
            .default(false)
            .describe('Add projectId column for multi-tenant variant'),
        withEnum: z
            .string()
            .optional()
            .describe('Optional: define a status enum. Provide enum name in PascalCase (e.g. "EntryStatus"). Values will be a placeholder — edit as needed.'),
    }, async ({ entityName, tableName, primaryKeyType, multiTenant, withEnum, }) => {
        const pkDeclarator = primaryKeyType === 'uuid'
            ? `@PrimaryGeneratedColumn('uuid')\n  id: string;`
            : `@PrimaryGeneratedColumn()\n  id: number;`;
        const enumBlock = withEnum
            ? `export enum ${withEnum} {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  // TODO: add values
}

`
            : '';
        const enumImportEntry = withEnum ? `, Column` : `, Column`;
        const multiTenantBlock = multiTenant
            ? `  // MULTI_TENANT_FIELDS_START
  @Column() projectId: number;
  // MULTI_TENANT_FIELDS_END

`
            : `  // MULTI_TENANT_FIELDS_START
  // @Column() projectId: number;
  // MULTI_TENANT_FIELDS_END

`;
        const enumColumnBlock = withEnum
            ? `
  @Column({ type: 'enum', enum: ${withEnum} })
  status: ${withEnum};
`
            : '';
        const imports = [
            'Entity',
            'PrimaryGeneratedColumn',
            'Column',
            'CreateDateColumn',
            'UpdateDateColumn',
        ];
        const entityFile = `import { ${imports.join(', ')} } from 'typeorm';

${enumBlock}@Entity('${tableName}')
export class ${entityName} {
  ${pkDeclarator}

${multiTenantBlock}  // TODO: add domain columns here
  // @Column() name: string;
  // @Column({ type: 'text', nullable: true }) description: string;
${enumColumnBlock}
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
`;
        const registerNote = `// === Register in your module ===
// In src/modules/<domain>/<domain>.module.ts:
//   imports: [TypeOrmModule.forFeature([${entityName}])]
`;
        return {
            content: [
                {
                    type: 'text',
                    text: `// === entities/${tableName}.entity.ts ===\n${entityFile}\n${registerNote}`,
                },
            ],
        };
    });
}
