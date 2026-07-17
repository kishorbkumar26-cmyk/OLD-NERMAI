import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const moduleName = args[0];

if (!moduleName) {
  console.error('Usage: ts-node generate-module.ts <module-name>');
  process.exit(1);
}

const backendDir = path.join(__dirname, '..');
const moduleDir = path.join(backendDir, 'modules', moduleName);

if (fs.existsSync(moduleDir)) {
  console.error(`Module ${moduleName} already exists!`);
  process.exit(1);
}

fs.mkdirSync(moduleDir, { recursive: true });

const files = {
  'index.ts': `export * from './routes';
export * from './controller';
export * from './service';
export * from './types';
`,
  'routes.ts': `import { Router } from 'express';
import { requireAuth, requireRole } from '../../core/middleware/auth.middleware';
import * as Controller from './controller';

export const ${moduleName}Routes = Router();

${moduleName}Routes.get('/', requireAuth, Controller.list);
${moduleName}Routes.get('/:id', requireAuth, Controller.getById);
${moduleName}Routes.post('/', requireAuth, requireRole(['admin']), Controller.create);
${moduleName}Routes.put('/:id', requireAuth, requireRole(['admin']), Controller.update);
${moduleName}Routes.delete('/:id', requireAuth, requireRole(['admin']), Controller.remove);
`,
  'controller.ts': `import { Request, Response, NextFunction } from 'express';
import { ${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}Service } from './service';

const service = new ${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}Service();

export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user!.tenantId;
    const data = await service.list(tenantId);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user!.tenantId;
    const data = await service.getById(req.params.id, tenantId);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user!.tenantId;
    const adminId = req.user!.userId;
    const data = await service.create(req.body, adminId, tenantId);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user!.tenantId;
    const adminId = req.user!.userId;
    const data = await service.update(req.params.id, req.body, adminId, tenantId);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user!.tenantId;
    const adminId = req.user!.userId;
    await service.delete(req.params.id, adminId, tenantId);
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    next(error);
  }
};
`,
  'service.ts': `import { AppError } from '../../core/errors/AppError';
import { ${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}Repository } from './repository';
import { I${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)} } from './types';

export class ${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}Service {
  private repo = new ${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}Repository();

  async list(tenantId: string) {
    return await this.repo.findAllByTenant(tenantId);
  }

  async getById(id: string, tenantId: string) {
    const data = await this.repo.findById(id);
    if (!data || data.tenantId !== tenantId) {
      throw new AppError('Not found', 404);
    }
    return data;
  }

  async create(payload: Partial<I${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}>, adminId: string, tenantId: string) {
    return await this.repo.create({ ...payload, tenantId } as any, adminId);
  }

  async update(id: string, payload: Partial<I${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}>, adminId: string, tenantId: string) {
    const existing = await this.getById(id, tenantId);
    await this.repo.update(id, payload, adminId);
    return await this.repo.findById(id);
  }

  async delete(id: string, adminId: string, tenantId: string) {
    const existing = await this.getById(id, tenantId);
    await this.repo.softDelete(id, adminId);
  }
}
`,
  'repository.ts': `import { BaseRepository } from '../../core/repositories/BaseRepository';
import { I${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)} } from './types';

export class ${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}Repository extends BaseRepository<I${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}> {
  constructor() {
    super('${moduleName}');
  }
}
`,
  'types.ts': `import { BaseAuditFields } from '../../core/types';

export interface I${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)} extends BaseAuditFields {
  tenantId: string;
  name: string;
  isActive: boolean;
}
`,
  'README.md': `# ${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)} Module

## Purpose
[Describe what this module does and why it exists]

## Responsibilities
- [List primary responsibilities]

## Public APIs
- [List functions/classes exported in \`index.ts\`]

## Dependencies
- [List other modules this module depends on]

## Events Published
- [List any domain events published]

## Events Consumed
- [List any domain events consumed]
`
};

for (const [filename, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(moduleDir, filename), content);
}

console.log(`✅ Module '${moduleName}' successfully generated at modules/${moduleName}`);
