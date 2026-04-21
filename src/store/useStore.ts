import { create } from 'zustand';
import { ContentItem, AppSettings, Collection, ViewID, ScanProgress, AppTheme } from '../types';
import { nanoid } from 'nanoid';

export type ThemeID = AppTheme;

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppState {
  items: ContentItem[];
  settings: AppSettings;
  collections: Collection[];
  stagedIds: string[];
  isScanning: boolean;
  scanProgress: ScanProgress;
  isLoadingSettings: boolean;
  activeTab: ViewID;
  installedHeuristics: string[];
  globalSearch: string;
  searchHistory: string[];
  theme: ThemeID;
  toasts: Toast[];

  setTheme: (theme: ThemeID) => void;
  setActiveTab: (tab: ViewID) => void;
  setGlobalSearch: (search: string) => void;
  fetchItems: () => Promise<void>;
  fetchSettings: () => Promise<void>;
  fetchCollections: () => Promise<void>;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  triggerScan: (deep?: boolean) => Promise<void>;
  toggleFavorite: (itemId: string) => Promise<void>;
  upsertCollection: (collection: Partial<Collection>) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
  addItemToCollection: (collectionId: string, itemId: string) => Promise<void>;
  addToStaging: (id: string) => void;
  removeFromStaging: (id: string) => void;
  clearStaging: () => void;
  refreshInstalledStatus: (drivePath: string) => Promise<void>;
  updateMetadata: (itemId: string, metadata: any) => Promise<void>;
  bulkUpdateMetadata: (itemIds: string[], metadata: any) => Promise<void>;
  bulkDeleteItems: (itemIds: string[]) => Promise<void>;
  runIntegrityCheck: () => Promise<{ removedCount: number }>;
  previewRename: (itemIds: string[], template: string) => Promise<any[]>;
  applyRename: (operations: any[]) => Promise<void>;
  bulkAutoFixMetadata: (itemIds: string[]) => Promise<void>;
  fetchOnlineMetadata: (itemIds: string[]) => Promise<number>;
  resolveDuplicates: (strategy: 'keep_newest' | 'keep_oldest' | 'keep_shortest_path') => Promise<number>;
  organizeLibrary: (itemIds: string[]) => Promise<void>;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

export const useStore = create<AppState>((set, get) => ({
  items: [],
  settings: { sourceFolders: [], outputFolder: '', theme: 'carbon', scanOnStartup: false, autoRepair: false, customMappings: {}, profileMappings: {} },
  collections: [],
  stagedIds: [],
  isScanning: false,
  scanProgress: { total: 0, current: 0, folder: '', isScanning: false },
  isLoadingSettings: false,
  activeTab: 'dashboard',
  installedHeuristics: [],
  globalSearch: '',
  searchHistory: [],
  theme: 'carbon',
  toasts: [],

  setTheme: (theme) => {
    set((state) => ({
      theme,
      settings: { ...state.settings, theme },
    }));
    void get().updateSettings({ theme });
  },
  setActiveTab: (tab) => set({ activeTab: tab }),
  setGlobalSearch: (search) => {
    set({ globalSearch: search });
    if (search && search.length > 2) {
      set((state) => {
        const history = [search, ...state.searchHistory.filter(h => h !== search)].slice(0, 5);
        return { searchHistory: history };
      });
    }
  },

  addToast: (message, type = 'info') => {
    const id = nanoid();
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    setTimeout(() => get().removeToast(id), 5000);
  },

  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) })),

  fetchItems: async () => {
    try {
      const res = await fetch('/api/library');
      const data = await res.json();
      set({ items: data });
    } catch (err) {
      console.error('Failed to fetch library', err);
    }
  },

  fetchSettings: async () => {
    set({ isLoadingSettings: true });
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      const theme = (data.theme || 'carbon') as ThemeID;
      set({ settings: data, theme, isLoadingSettings: false });
    } catch (err) {
      console.error('Failed to fetch settings', err);
      set({ isLoadingSettings: false });
    }
  },

  fetchCollections: async () => {
    try {
      const res = await fetch('/api/collections');
      const data = await res.json();
      set({ collections: data });
    } catch (err) {
      console.error('Failed to fetch collections', err);
    }
  },

  updateSettings: async (newSettings) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...get().settings, ...newSettings }),
      });
      const data = await res.json();
      set({ settings: data, theme: (data.theme || get().theme) as ThemeID });
    } catch (err) {
      console.error('Failed to update settings', err);
    }
  },

  triggerScan: async (deep = false) => {
    set({ isScanning: true });
    try {
      const res = await fetch('/api/scanner/scan', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deep })
      });
      if (!res.ok) throw new Error('Scan failed');
      
      // Start polling for progress
      const poll = setInterval(async () => {
        const pRes = await fetch('/api/scanner/progress');
        const pData = await pRes.json();
        set({ scanProgress: pData });
        if (!pData.isScanning) {
          clearInterval(poll);
          get().fetchItems();
          set({ isScanning: false });
        }
      }, 500);
    } catch (err) {
      console.error('Scan failed', err);
      set({ isScanning: false });
    }
  },

  toggleFavorite: async (itemId) => {
    const item = get().items.find(i => i.id === itemId);
    const isNowFavorite = !item?.isFavorite;
    set((state) => ({
      items: state.items.map(i => i.id === itemId ? { ...i, isFavorite: isNowFavorite } : i)
    }));
    get().addToast(isNowFavorite ? 'Added to favorites' : 'Removed from favorites', 'success');
    try {
      await fetch('/api/library/favorite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId })
      });
    } catch (err) {
      console.error('Failed to toggle favorite', err);
    }
  },

  upsertCollection: async (collection) => {
    try {
      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(collection)
      });
      const data = await res.json();
      set({ collections: data });
      get().addToast(`Collection ${collection.id ? 'updated' : 'created'}`, 'success');
    } catch (err) {
      console.error('Failed to upsert collection', err);
      get().addToast('Failed to save collection', 'error');
    }
  },

  deleteCollection: async (id) => {
    try {
      const res = await fetch('/api/collections/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      set({ collections: data });
      get().addToast('Collection deleted', 'success');
    } catch (err) {
      console.error('Failed to delete collection', err);
      get().addToast('Failed to delete collection', 'error');
    }
  },

  addItemToCollection: async (collectionId, itemId) => {
    const state = get();
    const collection = state.collections.find(c => c.id === collectionId);
    if (!collection) return;
    
    if (collection.itemIds.includes(itemId)) {
      get().addToast('Item already in collection', 'info');
      return;
    }

    const updatedItemIds = [...collection.itemIds, itemId];
    await state.upsertCollection({ ...collection, itemIds: updatedItemIds });
    get().addToast(`Added to ${collection.name}`, 'success');
  },

  addToStaging: (id) => {
    const alreadyStaged = get().stagedIds.includes(id);
    if (alreadyStaged) {
      get().addToast('Item already in staging', 'info');
      return;
    }
    set((state) => ({ 
      stagedIds: [...state.stagedIds, id] 
    }));
    get().addToast('Added to staging queue', 'success');
  },

  removeFromStaging: (id) => set((state) => ({ 
    stagedIds: state.stagedIds.filter(i => i !== id) 
  })),

  clearStaging: () => set({ stagedIds: [] }),

  refreshInstalledStatus: async (drivePath) => {
    try {
      const res = await fetch('/api/library/check-installed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drivePath })
      });
      const data = await res.json();
      set({ installedHeuristics: data });
    } catch (err) {
      console.error('Failed to refresh installed status', err);
    }
  },

  updateMetadata: async (itemId, metadata) => {
    set((state) => ({
      items: state.items.map(i => i.id === itemId ? { ...i, metadata: { ...i.metadata, ...metadata } } : i)
    }));
    try {
      await fetch('/api/library/update-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, metadata })
      });
    } catch (err) {
      console.error('Failed to update metadata', err);
    }
  },

  bulkUpdateMetadata: async (itemIds, metadata) => {
    set((state) => ({
      items: state.items.map(i => itemIds.includes(i.id) ? { ...i, metadata: { ...i.metadata, ...metadata } } : i)
    }));
    try {
      await fetch('/api/library/bulk-update-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIds, metadata })
      });
      get().addToast(`Updated ${itemIds.length} items`, 'success');
    } catch (err) {
      console.error('Failed to bulk update metadata', err);
      get().addToast('Failed to update items', 'error');
    }
  },

  bulkAutoFixMetadata: async (itemIds) => {
    try {
      const res = await fetch('/api/library/bulk-autofix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIds })
      });
      const data = await res.json();
      set((state) => ({
        items: state.items.map(i => {
          const fixed = data.find((f: any) => f.id === i.id);
          return fixed ? { ...i, metadata: fixed.metadata } : i;
        })
      }));
      get().addToast(`Auto-fixed ${data.length} items`, 'success');
    } catch (err) {
      console.error('Failed to auto-fix metadata', err);
      get().addToast('Auto-fix failed', 'error');
    }
  },

  bulkDeleteItems: async (itemIds) => {
    set((state) => ({
      items: state.items.filter(i => !itemIds.includes(i.id)),
      stagedIds: state.stagedIds.filter(id => !itemIds.includes(id))
    }));
    try {
      await fetch('/api/library/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIds })
      });
    } catch (err) {
      console.error('Failed to bulk delete items', err);
    }
  },

  runIntegrityCheck: async () => {
    try {
      const res = await fetch('/api/library/integrity-check', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.removedCount > 0) {
        await get().fetchItems();
      }
      return { removedCount: data.removedCount };
    } catch (err) {
      console.error('Integrity check failed', err);
      return { removedCount: 0 };
    }
  },

  previewRename: async (itemIds, template) => {
    const res = await fetch('/api/library/rename/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemIds, template })
    });
    return await res.json();
  },

  applyRename: async (operations) => {
    const res = await fetch('/api/library/rename/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operations })
    });
    if (res.ok) {
      await get().fetchItems();
    }
  },

  fetchOnlineMetadata: async (itemIds) => {
    try {
      const res = await fetch('/api/library/fetch-online', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIds })
      });
      const data = await res.json();
      if (data.success && data.updatedCount > 0) {
        await get().fetchItems();
      }
      return data.updatedCount;
    } catch (err) {
      console.error('Failed to fetch online metadata', err);
      return 0;
    }
  },

  resolveDuplicates: async (strategy) => {
    try {
      const res = await fetch('/api/library/duplicates/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategy })
      });
      const data = await res.json();
      if (data.success) {
        await get().fetchItems();
        get().addToast(`Resolved ${data.removedCount} duplicates`, 'success');
        return data.removedCount;
      }
      return 0;
    } catch (err) {
      console.error('Failed to resolve duplicates', err);
      return 0;
    }
  },

  organizeLibrary: async (itemIds) => {
    try {
      const res = await fetch('/api/library/organize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIds })
      });
      const data = await res.json();
      if (data.success) {
        await get().fetchItems();
        get().addToast('Library organized successfully', 'success');
      }
    } catch (err) {
      console.error('Failed to organize library', err);
      get().addToast('Organization failed', 'error');
    }
  }
}));
