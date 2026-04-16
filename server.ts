import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import os from "os";
import fs from "fs-extra";
import { nanoid } from "nanoid";
import { ScannerService } from "./src/services/ScannerService";
import { RepairService } from "./src/services/RepairService";
import { StagingService } from "./src/services/StagingService";
import { ExportService } from "./src/services/ExportService";
import { InstalledContentService } from "./src/services/InstalledContentService";
import { RenameService } from "./src/services/RenameService";
import { MetadataService } from "./src/services/MetadataService";

const DB_PATH = path.join(process.cwd(), "db.json");
let isWriting = false;
const writeQueue: any[] = [];

async function getDb() {
  if (!(await fs.pathExists(DB_PATH))) {
    const initialDb = {
      items: [],
      settings: { sourceFolders: [], outputFolder: "", theme: "dark", scanOnStartup: false, autoRepair: false, customMappings: {} },
      collections: [],
      logs: []
    };
    await fs.writeJson(DB_PATH, initialDb);
    return initialDb;
  }
  return await fs.readJson(DB_PATH);
}

async function saveDb(db: any) {
  if (isWriting) {
    writeQueue.push(db);
    return;
  }
  isWriting = true;
  try {
    await fs.writeJson(DB_PATH, db);
  } finally {
    isWriting = false;
    if (writeQueue.length > 0) {
      const next = writeQueue.shift();
      await saveDb(next);
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/library", async (req, res) => {
    const db = await getDb();
    res.json(db.items);
  });

  app.post("/api/scanner/scan", async (req, res) => {
    const { deep } = req.body;
    const currentProgress = ScannerService.getProgress();
    if (currentProgress.isScanning) {
      return res.status(400).json({ error: "Scan already in progress" });
    }

    const db = await getDb();
    const sourceFolders = db.settings.sourceFolders;

    if (!sourceFolders || sourceFolders.length === 0) {
      return res.status(400).json({ error: "No source folders configured" });
    }

    // Run scan in background
    ScannerService.scanFolders(sourceFolders, db.items, deep, db.settings.autoRepair, db.settings.customMappings || {}).then(async (items) => {
      const updatedDb = await getDb();
      updatedDb.items = items;
      updatedDb.logs.push({
        id: nanoid(),
        timestamp: new Date().toISOString(),
        level: "success",
        message: `${deep ? 'Deep' : 'Standard'} scan completed. Found ${items.length} items.`
      });
      
      // Prune logs if they exceed 100 entries to keep db.json manageable
      if (updatedDb.logs.length > 100) {
        updatedDb.logs = updatedDb.logs.slice(-100);
      }

      await saveDb(updatedDb);
    });

    res.json({ success: true });
  });

  app.get("/api/scanner/progress", (req, res) => {
    res.json(ScannerService.getProgress());
  });

  app.get("/api/settings", async (req, res) => {
    const db = await getDb();
    res.json(db.settings);
  });

  app.post("/api/settings", async (req, res) => {
    const db = await getDb();
    db.settings = { ...db.settings, ...req.body };
    await saveDb(db);
    res.json(db.settings);
  });

  app.post("/api/settings/validate", async (req, res) => {
    const { path: p } = req.body;
    const exists = await fs.pathExists(p);
    res.json({ exists });
  });

  app.post("/api/repair/apply", async (req, res) => {
    const { itemIds } = req.body;
    const db = await getDb();
    const itemsToRepair = db.items.filter((i: any) => itemIds.includes(i.id));
    const ops = await RepairService.preview(itemsToRepair);
    const results = await RepairService.apply(ops);

    results.forEach(op => {
      db.logs.push({
        id: nanoid(),
        timestamp: new Date().toISOString(),
        level: op.status === "success" ? "success" : "error",
        message: op.status === "success" 
          ? `Renamed ${op.fileName} to ${op.newFileName}`
          : `Failed to rename ${op.fileName}: ${op.error}`
      });
    });

    await saveDb(db);
    res.json(results);
  });

  app.post("/api/staging/copy", async (req, res) => {
    const { itemIds } = req.body;
    const db = await getDb();
    if (!db.settings.outputFolder) {
      return res.status(400).json({ error: "Output folder not configured" });
    }
    const itemsToStage = db.items.filter((i: any) => itemIds.includes(i.id));
    const ops = await StagingService.prepareOperations(itemsToStage, db.settings.outputFolder);
    const results = await StagingService.execute(ops);
    db.logs.push({
      id: nanoid(),
      timestamp: new Date().toISOString(),
      level: "info",
      message: `Staged ${results.filter(r => r.status === "success").length} items.`
    });
    await saveDb(db);
    res.json(results);
  });

  app.get("/api/collections", async (req, res) => {
    const db = await getDb();
    res.json(db.collections || []);
  });

  app.post("/api/collections", async (req, res) => {
    const db = await getDb();
    const collection = req.body;
    if (!db.collections) db.collections = [];
    const index = db.collections.findIndex((c: any) => c.id === collection.id);
    if (index > -1) {
      db.collections[index] = { ...db.collections[index], ...collection };
    } else {
      db.collections.push({ id: nanoid(), ...collection });
    }
    await saveDb(db);
    res.json(db.collections);
  });

  app.post("/api/collections/delete", async (req, res) => {
    const { id } = req.body;
    const db = await getDb();
    if (db.collections) {
      db.collections = db.collections.filter((c: any) => c.id !== id);
      await saveDb(db);
    }
    res.json(db.collections || []);
  });

  app.post("/api/library/favorite", async (req, res) => {
    const { itemId } = req.body;
    const db = await getDb();
    const item = db.items.find((i: any) => i.id === itemId);
    if (item) {
      item.isFavorite = !item.isFavorite;
      await saveDb(db);
    }
    res.json({ success: true, isFavorite: item?.isFavorite });
  });

  app.post("/api/library/update-metadata", async (req, res) => {
    const { itemId, metadata } = req.body;
    const db = await getDb();
    const item = db.items.find((i: any) => i.id === itemId);
    if (item) {
      item.metadata = { ...item.metadata, ...metadata };
      await saveDb(db);
      res.json({ success: true, item });
    } else {
      res.status(404).json({ success: false, error: "Item not found" });
    }
  });

  app.post("/api/library/bulk-update-metadata", async (req, res) => {
    const { itemIds, metadata } = req.body;
    const db = await getDb();
    let count = 0;
    
    db.items.forEach((item: any) => {
      if (itemIds.includes(item.id)) {
        item.metadata = { ...item.metadata, ...metadata };
        count++;
      }
    });

    if (count > 0) {
      await saveDb(db);
      res.json({ success: true, count });
    } else {
      res.status(404).json({ success: false, error: "No items found" });
    }
  });

  app.post("/api/library/fetch-online", async (req, res) => {
    const { itemIds } = req.body;
    const db = await getDb();
    let updatedCount = 0;
    
    for (const item of db.items) {
      if (itemIds.includes(item.id) && item.metadata.titleId !== 'Unknown') {
        const onlineData = await MetadataService.simulateOnlineFetch(item.metadata.titleId);
        if (onlineData) {
          item.metadata = { ...item.metadata, ...onlineData };
          updatedCount++;
        }
      }
    }
    
    if (updatedCount > 0) {
      db.logs.push({
        id: nanoid(),
        timestamp: new Date().toISOString(),
        level: "success",
        message: `Successfully fetched online metadata for ${updatedCount} items.`
      });
      await saveDb(db);
    }
    
    res.json({ success: true, updatedCount });
  });

  app.post("/api/library/bulk-autofix", async (req, res) => {
    const { itemIds } = req.body;
    const db = await getDb();
    const results = [];
    
    for (const id of itemIds) {
      const item = db.items.find((i: any) => i.id === id);
      if (item) {
        const fixedMeta = MetadataService.deriveMetadata(item.fullPath, item.fileName);
        item.metadata = { ...item.metadata, ...fixedMeta };
        results.push(item);
      }
    }
    
    if (results.length > 0) {
      await saveDb(db);
    }
    res.json(results);
  });

  app.post("/api/library/bulk-delete", async (req, res) => {
    const { itemIds } = req.body;
    const db = await getDb();
    const initialCount = db.items.length;
    db.items = db.items.filter((item: any) => !itemIds.includes(item.id));
    
    if (db.items.length < initialCount) {
      await saveDb(db);
      res.json({ success: true, count: initialCount - db.items.length });
    } else {
      res.status(404).json({ success: false, error: "No items found" });
    }
  });

  app.post("/api/library/rename/preview", async (req, res) => {
    const { itemIds, template } = req.body;
    const db = await getDb();
    const itemsToRename = db.items.filter((i: any) => itemIds.includes(i.id));
    const ops = await RenameService.preview(itemsToRename, template);
    res.json(ops);
  });

  app.post("/api/library/rename/apply", async (req, res) => {
    const { operations } = req.body;
    const db = await getDb();
    const results = await RenameService.apply(operations);

    // Update database with new paths
    results.forEach(op => {
      if (op.status === "success") {
        const item = db.items.find((i: any) => i.id === op.id);
        if (item) {
          item.fullPath = op.newPath;
          item.fileName = op.newFileName;
          item.name = path.parse(op.newFileName).name;
        }
      }
      
      db.logs.push({
        id: nanoid(),
        timestamp: new Date().toISOString(),
        level: op.status === "success" ? "success" : "error",
        message: op.status === "success" 
          ? `Renamed file to ${op.newFileName}`
          : `Failed to rename ${op.fileName}: ${op.error}`
      });
    });

    await saveDb(db);
    res.json(results);
  });

  app.post("/api/library/integrity-check", async (req, res) => {
    const db = await getDb();
    const results = [];
    let removedCount = 0;
    const itemsToKeep = [];

    for (const item of db.items) {
      if (await fs.pathExists(item.fullPath)) {
        itemsToKeep.push(item);
      } else {
        removedCount++;
        results.push({ id: item.id, name: item.name, status: 'missing' });
      }
    }

    if (removedCount > 0) {
      db.items = itemsToKeep;
      await saveDb(db);
    }

    res.json({ success: true, removedCount, results });
  });

  app.post("/api/library/clear", async (req, res) => {
    const db = await getDb();
    db.items = [];
    db.logs.push({
      id: nanoid(),
      timestamp: new Date().toISOString(),
      level: "warn",
      message: "Library database cleared by user."
    });
    await saveDb(db);
    res.json({ success: true });
  });

  app.get("/api/logs", async (req, res) => {
    const db = await getDb();
    res.json(db.logs || []);
  });

  app.post("/api/logs/clear", async (req, res) => {
    const db = await getDb();
    db.logs = [];
    await saveDb(db);
    res.json({ success: true });
  });

  app.get("/api/system/drives", async (req, res) => {
    const drives = await ExportService.listDrives();
    res.json(drives);
  });

  app.get("/api/system/free-space", async (req, res) => {
    const { path } = req.query;
    if (!path) return res.status(400).json({ error: "Path is required" });
    const free = await ExportService.getFreeSpace(path as string);
    res.json({ free });
  });

  app.post("/api/export/usb", async (req, res) => {
    const { itemIds, usbPath } = req.body;
    const db = await getDb();
    const summary = await ExportService.exportToUsb(itemIds, usbPath, db.items);
    res.json(summary);
  });

  app.post("/api/library/check-installed", async (req, res) => {
    const { drivePath } = req.body;
    try {
      const installedSet = await InstalledContentService.scanInstalled(drivePath);
      res.json(Array.from(installedSet));
    } catch (err) {
      res.status(500).json({ error: "Failed to scan drive" });
    }
  });

  app.get("/api/system/status", (req, res) => {
    res.json({
      cpu: Math.round(os.loadavg()[0] * 100 / os.cpus().length),
      memory: Math.round((1 - os.freemem() / os.totalmem()) * 100),
      uptime: os.uptime(),
      platform: os.platform(),
      arch: os.arch()
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    
    // Scan on startup if enabled
    const db = await getDb();
    if (db.settings.scanOnStartup && db.settings.sourceFolders.length > 0) {
      console.log("Starting startup scan...");
      ScannerService.scanFolders(db.settings.sourceFolders, db.items, false, db.settings.autoRepair, db.settings.customMappings || {}).then(async (items) => {
        const updatedDb = await getDb();
        updatedDb.items = items;
        await saveDb(updatedDb);
        console.log("Startup scan complete.");
      });
    }
  });
}

startServer();
