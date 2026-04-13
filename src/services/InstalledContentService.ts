import fs from 'fs-extra';
import path from 'path';

export class InstalledContentService {
  static async scanInstalled(drivePath: string): Promise<Set<string>> {
    const installedSet = new Set<string>();
    const contentPath = path.join(drivePath, 'Content');

    if (!(await fs.pathExists(contentPath))) {
      return installedSet;
    }

    await this.walk(contentPath, installedSet);
    return installedSet;
  }

  private static async walk(dir: string, set: Set<string>) {
    try {
      const files = await fs.readdir(dir);

      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = await fs.stat(fullPath);

        if (stat.isDirectory()) {
          await this.walk(fullPath, set);
        } else {
          set.add(`${file}_${stat.size}`);
        }
      }
    } catch (err) {
      console.error(`Failed to walk installed content in ${dir}`, err);
    }
  }
}
