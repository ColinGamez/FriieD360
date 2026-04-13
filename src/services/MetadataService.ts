import fs from 'fs-extra';

export interface ItemMetadata {
  titleId: string;
  gameName: string;
  category: string;
  tags: string[];
}

export class MetadataService {
  private static TITLE_MAP: Record<string, { name: string, franchise: string }> = {
    '4D5307E6': { name: 'Halo 3', franchise: 'Halo' },
    '4D53085B': { name: 'Halo: Reach', franchise: 'Halo' },
    '4D530919': { name: 'Halo 4', franchise: 'Halo' },
    '41560817': { name: 'Modern Warfare 2', franchise: 'Call of Duty' },
    '41560855': { name: 'Black Ops', franchise: 'Call of Duty' },
    '415608CB': { name: 'Modern Warfare 3', franchise: 'Call of Duty' },
    '415608C3': { name: 'Black Ops II', franchise: 'Call of Duty' },
    '4541088F': { name: 'Battlefield 3', franchise: 'Battlefield' },
    '45410950': { name: 'Battlefield 4', franchise: 'Battlefield' },
    '5454082B': { name: 'Red Dead Redemption', franchise: 'Red Dead' },
    '545408A7': { name: 'Grand Theft Auto V', franchise: 'GTA' },
    '54540825': { name: 'Grand Theft Auto IV', franchise: 'GTA' },
    '425307D1': { name: 'Skyrim', franchise: 'Elder Scrolls' },
    '425307D5': { name: 'Fallout 3', franchise: 'Fallout' },
    '425307E6': { name: 'Fallout: New Vegas', franchise: 'Fallout' },
    '58410A5A': { name: 'Minecraft', franchise: 'Minecraft' },
    '4D5307E1': { name: 'Gears of War', franchise: 'Gears of War' },
    '4D53082D': { name: 'Gears of War 2', franchise: 'Gears of War' },
    '4D5308AB': { name: 'Gears of War 3', franchise: 'Gears of War' },
    'FFED0707': { name: 'Avatar Asset', franchise: 'System' },
    'FFFE07D1': { name: 'Xbox Dashboard', franchise: 'System' },
  };

  static deriveMetadata(fullPath: string, fileName: string): ItemMetadata {
    // Look for 8-character hex strings that are likely Title IDs
    // We prioritize IDs found in the path structure (e.g. /Content/.../TITLEID/...)
    const pathParts = fullPath.split(/[\\/]/);
    let titleId = 'Unknown';
    
    // Check if any path part looks like a Title ID (8 hex chars)
    // We iterate backwards to find the most specific one
    for (let i = pathParts.length - 1; i >= 0; i--) {
      const part = pathParts[i];
      if (/^[0-9A-Fa-f]{8}$/.test(part) && part !== '00000000' && part !== '00009000' && part !== '00030000') {
        titleId = part.toUpperCase();
        break;
      }
    }

    // Fallback to general regex if not found in path parts
    if (titleId === 'Unknown') {
      const titleIdMatch = fullPath.match(/[0-9A-Fa-f]{8}/g);
      titleId = titleIdMatch?.find(id => id !== '00000000' && id !== '00009000' && id !== '00030000') || 'Unknown';
    }

    const info = this.TITLE_MAP[titleId.toUpperCase()];

    const tags: string[] = [];
    if (fullPath.toLowerCase().includes('official')) tags.push('Official');
    if (fullPath.toLowerCase().includes('mod') || fullPath.toLowerCase().includes('custom')) tags.push('Custom');
    
    return {
      titleId,
      gameName: info?.name || 'Unknown Game',
      category: info?.franchise || 'Other',
      tags: tags
    };
  }

  static async verifyHeader(filePath: string): Promise<{ isValid: boolean, format: string }> {
    try {
      const buffer = Buffer.alloc(4);
      const fd = await fs.open(filePath, 'r');
      await fs.read(fd, buffer, 0, 4, 0);
      await fs.close(fd);

      const signature = buffer.toString('utf-8', 0, 4);
      if (signature.startsWith('CON')) return { isValid: true, format: 'CON' };
      if (signature.startsWith('LIVE')) return { isValid: true, format: 'LIVE' };
      
      return { isValid: false, format: 'Unknown' };
    } catch {
      return { isValid: false, format: 'Error' };
    }
  }
}
