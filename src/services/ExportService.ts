import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { ContentItem } from '../types';
import { StagingService } from './StagingService';

const execAsync = promisify(exec);

export class ExportService {
  static async getFreeSpace(targetPath: string) {
    try {
      if (process.platform === 'win32') {
        const drive = path.parse(targetPath).root;
        const { stdout } = await execAsync(`powershell "Get-PSDrive -Name ${drive.replace(':', '')} | Select-Object -ExpandProperty Free"`);
        return parseInt(stdout.trim());
      }
      return null;
    } catch (err) {
      return null;
    }
  }

  static async listDrives() {
    try {
      if (process.platform === 'win32') {
        // Use PowerShell to get drive info, it's more modern than wmic
        const { stdout } = await execAsync('powershell "Get-PSDrive -PSProvider FileSystem | Select-Object Name, @{Name=\'Label\';Expression={$_.Description}}, @{Name=\'Free\';Expression={$_.Free}} | ConvertTo-Json"');
        const drives = JSON.parse(stdout);
        
        const driveList = Array.isArray(drives) ? drives : [drives];
        return driveList.map((d: any) => ({
          id: `${d.Name}:`,
          label: d.Label || 'Local Disk',
          freeSpace: d.Free
        }));
      }
      return [];
    } catch (err) {
      console.error('Failed to list drives', err);
      return [];
    }
  }

  static async exportToUsb(
    itemIds: string[],
    usbRoot: string,
    items: ContentItem[],
    options: { contentOwnerId?: string } = {},
  ) {
    const selectedItems = items.filter(i => itemIds.includes(i.id));
    const ops = await StagingService.prepareOperations(selectedItems, usbRoot, options);
    const results = await StagingService.execute(ops);
    
    const summary = { 
      results,
      success: results.filter(r => r.status === 'success').length, 
      skipped: results.filter(r => r.status === 'skipped').length, 
      error: results.filter(r => r.status === 'error').length 
    };
    
    return summary;
  }
}
