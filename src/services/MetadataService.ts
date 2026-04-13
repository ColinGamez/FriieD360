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
    '4541088F': { name: 'Battlefield 3', franchise: 'Battlefield' },
    '5454082B': { name: 'Red Dead Redemption', franchise: 'Red Dead' },
    'FFED0707': { name: 'Avatar Asset', franchise: 'System' },
    'FFFE07D1': { name: 'Xbox Dashboard', franchise: 'System' },
  };

  static deriveMetadata(fullPath: string, fileName: string): ItemMetadata {
    const titleIdMatch = fullPath.match(/[0-9A-Fa-f]{8}/g);
    const titleId = titleIdMatch?.find(id => id !== '00000000') || 'Unknown';
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
