import fs from 'fs-extra';

export class MetadataParser {
  static async verifyHeader(filePath: string): Promise<{ isValid: boolean, format: string }> {
    try {
      const buffer = Buffer.alloc(4);
      const fd = await fs.open(filePath, 'r');
      await fs.read(fd, buffer, 0, 4, 0);
      await fs.close(fd);

      const signature = buffer.toString('utf-8', 0, 4);
      if (signature.startsWith('CON')) return { isValid: true, format: 'CON' };
      if (signature.startsWith('LIVE')) return { isValid: true, format: 'LIVE' };
      if (signature.startsWith('PIRS')) return { isValid: true, format: 'PIRS' };
      
      return { isValid: false, format: 'Unknown' };
    } catch {
      return { isValid: false, format: 'Error' };
    }
  }

  static async extractTechnicalInfo(filePath: string) {
    try {
      // STFS Header is 0x1000 bytes, but we only need up to 0x411
      const buffer = Buffer.alloc(0x411);
      const fd = await fs.open(filePath, 'r');
      await fs.read(fd, buffer, 0, 0x411, 0);
      await fs.close(fd);

      // Verify it's a valid STFS package
      const signature = buffer.toString('utf-8', 0, 4);
      if (!['CON ', 'LIVE', 'PIRS'].includes(signature)) return null;

      // Title ID: 0x360 (4 bytes)
      const titleId = buffer.toString('hex', 0x360, 0x364).toUpperCase();
      
      // Console ID: 0x369 (5 bytes)
      const consoleId = buffer.toString('hex', 0x369, 0x36E).toUpperCase();
      
      // Profile ID: 0x371 (8 bytes)
      const profileId = buffer.toString('hex', 0x371, 0x379).toUpperCase();

      // Media ID: 0x354 (4 bytes)
      const mediaId = buffer.toString('hex', 0x354, 0x358).toUpperCase();
      
      // Device ID: 0x3FD (20 bytes)
      const deviceId = buffer.toString('hex', 0x3FD, 0x411).toUpperCase();

      return { titleId, consoleId, profileId, deviceId, mediaId };
    } catch (err) {
      console.error('Failed to extract technical info', err);
      return null;
    }
  }
}
