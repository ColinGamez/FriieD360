import fs from 'fs-extra';
import path from 'path';
import { nanoid } from 'nanoid';
import { ContentType } from '../types';
import { MetadataService } from './MetadataService';
import { MetadataParser } from './MetadataParser';

export interface ScanProgress {
  total: number;
  current: number;
  folder: string;
  isScanning: boolean;
}

export class ScannerService {
  private static progress: ScanProgress = { total: 0, current: 0, folder: '', isScanning: false };

  static getProgress() { return this.progress; }

  static async scanFolders(folders: string[], existingItems: any[], deep: boolean = false, autoRepair: boolean = false, customMappings: Record<string, string> = {}) {
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
      await this.walk(folder, cache, results, deep, autoRepair, customMappings);
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

  private static async walk(dir: string, cache: Map<string, any>, results: any[], deep: boolean, autoRepair: boolean, customMappings: Record<string, string> = {}) {
    this.progress.folder = dir;
    try {
      const files = await fs.readdir(dir);

      for (const file of files) {
        const fullPath = path.join(dir, file);
        try {
          const stat = await fs.lstat(fullPath);

          if (stat.isDirectory()) {
            await this.walk(fullPath, cache, results, deep, autoRepair, customMappings);
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
            const isDLC = fullPath.includes('00000002');
            const isGamerpic = fullPath.includes('00020000');
            const isDemo = fullPath.includes('000D0000');
            const isTU = fullPath.includes('000B0000');
            const isXBLA = fullPath.includes('00070000');
            const isGOD = fullPath.includes('00080000');
            
            if (isAvatar || isTheme || isDLC || isGamerpic || isDemo || isTU || isXBLA || isGOD) {
              const ext = path.extname(file).toUpperCase();
              const header = await MetadataParser.verifyHeader(fullPath);
              
              // Only add if it has a valid Xbox header or we're explicitly looking for it
              if (header.isValid || ext === '.CON' || ext === '') {
                
                let currentFullPath = fullPath;
                let currentFile = file;
                let currentExt = ext;
                let currentIsExtensionless = ext === '';

                if (autoRepair && currentIsExtensionless && header.isValid) {
                  const newPath = fullPath + '.CON';
                  try {
                    await fs.move(fullPath, newPath);
                    currentFullPath = newPath;
                    currentFile = file + '.CON';
                    currentExt = '.CON';
                    currentIsExtensionless = false;
                  } catch (e) {
                    console.error(`Auto-repair failed for ${fullPath}`, e);
                  }
                }

                const meta = MetadataService.deriveMetadata(currentFullPath, currentFile, customMappings);
                const technical = await MetadataParser.extractTechnicalInfo(currentFullPath);
                if (technical) {
                  meta.technical = {
                    profileId: technical.profileId,
                    consoleId: technical.consoleId,
                    deviceId: technical.deviceId,
                    mediaId: technical.mediaId
                  };
                  // Use Title ID from header if available and valid
                  if (technical.titleId && technical.titleId !== '00000000') {
                    meta.titleId = technical.titleId;
                  }
                }

                let type: ContentType = 'dlc';
                if (isAvatar) type = 'avatar_item';
                else if (isTheme) type = 'theme';
                else if (isGamerpic) type = 'gamerpic';
                else if (isDemo) type = 'demo';
                else if (isTU) type = 'title_update';
                else if (isXBLA) type = 'xbla';
                else if (isGOD) type = 'god';

                results.push({
                  id: cached?.id || nanoid(),
                  name: path.parse(currentFile).name,
                  fileName: currentFile,
                  extension: currentExt,
                  fullPath: currentFullPath,
                  parentFolder: dir,
                  size: stat.size,
                  type,
                  isExtensionless: currentIsExtensionless,
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
