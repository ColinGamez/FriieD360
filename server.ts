import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs-extra";
import { nanoid } from "nanoid";
import { ScannerService } from "./src/services/ScannerService";
import { RepairService } from "./src/services/RepairService";
import { StagingService } from "./src/services/StagingService";
import { ExportService } from "./src/services/ExportService";
import { InstalledContentService } from "./src/services/InstalledContentService";

const DB_PATH = path.join(process.cwd(), "db.json");
let isWriting = false;
const writeQueue: any[] = [];

async function getDb() {
  if (!(await fs.pathExists(DB_PATH))) {
    const initialDb = {
      items: [],
      settings: { sourceFolders: [], outputFolder: "", theme: "dark", scanOnStartup: false },
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
    ScannerService.scanFolders(sourceFolders, db.items, deep).then(async (items) => {
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
    }
    res.json({ success: true, item });
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
      ScannerService.scanFolders(db.settings.sourceFolders, db.items).then(async (items) => {
        const updatedDb = await getDb();
        updatedDb.items = items;
        await saveDb(updatedDb);
        console.log("Startup scan complete.");
      });
    }
  });
}

startServer();
