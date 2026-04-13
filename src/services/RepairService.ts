import fs from 'fs-extra';
import path from 'path';

export interface RenameOperation {
  id: string;
  originalPath: string;
  newPath: string;
  fileName: string;
  newFileName: string;
  status: 'pending' | 'success' | 'error';
  error?: string;
}

export class RepairService {
  static async preview(items: any[]): Promise<RenameOperation[]> {
    return items.map(item => {
      const newFileName = `${item.fileName}.CON`;
      const newPath = path.join(item.parentFolder, newFileName);
      
      return {
        id: item.id,
        originalPath: item.fullPath,
        newPath: newPath,
        fileName: item.fileName,
        newFileName: newFileName,
        status: 'pending'
      };
    });
  }

  static async apply(ops: RenameOperation[]): Promise<RenameOperation[]> {
    const results: RenameOperation[] = [];

    for (const op of ops) {
      try {
        if (!await fs.pathExists(op.originalPath)) {
          throw new Error("Source file no longer exists");
        }
        if (await fs.pathExists(op.newPath)) {
          throw new Error("Target file already exists (collision)");
        }

        await fs.rename(op.originalPath, op.newPath);
        results.push({ ...op, status: 'success' });
      } catch (err: any) {
        results.push({ ...op, status: 'error', error: err.message });
      }
    }
    return results;
  }
}
