import fs from 'fs-extra';
import path from 'path';
import { ContentItem } from '../types';
import { buildContentRelativePath } from '../utils/contentPaths';

export interface StagingOp {
  source: string;
  dest: string;
  fileName: string;
  status: 'pending' | 'success' | 'skipped' | 'error';
  error?: string;
}

export class StagingService {
  static async prepareOperations(
    items: ContentItem[],
    outputBase: string,
    options: { contentOwnerId?: string } = {},
  ): Promise<StagingOp[]> {
    return items.map(item => {
      const relativePath = buildContentRelativePath(item, options).split('/');
      const dest = path.join(outputBase, ...relativePath);

      return {
        source: item.fullPath,
        dest,
        fileName: item.fileName,
        status: 'pending',
      };
    });
  }

  static async execute(ops: StagingOp[]): Promise<StagingOp[]> {
    const results: StagingOp[] = [];

    for (const op of ops) {
      try {
        if (await fs.pathExists(op.dest)) {
          results.push({ ...op, status: 'skipped' });
          continue;
        }

        await fs.ensureDir(path.dirname(op.dest));
        await fs.copy(op.source, op.dest);
        results.push({ ...op, status: 'success' });
      } catch (err: any) {
        results.push({ ...op, status: 'error', error: err.message });
      }
    }
    return results;
  }
}
