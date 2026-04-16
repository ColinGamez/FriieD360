import fs from 'fs-extra';
import path from 'path';

export interface RenameOperation {
  id: string;
  oldPath: string;
  newPath: string;
  fileName: string;
  newFileName: string;
  status: 'pending' | 'success' | 'error';
  error?: string;
}

export class RenameService {
  static async preview(items: any[], template: string): Promise<RenameOperation[]> {
    return items.map(item => {
      const ext = path.extname(item.fullPath);
      const dir = path.dirname(item.fullPath);
      
      let newName = template
        .replace('[TitleID]', item.metadata.titleId || '00000000')
        .replace('[GameName]', item.metadata.gameName || 'Unknown Game')
        .replace('[Name]', item.name || 'Unknown')
        .replace('[Category]', item.metadata.category || 'Other')
        .replace('[ProfileID]', item.metadata.technical?.profileId || '0000000000000000');

      // Sanitize filename
      newName = newName.replace(/[\\/:*?"<>|]/g, '_').trim();
      
      const newFileName = `${newName}${ext}`;
      const newPath = path.join(dir, newFileName);

      return {
        id: item.id,
        oldPath: item.fullPath,
        newPath,
        fileName: item.fileName,
        newFileName,
        status: 'pending'
      };
    });
  }

  static async apply(operations: RenameOperation[]): Promise<RenameOperation[]> {
    const results: RenameOperation[] = [];
    for (const op of operations) {
      try {
        if (op.oldPath === op.newPath) {
          results.push({ ...op, status: 'success' });
          continue;
        }

        if (await fs.pathExists(op.newPath)) {
          results.push({ ...op, status: 'error', error: 'Target file already exists' });
          continue;
        }

        await fs.move(op.oldPath, op.newPath);
        results.push({ ...op, status: 'success' });
      } catch (err: any) {
        results.push({ ...op, status: 'error', error: err.message });
      }
    }
    return results;
  }
}
