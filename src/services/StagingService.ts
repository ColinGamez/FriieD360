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
  private static TYPE_MAP: Record<string, string> = {
    'avatar_item': '00009000',
    'theme': '00030000',
    'dlc': '00000002',
    'gamerpic': '00020000',
    'demo': '000D0000',
    'title_update': '000B0000',
    'xbla': '00070000',
    'god': '00080000'
  };

  private static DEFAULT_TITLE_IDS: Record<string, string> = {
    'avatar_item': 'FFED0707',
    'theme': 'FFFE07D1',
    'gamerpic': 'FFFE07D1'
  };

  static async prepareOperations(items: any[], outputBase: string): Promise<StagingOp[]> {
    return items.map(item => {
      const typeId = this.TYPE_MAP[item.type] || '00000001';
      
      // Use the item's detected Title ID if it's valid (8 hex chars and not 'Unknown'), 
      // otherwise fallback to the system Title IDs or a generic one.
      let titleId = item.metadata?.titleId;
      if (!titleId || titleId === 'Unknown' || !/^[0-9A-Fa-f]{8}$/.test(titleId)) {
        titleId = this.DEFAULT_TITLE_IDS[item.type] || '00000000';
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
