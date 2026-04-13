import fs from 'fs-extra';
import path from 'path';

export interface StagingOp {
  source: string;
  dest: string;
  fileName: string;
  status: 'pending' | 'success' | 'skipped' | 'error';
  error?: string;
}

export class StagingService {
  private static AVATAR_TITLE_ID = 'FFED0707';
  private static THEME_TITLE_ID = 'FFFE07D1';
  private static AVATAR_TYPE_ID = '00009000';
  private static THEME_TYPE_ID = '00030000';

  static async prepareOperations(items: any[], outputBase: string): Promise<StagingOp[]> {
    return items.map(item => {
      const typeId = item.type === 'avatar_item' ? this.AVATAR_TYPE_ID : this.THEME_TYPE_ID;
      
      // Use the item's detected Title ID if it's valid (8 hex chars and not 'Unknown'), 
      // otherwise fallback to the system Title IDs.
      let titleId = item.metadata?.titleId;
      if (!titleId || titleId === 'Unknown' || !/^[0-9A-Fa-f]{8}$/.test(titleId)) {
        titleId = item.type === 'avatar_item' ? this.AVATAR_TITLE_ID : this.THEME_TITLE_ID;
      }
      
      const relativePath = path.join('Content', '0000000000000000', titleId.toUpperCase(), typeId, item.fileName);
      const dest = path.join(outputBase, relativePath);

      return {
        source: item.fullPath,
        dest: dest,
        fileName: item.fileName,
        status: 'pending'
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
