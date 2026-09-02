import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// In-memory & JSON file persistent store for cross-device sync
const SYNC_DATA_FILE = path.join(process.cwd(), "sync_store.json");

interface SyncPayload {
  syncKey: string;
  lastUpdated: number;
  readStoryIds: number[];
  favoriteStoryIds: number[];
  bookmarks: Array<{ storyId: number; createdAt: number; note?: string }>;
  notes: Record<number, string>;
  lastReadStoryId: number;
  readingStreak: { current: number; best: number; lastDate: string };
  settings: Record<string, any>;
}

let syncStore: Record<string, SyncPayload> = {};

// Load existing sync store if available
try {
  if (fs.existsSync(SYNC_DATA_FILE)) {
    const raw = fs.readFileSync(SYNC_DATA_FILE, "utf-8");
    syncStore = JSON.parse(raw);
  }
} catch (err) {
  console.warn("Could not read sync store file, initializing fresh:", err);
}

function saveSyncStore() {
  try {
    fs.writeFileSync(SYNC_DATA_FILE, JSON.stringify(syncStore, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write sync store to disk:", err);
  }
}

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

// Save or update sync data by sync key
app.post("/api/sync/save", (req, res) => {
  const { syncKey, data } = req.body;
  if (!syncKey || typeof syncKey !== "string" || !data) {
    return res.status(400).json({ error: "Missing syncKey or data" });
  }

  const cleanKey = syncKey.trim().toUpperCase();
  const existing = syncStore[cleanKey];

  const updatedPayload: SyncPayload = {
    syncKey: cleanKey,
    lastUpdated: Date.now(),
    readStoryIds: Array.isArray(data.readStoryIds) ? data.readStoryIds : [],
    favoriteStoryIds: Array.isArray(data.favoriteStoryIds) ? data.favoriteStoryIds : [],
    bookmarks: Array.isArray(data.bookmarks) ? data.bookmarks : [],
    notes: typeof data.notes === "object" && data.notes !== null ? data.notes : {},
    lastReadStoryId: typeof data.lastReadStoryId === "number" ? data.lastReadStoryId : 1,
    readingStreak: data.readingStreak || { current: 1, best: 1, lastDate: new Date().toISOString().split("T")[0] },
    settings: data.settings || {},
  };

  syncStore[cleanKey] = updatedPayload;
  saveSyncStore();

  return res.json({ success: true, syncKey: cleanKey, lastUpdated: updatedPayload.lastUpdated });
});

// Load sync data by sync key
app.get("/api/sync/load/:syncKey", (req, res) => {
  const syncKey = (req.params.syncKey || "").trim().toUpperCase();
  if (!syncKey) {
    return res.status(400).json({ error: "Invalid sync key" });
  }

  const data = syncStore[syncKey];
  if (!data) {
    return res.status(404).json({ error: "No data found for this sync key" });
  }

  return res.json({ success: true, data });
});

// Merge local and remote data
app.post("/api/sync/merge", (req, res) => {
  const { syncKey, localData } = req.body;
  if (!syncKey || !localData) {
    return res.status(400).json({ error: "Missing syncKey or localData" });
  }

  const cleanKey = syncKey.trim().toUpperCase();
  const remote = syncStore[cleanKey];

  if (!remote) {
    // Treat local as master
    const payload: SyncPayload = {
      syncKey: cleanKey,
      lastUpdated: Date.now(),
      readStoryIds: localData.readStoryIds || [],
      favoriteStoryIds: localData.favoriteStoryIds || [],
      bookmarks: localData.bookmarks || [],
      notes: localData.notes || {},
      lastReadStoryId: localData.lastReadStoryId || 1,
      readingStreak: localData.readingStreak || { current: 1, best: 1, lastDate: new Date().toISOString().split("T")[0] },
      settings: localData.settings || {},
    };
    syncStore[cleanKey] = payload;
    saveSyncStore();
    return res.json({ success: true, mergedData: payload, action: "created_remote" });
  }

  // Merge sets
  const readSet = new Set([...(remote.readStoryIds || []), ...(localData.readStoryIds || [])]);
  const favSet = new Set([...(remote.favoriteStoryIds || []), ...(localData.favoriteStoryIds || [])]);
  
  // Merge notes (favoring non-empty)
  const mergedNotes: Record<number, string> = { ...remote.notes, ...localData.notes };

  // Bookmarks merged by storyId
  const bookmarkMap = new Map<number, any>();
  [...(remote.bookmarks || []), ...(localData.bookmarks || [])].forEach((b) => {
    if (!bookmarkMap.has(b.storyId) || (b.createdAt > bookmarkMap.get(b.storyId).createdAt)) {
      bookmarkMap.set(b.storyId, b);
    }
  });

  const mergedPayload: SyncPayload = {
    syncKey: cleanKey,
    lastUpdated: Date.now(),
    readStoryIds: Array.from(readSet),
    favoriteStoryIds: Array.from(favSet),
    bookmarks: Array.from(bookmarkMap.values()),
    notes: mergedNotes,
    lastReadStoryId: localData.lastReadStoryId || remote.lastReadStoryId || 1,
    readingStreak: {
      current: Math.max(localData.readingStreak?.current || 0, remote.readingStreak?.current || 0),
      best: Math.max(localData.readingStreak?.best || 0, remote.readingStreak?.best || 0),
      lastDate: localData.readingStreak?.lastDate || remote.readingStreak?.lastDate || new Date().toISOString().split("T")[0]
    },
    settings: { ...remote.settings, ...localData.settings },
  };

  syncStore[cleanKey] = mergedPayload;
  saveSyncStore();

  return res.json({ success: true, mergedData: mergedPayload, action: "merged" });
});

async function start() {
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Bodhkathao App running on port ${PORT}`);
  });
}

start();
