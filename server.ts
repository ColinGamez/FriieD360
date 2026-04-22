import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import os from 'os';
import fs from 'fs-extra';
import { nanoid } from 'nanoid';
import { ScannerService } from './src/services/ScannerService';
import { RepairService } from './src/services/RepairService';
import { StagingService } from './src/services/StagingService';
import { ExportService } from './src/services/ExportService';
import { InstalledContentService } from './src/services/InstalledContentService';
import { RenameService } from './src/services/RenameService';
import { MetadataService } from './src/services/MetadataService';
import { buildContentRelativePath } from './src/utils/contentPaths';

const DB_PATH = path.join(process.cwd(), 'db.json');

const DEFAULT_SETTINGS = {
  sourceFolders: [],
  outputFolder: '',
  theme: 'carbon',
  scanOnStartup: false,
  autoRepair: false,
  customMappings: {},
  profileMappings: {},
};

interface DbState {
  items: any[];
  settings: typeof DEFAULT_SETTINGS;
  collections: any[];
  logs: any[];
}

interface PathValidationState {
  exists: boolean;
  isDirectory: boolean;
}

let dbQueue: Promise<unknown> = Promise.resolve();

function createInitialDb(): DbState {
  return {
    items: [],
    settings: {
      ...DEFAULT_SETTINGS,
      customMappings: {},
      profileMappings: {},
    },
    collections: [],
    logs: [],
  };
}

function normalizeDb(raw: any): DbState {
  const initial = createInitialDb();
  const theme = raw?.settings?.theme === 'dark' ? 'carbon' : raw?.settings?.theme;

  return {
    items: Array.isArray(raw?.items) ? raw.items : [],
    settings: {
      ...initial.settings,
      ...(raw?.settings || {}),
      theme: theme || initial.settings.theme,
      customMappings: raw?.settings?.customMappings || {},
      profileMappings: raw?.settings?.profileMappings || {},
    },
    collections: Array.isArray(raw?.collections) ? raw.collections : [],
    logs: Array.isArray(raw?.logs) ? raw.logs.slice(-100) : [],
  };
}

async function readDbFile(): Promise<DbState> {
  if (!(await fs.pathExists(DB_PATH))) {
    const initialDb = createInitialDb();
    await fs.writeJson(DB_PATH, initialDb, { spaces: 2 });
    return initialDb;
  }

  return normalizeDb(await fs.readJson(DB_PATH));
}

async function writeDbFile(db: DbState) {
  await fs.writeJson(DB_PATH, normalizeDb(db), { spaces: 2 });
}

async function getDb() {
  await dbQueue;
  return readDbFile();
}

function mutateDb<T>(mutator: (db: DbState) => Promise<T> | T): Promise<T> {
  const mutation = dbQueue.then(async () => {
    const db = await readDbFile();
    const result = await mutator(db);
    await writeDbFile(db);
    return result;
  });

  dbQueue = mutation.then(() => undefined, () => undefined);
  return mutation;
}

function addLog(db: DbState, level: 'info' | 'warn' | 'error' | 'success', message: string, details?: string) {
  db.logs.push({
    id: nanoid(),
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(details ? { details } : {}),
  });

  if (db.logs.length > 100) {
    db.logs = db.logs.slice(-100);
  }
}

function removeItemReferences(db: DbState, itemIds: string[]) {
  if (itemIds.length === 0) return;

  const removed = new Set(itemIds);
  db.collections = (db.collections || []).map((collection: any) => ({
    ...collection,
    itemIds: (collection.itemIds || []).filter((itemId: string) => !removed.has(itemId)),
  }));
}

function normalizeFilePath(filePath: string) {
  const resolved = path.resolve(filePath);
  return process.platform === 'win32' ? resolved.toLowerCase() : resolved;
}

async function getPathValidationState(candidatePath: unknown): Promise<PathValidationState> {
  if (typeof candidatePath !== 'string' || candidatePath.trim().length === 0) {
    return { exists: false, isDirectory: false };
  }

  const normalizedPath = candidatePath.trim();
  if (!(await fs.pathExists(normalizedPath))) {
    return { exists: false, isDirectory: false };
  }

  try {
    const stat = await fs.stat(normalizedPath);
    return {
      exists: true,
      isDirectory: stat.isDirectory(),
    };
  } catch {
    return { exists: true, isDirectory: false };
  }
}

function isWithinPath(parentPath: string, childPath: string) {
  const relative = path.relative(path.resolve(parentPath), path.resolve(childPath));
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function getOwningSourceFolder(itemPath: string, sourceFolders: string[]) {
  return [...sourceFolders]
    .filter((folder) => isWithinPath(folder, itemPath))
    .sort((a, b) => b.length - a.length)[0] || null;
}

function getOrganizeRoot(itemPath: string, sourceFolders: string[]) {
  const owningFolder = getOwningSourceFolder(itemPath, sourceFolders);
  if (!owningFolder) {
    return path.dirname(itemPath);
  }

  const normalizedOwner = path.resolve(owningFolder);
  return path.basename(normalizedOwner).toLowerCase() === 'content'
    ? path.dirname(normalizedOwner)
    : normalizedOwner;
}

function sortDuplicateGroup(group: any[], strategy: 'keep_newest' | 'keep_oldest' | 'keep_shortest_path') {
  return [...group].sort((a, b) => {
    if (strategy === 'keep_newest') {
      return (
        new Date(b.dateModified).getTime() - new Date(a.dateModified).getTime() ||
        a.fullPath.length - b.fullPath.length
      );
    }

    if (strategy === 'keep_oldest') {
      return (
        new Date(a.dateModified).getTime() - new Date(b.dateModified).getTime() ||
        a.fullPath.length - b.fullPath.length
      );
    }

    return (
      a.fullPath.length - b.fullPath.length ||
      new Date(b.dateModified).getTime() - new Date(a.dateModified).getTime()
    );
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;
  const distPath = path.join(process.cwd(), 'dist');
  const isProduction = process.env.NODE_ENV === 'production' || process.argv.includes('--prod');

  app.use(express.json());

  app.get('/api/cover-art/:titleId', (req, res) => {
    const titleId = String(req.params.titleId || '');
    const name = typeof req.query.name === 'string' ? req.query.name : undefined;
    const franchise = typeof req.query.franchise === 'string' ? req.query.franchise : undefined;
    const svg = MetadataService.renderCoverArtSvg(titleId, name, franchise);
    res.type('image/svg+xml').send(svg);
  });

  app.get('/api/library', async (req, res) => {
    const db = await getDb();
    res.json(db.items);
  });

  app.post('/api/scanner/scan', async (req, res) => {
    const { deep = false } = req.body || {};
    const currentProgress = ScannerService.getProgress();
    if (currentProgress.isScanning) {
      return res.status(400).json({ error: 'Scan already in progress' });
    }

    const db = await getDb();
    const sourceFolders = db.settings.sourceFolders;

    if (!sourceFolders || sourceFolders.length === 0) {
      return res.status(400).json({ error: 'No source folders configured' });
    }

    void ScannerService.scanFolders(
      sourceFolders,
      db.items,
      deep,
      db.settings.autoRepair,
      db.settings.customMappings || {},
    )
      .then(async (items) => {
        await mutateDb((nextDb) => {
          nextDb.items = items;
          addLog(nextDb, 'success', `${deep ? 'Deep' : 'Standard'} scan completed. Found ${items.length} items.`);
        });
      })
      .catch(async (error) => {
        await mutateDb((nextDb) => {
          addLog(
            nextDb,
            'error',
            `${deep ? 'Deep' : 'Standard'} scan failed.`,
            error instanceof Error ? error.message : String(error),
          );
        });
      });

    res.json({ success: true });
  });

  app.get('/api/scanner/progress', (req, res) => {
    res.json(ScannerService.getProgress());
  });

  app.get('/api/settings', async (req, res) => {
    const db = await getDb();
    res.json(db.settings);
  });

  app.post('/api/settings', async (req, res) => {
    const settings = await mutateDb((db) => {
      db.settings = {
        ...db.settings,
        ...req.body,
        customMappings: req.body?.customMappings || db.settings.customMappings || {},
        profileMappings: req.body?.profileMappings || db.settings.profileMappings || {},
      };
      return db.settings;
    });

    res.json(settings);
  });

  app.post('/api/settings/validate', async (req, res) => {
    const validation = await getPathValidationState(req.body?.path);
    res.json(validation);
  });

  app.post('/api/repair/apply', async (req, res) => {
    const itemIds = Array.isArray(req.body?.itemIds) ? req.body.itemIds : [];
    if (itemIds.length === 0) {
      return res.status(400).json({ error: 'Select at least one item to repair' });
    }

    const db = await getDb();
    const itemsToRepair = db.items.filter((item: any) => itemIds.includes(item.id));
    if (itemsToRepair.length === 0) {
      return res.status(404).json({ error: 'No matching items found for repair' });
    }

    const ops = await RepairService.preview(itemsToRepair);
    const results = await RepairService.apply(ops);

    await mutateDb(async (nextDb) => {
      for (const op of results) {
        const item = nextDb.items.find((entry: any) => entry.id === op.id);
        if (op.status === 'success' && item) {
          item.fullPath = op.newPath;
          item.parentFolder = path.dirname(op.newPath);
          item.fileName = op.newFileName;
          item.name = path.parse(op.newFileName).name;
          item.extension = path.extname(op.newFileName).toUpperCase();
          item.isExtensionless = false;
        }

        addLog(
          nextDb,
          op.status === 'success' ? 'success' : 'error',
          op.status === 'success'
            ? `Renamed ${op.fileName} to ${op.newFileName}`
            : `Failed to rename ${op.fileName}: ${op.error}`,
        );
      }
    });

    res.json(results);
  });

  app.post('/api/staging/copy', async (req, res) => {
    const itemIds = Array.isArray(req.body?.itemIds) ? req.body.itemIds : [];
    if (itemIds.length === 0) {
      return res.status(400).json({ error: 'Select at least one item to stage' });
    }

    const targetProfileId = typeof req.body?.targetProfileId === 'string'
      ? req.body.targetProfileId
      : undefined;
    const db = await getDb();
    if (!db.settings.outputFolder) {
      return res.status(400).json({ error: 'Output folder not configured' });
    }

    const outputFolderState = await getPathValidationState(db.settings.outputFolder);
    if (outputFolderState.exists && !outputFolderState.isDirectory) {
      return res.status(400).json({ error: 'Configured output path points to a file, not a folder' });
    }

    const itemsToStage = db.items.filter((item: any) => itemIds.includes(item.id));
    if (itemsToStage.length === 0) {
      return res.status(404).json({ error: 'No matching items found for staging' });
    }

    const ops = await StagingService.prepareOperations(itemsToStage, db.settings.outputFolder, { contentOwnerId: targetProfileId });
    const results = await StagingService.execute(ops);

    await mutateDb((nextDb) => {
      addLog(
        nextDb,
        'info',
        `Staged ${results.filter((result) => result.status === 'success').length} items${targetProfileId && targetProfileId !== '0000000000000000' ? ` for profile ${targetProfileId}` : ''}.`,
      );
    });

    res.json(results);
  });

  app.get('/api/collections', async (req, res) => {
    const db = await getDb();
    res.json(db.collections || []);
  });

  app.post('/api/collections', async (req, res) => {
    const collections = await mutateDb((db) => {
      const collection = req.body || {};
      const nextCollection = {
        id: collection.id || nanoid(),
        name: collection.name || 'Untitled Collection',
        description: collection.description || '',
        itemIds: Array.isArray(collection.itemIds) ? collection.itemIds : [],
        color: collection.color,
      };

      const index = db.collections.findIndex((entry: any) => entry.id === nextCollection.id);
      if (index > -1) {
        db.collections[index] = { ...db.collections[index], ...nextCollection };
      } else {
        db.collections.push(nextCollection);
      }

      return db.collections;
    });

    res.json(collections);
  });

  app.post('/api/collections/delete', async (req, res) => {
    const collections = await mutateDb((db) => {
      const id = req.body?.id;
      db.collections = db.collections.filter((collection: any) => collection.id !== id);
      return db.collections;
    });

    res.json(collections);
  });

  app.post('/api/library/favorite', async (req, res) => {
    const itemId = req.body?.itemId;
    const result = await mutateDb((db) => {
      const item = db.items.find((entry: any) => entry.id === itemId);
      if (!item) {
        return { success: false, isFavorite: false, error: 'Item not found' };
      }

      item.isFavorite = !item.isFavorite;
      return { success: true, isFavorite: item.isFavorite };
    });

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  });

  app.post('/api/library/update-metadata', async (req, res) => {
    const result = await mutateDb((db) => {
      const item = db.items.find((entry: any) => entry.id === req.body?.itemId);
      if (!item) {
        return null;
      }

      item.metadata = { ...item.metadata, ...(req.body?.metadata || {}) };
      return item;
    });

    if (!result) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }

    res.json({ success: true, item: result });
  });

  app.post('/api/library/bulk-update-metadata', async (req, res) => {
    const itemIds = Array.isArray(req.body?.itemIds) ? req.body.itemIds : [];
    const metadata = req.body?.metadata || {};

    const count = await mutateDb((db) => {
      let updated = 0;
      db.items.forEach((item: any) => {
        if (itemIds.includes(item.id)) {
          item.metadata = { ...item.metadata, ...metadata };
          updated += 1;
        }
      });
      return updated;
    });

    if (count === 0) {
      return res.status(404).json({ success: false, error: 'No items found' });
    }

    res.json({ success: true, count });
  });

  app.post('/api/library/fetch-online', async (req, res) => {
    const itemIds = Array.isArray(req.body?.itemIds) ? req.body.itemIds : [];
    const db = await getDb();
    const updates = new Map<string, any>();

    for (const item of db.items) {
      if (itemIds.includes(item.id) && item.metadata.titleId !== 'Unknown') {
        const onlineData = await MetadataService.simulateOnlineFetch(item.metadata.titleId);
        if (onlineData) {
          updates.set(item.id, onlineData);
        }
      }
    }

    const updatedCount = await mutateDb((nextDb) => {
      let updated = 0;
      nextDb.items.forEach((item: any) => {
        const onlineData = updates.get(item.id);
        if (onlineData) {
          item.metadata = { ...item.metadata, ...onlineData };
          updated += 1;
        }
      });

      if (updated > 0) {
        addLog(nextDb, 'success', `Refreshed title metadata for ${updated} items.`);
      }

      return updated;
    });

    res.json({ success: true, updatedCount });
  });

  app.post('/api/library/bulk-autofix', async (req, res) => {
    const itemIds = Array.isArray(req.body?.itemIds) ? req.body.itemIds : [];
    const db = await getDb();
    const fixedMetadata = new Map<string, any>();

    db.items.forEach((item: any) => {
      if (itemIds.includes(item.id)) {
        fixedMetadata.set(
          item.id,
          MetadataService.deriveMetadata(item.fullPath, item.fileName, db.settings.customMappings || {}),
        );
      }
    });

    const updatedItems = await mutateDb((nextDb) => {
      const results: any[] = [];
      nextDb.items.forEach((item: any) => {
        const metadata = fixedMetadata.get(item.id);
        if (metadata) {
          item.metadata = { ...item.metadata, ...metadata };
          results.push(item);
        }
      });
      return results;
    });

    res.json(updatedItems);
  });

  app.post('/api/library/bulk-delete', async (req, res) => {
    const itemIds = Array.isArray(req.body?.itemIds) ? req.body.itemIds : [];
    const result = await mutateDb((db) => {
      const initialCount = db.items.length;
      db.items = db.items.filter((item: any) => !itemIds.includes(item.id));
      const removedCount = initialCount - db.items.length;

      if (removedCount > 0) {
        removeItemReferences(db, itemIds);
        addLog(db, 'warn', `Removed ${removedCount} items from the library database.`);
      }

      return { removedCount };
    });

    if (result.removedCount === 0) {
      return res.status(404).json({ success: false, error: 'No items found' });
    }

    res.json({ success: true, count: result.removedCount });
  });

  app.post('/api/library/rename/preview', async (req, res) => {
    const itemIds = Array.isArray(req.body?.itemIds) ? req.body.itemIds : [];
    if (itemIds.length === 0) {
      return res.status(400).json({ error: 'Select at least one item to preview rename operations' });
    }

    const template = req.body?.template || '[Name]';
    const db = await getDb();
    const itemsToRename = db.items.filter((item: any) => itemIds.includes(item.id));
    if (itemsToRename.length === 0) {
      return res.status(404).json({ error: 'No matching items found for rename preview' });
    }

    const ops = await RenameService.preview(itemsToRename, template);
    res.json(ops);
  });

  app.post('/api/library/rename/apply', async (req, res) => {
    const operations = Array.isArray(req.body?.operations) ? req.body.operations : [];
    if (operations.length === 0) {
      return res.status(400).json({ error: 'No rename operations provided' });
    }

    const results = await RenameService.apply(operations);
    const updatedStats = new Map<string, { parentFolder: string; extension: string; dateModified?: string }>();

    for (const result of results) {
      if (result.status === 'success' && await fs.pathExists(result.newPath)) {
        const stat = await fs.stat(result.newPath);
        updatedStats.set(result.id, {
          parentFolder: path.dirname(result.newPath),
          extension: path.extname(result.newFileName).toUpperCase(),
          dateModified: stat.mtime.toISOString(),
        });
      }
    }

    await mutateDb((db) => {
      results.forEach((result) => {
        if (result.status === 'success') {
          const item = db.items.find((entry: any) => entry.id === result.id);
          const stat = updatedStats.get(result.id);
          if (item) {
            item.fullPath = result.newPath;
            item.parentFolder = stat?.parentFolder || path.dirname(result.newPath);
            item.fileName = result.newFileName;
            item.name = path.parse(result.newFileName).name;
            item.extension = stat?.extension || path.extname(result.newFileName).toUpperCase();
            if (stat?.dateModified) {
              item.dateModified = stat.dateModified;
            }
          }
        }

        addLog(
          db,
          result.status === 'success' ? 'success' : 'error',
          result.status === 'success'
            ? `Renamed file to ${result.newFileName}`
            : `Failed to rename ${result.fileName}: ${result.error}`,
        );
      });
    });

    res.json(results);
  });

  app.post('/api/library/duplicates/resolve', async (req, res) => {
    const strategy = req.body?.strategy as 'keep_newest' | 'keep_oldest' | 'keep_shortest_path';
    if (!['keep_newest', 'keep_oldest', 'keep_shortest_path'].includes(strategy)) {
      return res.status(400).json({ success: false, error: 'Invalid strategy' });
    }

    const result = await mutateDb((db) => {
      const groups = new Map<string, any[]>();
      db.items.forEach((item: any) => {
        const key = `${item.metadata?.titleId || 'Unknown'}_${item.size}`;
        if (!groups.has(key)) {
          groups.set(key, []);
        }
        groups.get(key)!.push(item);
      });

      const itemIdsToRemove: string[] = [];
      groups.forEach((group) => {
        if (group.length < 2) return;
        const [, ...duplicates] = sortDuplicateGroup(group, strategy);
        itemIdsToRemove.push(...duplicates.map((item) => item.id));
      });

      if (itemIdsToRemove.length > 0) {
        db.items = db.items.filter((item: any) => !itemIdsToRemove.includes(item.id));
        removeItemReferences(db, itemIdsToRemove);
        addLog(db, 'success', `Resolved ${itemIdsToRemove.length} duplicate entries using "${strategy}".`);
      }

      return { removedCount: itemIdsToRemove.length };
    });

    res.json({ success: true, removedCount: result.removedCount });
  });

  app.post('/api/library/organize', async (req, res) => {
    const itemIds = Array.isArray(req.body?.itemIds) ? req.body.itemIds : [];
    if (itemIds.length === 0) {
      return res.status(400).json({ error: 'Select at least one item to organize' });
    }

    const db = await getDb();
    const itemsToOrganize = db.items.filter((item: any) => itemIds.includes(item.id));
    if (itemsToOrganize.length === 0) {
      return res.status(404).json({ error: 'No matching items found to organize' });
    }

    const sourceFolders = db.settings.sourceFolders || [];
    const results: any[] = [];

    for (const item of itemsToOrganize) {
      const organizeRoot = getOrganizeRoot(item.fullPath, sourceFolders);
      const destination = path.join(organizeRoot, ...buildContentRelativePath(item).split('/'));

      try {
        if (normalizeFilePath(item.fullPath) === normalizeFilePath(destination)) {
          results.push({ id: item.id, fileName: item.fileName, newPath: destination, status: 'skipped' });
          continue;
        }

        if (await fs.pathExists(destination)) {
          results.push({
            id: item.id,
            fileName: item.fileName,
            newPath: destination,
            status: 'error',
            error: 'Target file already exists',
          });
          continue;
        }

        await fs.ensureDir(path.dirname(destination));
        await fs.move(item.fullPath, destination);
        const stat = await fs.stat(destination);
        results.push({
          id: item.id,
          fileName: item.fileName,
          newPath: destination,
          parentFolder: path.dirname(destination),
          dateModified: stat.mtime.toISOString(),
          status: 'success',
        });
      } catch (error) {
        results.push({
          id: item.id,
          fileName: item.fileName,
          newPath: destination,
          status: 'error',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const summary = await mutateDb((nextDb) => {
      let movedCount = 0;
      let skippedCount = 0;
      let errorCount = 0;

      results.forEach((result) => {
        if (result.status === 'success') {
          const item = nextDb.items.find((entry: any) => entry.id === result.id);
          if (item) {
            item.fullPath = result.newPath;
            item.parentFolder = result.parentFolder;
            item.dateModified = result.dateModified || item.dateModified;
          }
          movedCount += 1;
        } else if (result.status === 'skipped') {
          skippedCount += 1;
        } else {
          errorCount += 1;
        }
      });

      addLog(
        nextDb,
        errorCount > 0 ? 'warn' : 'success',
        `Library organize finished. Moved ${movedCount}, skipped ${skippedCount}, errors ${errorCount}.`,
      );

      return { movedCount, skippedCount, errorCount };
    });

    res.json({ success: true, results, ...summary });
  });

  app.post('/api/library/integrity-check', async (req, res) => {
    const db = await getDb();
    const results: any[] = [];
    const missingIds: string[] = [];

    for (const item of db.items) {
      if (await fs.pathExists(item.fullPath)) {
        continue;
      }

      missingIds.push(item.id);
      results.push({ id: item.id, name: item.name, status: 'missing' });
    }

    if (missingIds.length > 0) {
      await mutateDb((nextDb) => {
        nextDb.items = nextDb.items.filter((item: any) => !missingIds.includes(item.id));
        removeItemReferences(nextDb, missingIds);
        addLog(nextDb, 'warn', `Integrity check removed ${missingIds.length} missing items.`);
      });
    }

    res.json({ success: true, removedCount: missingIds.length, results });
  });

  app.post('/api/library/clear', async (req, res) => {
    await mutateDb((db) => {
      db.items = [];
      db.collections = db.collections.map((collection: any) => ({ ...collection, itemIds: [] }));
      addLog(db, 'warn', 'Library database cleared by user.');
    });

    res.json({ success: true });
  });

  app.get('/api/logs', async (req, res) => {
    const db = await getDb();
    res.json(db.logs || []);
  });

  app.post('/api/logs/clear', async (req, res) => {
    await mutateDb((db) => {
      db.logs = [];
    });

    res.json({ success: true });
  });

  app.get('/api/system/drives', async (req, res) => {
    const drives = await ExportService.listDrives();
    res.json(drives);
  });

  app.get('/api/system/free-space', async (req, res) => {
    const targetPath = req.query.path;
    if (!targetPath) {
      return res.status(400).json({ error: 'Path is required' });
    }

    const free = await ExportService.getFreeSpace(targetPath as string);
    res.json({ free });
  });

  app.post('/api/export/usb', async (req, res) => {
    const itemIds = Array.isArray(req.body?.itemIds) ? req.body.itemIds : [];
    if (itemIds.length === 0) {
      return res.status(400).json({ error: 'Select at least one item to export' });
    }

    const usbPath = req.body?.usbPath;
    const targetProfileId = typeof req.body?.targetProfileId === 'string'
      ? req.body.targetProfileId
      : undefined;

    if (!usbPath || typeof usbPath !== 'string') {
      return res.status(400).json({ error: 'USB target path is required' });
    }

    const usbPathState = await getPathValidationState(usbPath);
    if (!usbPathState.exists || !usbPathState.isDirectory) {
      return res.status(400).json({ error: 'USB target path must point to an existing folder' });
    }

    const db = await getDb();
    const itemsToExport = db.items.filter((item: any) => itemIds.includes(item.id));
    if (itemsToExport.length === 0) {
      return res.status(404).json({ error: 'No matching items found for export' });
    }

    const summary = await ExportService.exportToUsb(itemIds, usbPath, db.items, { contentOwnerId: targetProfileId });

    await mutateDb((nextDb) => {
      addLog(
        nextDb,
        summary.error > 0 ? 'warn' : 'success',
        `USB export finished. Copied ${summary.success}, skipped ${summary.skipped}, errors ${summary.error}${targetProfileId && targetProfileId !== '0000000000000000' ? ` for profile ${targetProfileId}` : ''}.`,
      );
    });

    res.json(summary);
  });

  app.post('/api/library/check-installed', async (req, res) => {
    const drivePath = req.body?.drivePath;
    const drivePathState = await getPathValidationState(drivePath);
    if (!drivePathState.exists || !drivePathState.isDirectory) {
      return res.status(400).json({ error: 'Drive path must point to an existing folder' });
    }

    try {
      const installedSet = await InstalledContentService.scanInstalled(drivePath);
      res.json(Array.from(installedSet));
    } catch (error) {
      res.status(500).json({ error: 'Failed to scan drive' });
    }
  });

  app.get('/api/system/status', (req, res) => {
    res.json({
      cpu: Math.round((os.loadavg()[0] * 100) / os.cpus().length),
      memory: Math.round((1 - os.freemem() / os.totalmem()) * 100),
      uptime: os.uptime(),
      platform: os.platform(),
      arch: os.arch(),
    });
  });

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    if (!(await fs.pathExists(distPath))) {
      throw new Error('Production start requested but dist/ is missing. Run "npm run build" first.');
    }

    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', async () => {
    console.log(`Server running on http://localhost:${PORT}`);

    const db = await getDb();
    if (db.settings.scanOnStartup && db.settings.sourceFolders.length > 0) {
      console.log('Starting startup scan...');
      void ScannerService.scanFolders(
        db.settings.sourceFolders,
        db.items,
        false,
        db.settings.autoRepair,
        db.settings.customMappings || {},
      )
        .then(async (items) => {
          await mutateDb((nextDb) => {
            nextDb.items = items;
            addLog(nextDb, 'success', `Startup scan completed. Found ${items.length} items.`);
          });
          console.log('Startup scan complete.');
        })
        .catch(async (error) => {
          await mutateDb((nextDb) => {
            addLog(
              nextDb,
              'error',
              'Startup scan failed.',
              error instanceof Error ? error.message : String(error),
            );
          });
        });
    }
  });
}

startServer();
