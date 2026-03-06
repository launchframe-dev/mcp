import { z } from 'zod';
import { loadContent } from '../lib/content.js';
export function registerModuleTools(server) {
    server.tool('module_get_structure', 'Get the NestJS module folder structure, conventions, and rules used in LaunchFrame.', {}, async () => ({
        content: [{ type: 'text', text: loadContent('modules/structure.md') }],
    }));
    server.tool('module_scaffold_nestjs', 'Generate a NestJS module scaffold (module + service + optional controller + optional entity) following LaunchFrame conventions.', {
        moduleName: z
            .string()
            .describe('Domain name in kebab-case (e.g. "projects", "ai-summaries")'),
        withController: z
            .boolean()
            .default(true)
            .describe('Include a controller with basic CRUD routes'),
        withEntity: z
            .boolean()
            .default(true)
            .describe('Include a TypeORM entity and register it via TypeOrmModule.forFeature'),
    }, async ({ moduleName, withController, withEntity, }) => {
        const pascal = toPascalCase(moduleName);
        const camel = toCamelCase(moduleName);
        const snake = toSnakeCase(moduleName);
        const entityImport = withEntity
            ? `import { TypeOrmModule } from '@nestjs/typeorm';\nimport { ${pascal} } from './entities/${moduleName}.entity';`
            : '';
        const entityFeature = withEntity
            ? `\n    TypeOrmModule.forFeature([${pascal}]),`
            : '';
        const controllerImport = withController
            ? `import { ${pascal}Controller } from './${moduleName}.controller';`
            : '';
        const controllerDecl = withController ? `\n  controllers: [${pascal}Controller],` : '';
        const moduleFile = `import { Module } from '@nestjs/common';
${entityImport}
import { ${pascal}Service } from './${moduleName}.service';
${controllerImport}

@Module({
  imports: [${entityFeature}
    // MULTI_TENANT_MODULE_IMPORTS_START
    // MULTI_TENANT_MODULE_IMPORTS_END
  ],
  providers: [
    ${pascal}Service,
    // MULTI_TENANT_PROVIDERS_START
    // MULTI_TENANT_PROVIDERS_END
  ],${controllerDecl}
  exports: [${pascal}Service],
})
export class ${pascal}Module {}`;
        const serviceFile = `import { Injectable } from '@nestjs/common';
${withEntity ? `import { InjectRepository } from '@nestjs/typeorm';\nimport { Repository } from 'typeorm';\nimport { ${pascal} } from './entities/${moduleName}.entity';` : ''}

@Injectable()
export class ${pascal}Service {
${withEntity ? `  constructor(
    @InjectRepository(${pascal})
    private readonly ${camel}Repository: Repository<${pascal}>,
  ) {}` : ''}
  // TODO: implement service methods
}`;
        const controllerFile = withController
            ? `import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common';
import { ${pascal}Service } from './${moduleName}.service';
import { CurrentUser } from '@/modules/auth/auth.decorator';
import { User } from '@/modules/users/user.entity';

@Controller('${moduleName}')
export class ${pascal}Controller {
  constructor(private readonly ${camel}Service: ${pascal}Service) {}

  @Get()
  findAll(@CurrentUser() user: User) {
    // TODO: implement
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    // TODO: implement
  }

  @Post()
  create(@Body() body: Record<string, unknown>, @CurrentUser() user: User) {
    // TODO: implement
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: Record<string, unknown>, @CurrentUser() user: User) {
    // TODO: implement
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    // TODO: implement
  }
}`
            : null;
        const entityFile = withEntity
            ? `import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('${snake}')
export class ${pascal} {
  @PrimaryGeneratedColumn()
  id: number;

  // MULTI_TENANT_FIELDS_START
  // @Column() projectId: number;
  // MULTI_TENANT_FIELDS_END

  // TODO: add domain columns here

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}`
            : null;
        const sections = [
            `// === ${moduleName}.module.ts ===\n${moduleFile}`,
            `\n// === ${moduleName}.service.ts ===\n${serviceFile}`,
        ];
        if (controllerFile)
            sections.push(`\n// === ${moduleName}.controller.ts ===\n${controllerFile}`);
        if (entityFile)
            sections.push(`\n// === entities/${moduleName}.entity.ts ===\n${entityFile}`);
        sections.push(`
// === Register in app.module.ts ===
// Add ${pascal}Module to the imports array in src/modules/app/app.module.ts`);
        return {
            content: [{ type: 'text', text: sections.join('\n') }],
        };
    });
}
function toCamelCase(str) {
    return str.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}
function toPascalCase(str) {
    const camel = toCamelCase(str);
    return camel.charAt(0).toUpperCase() + camel.slice(1);
}
function toSnakeCase(str) {
    return str.replace(/-/g, '_');
}
