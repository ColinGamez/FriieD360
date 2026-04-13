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

  static async scanFolders(folders: string[], existingItems: any[], deep: boolean = false) {
    this.progress = { total: 0, current: 0, folder: '', isScanning: true };
    
    const cache = new Map(existingItems.map(i => [i.fullPath, i]));
    const results: any[] = [];

    // First pass: count all files to provide accurate progress
    for (const folder of folders) {
      if (!(await fs.pathExists(folder))) continue;
      await this.countFiles(folder);
    }

    // Second pass: walk and process
    for (const folder of folders) {
      if (!(await fs.pathExists(folder))) continue;
      await this.walk(folder, cache, results, deep);
    }

    this.progress.isScanning = false;
    return results;
  }

  private static async countFiles(dir: string) {
    try {
      const files = await fs.readdir(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
        try {
          const stat = await fs.lstat(fullPath);
          if (stat.isDirectory()) {
            await this.countFiles(fullPath);
          } else {
            this.progress.total++;
          }
        } catch (e) {
          // Skip files we can't stat
        }
      }
    } catch (err) {
      console.error(`Failed to count files in ${dir}`, err);
    }
  }

  private static async walk(dir: string, cache: Map<string, any>, results: any[], deep: boolean) {
    this.progress.folder = dir;
    try {
      const files = await fs.readdir(dir);

      for (const file of files) {
        const fullPath = path.join(dir, file);
        try {
          const stat = await fs.lstat(fullPath);

          if (stat.isDirectory()) {
            await this.walk(fullPath, cache, results, deep);
          } else {
            this.progress.current++;
            
            const cached = cache.get(fullPath);
            // In deep scan, we ignore the cache and re-process everything
            if (!deep && cached && cached.dateModified === stat.mtime.toISOString()) {
              results.push(cached);
              continue;
            }

            const isAvatar = fullPath.includes('00009000') || fullPath.toLowerCase().includes('avatar');
            const isTheme = fullPath.includes('00030000') || fullPath.toLowerCase().includes('theme');
            
            if (isAvatar || isTheme) {
              const ext = path.extname(file).toUpperCase();
              const header = await MetadataService.verifyHeader(fullPath);
              
              // Only add if it has a valid Xbox header or we're explicitly looking for it
              if (header.isValid || ext === '.CON' || ext === '') {
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
        } catch (e) {
          // Skip files we can't process
          this.progress.current++;
        }
      }
    } catch (err) {
      console.error(`Failed to walk ${dir}`, err);
    }
  }
}
