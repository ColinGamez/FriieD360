import fs from 'fs-extra';
import path from 'path';
import { nanoid } from 'nanoid';
import { MetadataService } from './MetadataService';

export interface ScanProgress {
  total: number;
  current: number;
  folder: string;
  isScanning: boolean;
}

export class ScannerService {
  private static progress: ScanProgress = { total: 0, current: 0, folder: '', isScanning: false };

  static getProgress() { return this.progress; }

  static async scanFolders(folders: string[], existingItems: any[]) {
    this.progress = { total: 0, current: 0, folder: '', isScanning: true };
    
    const cache = new Map(existingItems.map(i => [i.fullPath, i]));
    const results: any[] = [];

    for (const folder of folders) {
      if (!(await fs.pathExists(folder))) continue;
      await this.countFiles(folder);
    }

    for (const folder of folders) {
      if (!(await fs.pathExists(folder))) continue;
      await this.walk(folder, cache, results);
    }

    this.progress.isScanning = false;
    return results;
  }

  private static async countFiles(dir: string) {
    try {
      const files = await fs.readdir(dir);
      this.progress.total += files.length;
      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = await fs.stat(fullPath);
        if (stat.isDirectory()) await this.countFiles(fullPath);
      }
    } catch (err) {
      console.error(`Failed to count files in ${dir}`, err);
    }
  }

  private static async walk(dir: string, cache: Map<string, any>, results: any[]) {
    this.progress.folder = dir;
    try {
      const files = await fs.readdir(dir);

      for (const file of files) {
        this.progress.current++;
        const fullPath = path.join(dir, file);
        const stat = await fs.stat(fullPath);

        if (stat.isDirectory()) {
          await this.walk(fullPath, cache, results);
        } else {
          const cached = cache.get(fullPath);
          
          if (cached && cached.dateModified === stat.mtime.toISOString()) {
            results.push(cached);
            continue;
          }

          const isAvatar = fullPath.includes('00009000') || fullPath.toLowerCase().includes('avatar');
          const isTheme = fullPath.includes('00030000') || fullPath.toLowerCase().includes('theme');
          
          if (isAvatar || isTheme) {
            const ext = path.extname(file).toUpperCase();
            const header = await MetadataService.verifyHeader(fullPath);
            const meta = MetadataService.deriveMetadata(fullPath, file);

            results.push({
              id: cached?.id || nanoid(),
              name: path.parse(file).name,
              fileName: file,
              extension: ext,
              fullPath,
              parentFolder: dir,
              size: stat.size,
              type: isAvatar ? 'avatar_item' : 'theme',
              isExtensionless: ext === '',
              isFavorite: cached?.isFavorite || false,
              isStaged: cached?.isStaged || false,
              dateModified: stat.mtime.toISOString(),
              isValid: header.isValid,
              format: header.format,
              metadata: meta
            });
          }
        }
      }
    } catch (err) {
      console.error(`Failed to walk ${dir}`, err);
    }
  }
}
