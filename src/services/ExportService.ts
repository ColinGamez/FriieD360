import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs-extra';
import path from 'path';
import { StagingService } from './StagingService';

const execAsync = promisify(exec);

export class ExportService {
  static async listDrives() {
    try {
      if (process.platform === 'win32') {
        const { stdout } = await execAsync('wmic logicaldisk get caption, description, volumename');
        const lines = stdout.split('\r\n').filter(line => line.trim() !== '');
        return lines.slice(1).map(line => {
          const parts = line.trim().split(/\s{2,}/);
          return { id: parts[0], label: parts[2] || 'Local Disk', type: parts[1] };
        });
      }
      return [];
    } catch {
      return [];
    }
  }

  static async exportToUsb(itemIds: string[], usbRoot: string, items: any[]) {
    const selectedItems = items.filter(i => itemIds.includes(i.id));
    const ops = await StagingService.prepareOperations(selectedItems, usbRoot);
    
    const summary = { success: 0, skipped: 0, error: 0 };
    
    for (const op of ops) {
      try {
        if (await fs.pathExists(op.dest)) {
          summary.skipped++;
        } else {
          await fs.ensureDir(path.dirname(op.dest));
          await fs.copy(op.source, op.dest);
          summary.success++;
        }
      } catch {
        summary.error++;
      }
    }
    return summary;
  }
}
