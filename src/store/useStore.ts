import { create } from 'zustand';
import { ContentItem, AppSettings, Collection, ViewID, ScanProgress, AppTheme } from '../types';
import { nanoid } from 'nanoid';
import { getErrorMessage, readJsonOrThrow } from '../utils/api';
import type { RenameOperation } from '../services/RenameService';

export type ThemeID = AppTheme;

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface CollectionMutationOptions {
  successMessage?: string;
  errorMessage?: string;
  skipSuccessToast?: boolean;
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
  upsertCollection: (collection: Partial<Collection>, options?: CollectionMutationOptions) => Promise<boolean>;
  deleteCollection: (id: string, options?: CollectionMutationOptions) => Promise<boolean>;
  addItemToCollection: (collectionId: string, itemId: string) => Promise<void>;
  addToStaging: (id: string) => void;
  removeFromStaging: (id: string) => void;
  clearStaging: () => void;
  refreshInstalledStatus: (drivePath: string) => Promise<number>;
  updateMetadata: (itemId: string, metadata: any) => Promise<void>;
  bulkUpdateMetadata: (itemIds: string[], metadata: any) => Promise<void>;
  bulkDeleteItems: (itemIds: string[]) => Promise<void>;
  clearLibrary: () => Promise<void>;
  runIntegrityCheck: () => Promise<{ removedCount: number }>;
  previewRename: (itemIds: string[], template: string) => Promise<RenameOperation[]>;
  applyRename: (operations: RenameOperation[]) => Promise<boolean>;
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
      const data = await readJsonOrThrow<ContentItem[]>(res, 'Failed to fetch library');
      set({ items: data });
    } catch (err) {
      console.error('Failed to fetch library', err);
    }
  },

  fetchSettings: async () => {
    set({ isLoadingSettings: true });
    try {
      const res = await fetch('/api/settings');
      const data = await readJsonOrThrow<AppSettings>(res, 'Failed to fetch settings');
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
      const data = await readJsonOrThrow<Collection[]>(res, 'Failed to fetch collections');
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
      const data = await readJsonOrThrow<AppSettings>(res, 'Failed to update settings');
      set({ settings: data, theme: (data.theme || get().theme) as ThemeID });
    } catch (err) {
      console.error('Failed to update settings', err);
      get().addToast(getErrorMessage(err, 'Failed to update settings'), 'error');
    }
  },

  triggerScan: async (deep = false) => {
    set({ isScanning: true });
    let poll: ReturnType<typeof setInterval> | null = null;

    try {
      const res = await fetch('/api/scanner/scan', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deep })
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || 'Scan failed');
      }
      
      // Start polling for progress
      poll = setInterval(async () => {
        try {
          const pRes = await fetch('/api/scanner/progress');
          if (!pRes.ok) {
            throw new Error('Unable to read scan progress');
          }

          const pData = await pRes.json();
          set({ scanProgress: pData });
          if (!pData.isScanning) {
            if (poll) clearInterval(poll);
            await get().fetchItems();
            set({ isScanning: false });
          }
        } catch (progressError) {
          if (poll) clearInterval(poll);
          console.error('Failed to poll scan progress', progressError);
          set({ isScanning: false });
          get().addToast('Scan progress monitoring failed. Refreshing library state.', 'error');
          void get().fetchItems();
        }
      }, 500);
    } catch (err) {
      if (poll) clearInterval(poll);
      console.error('Scan failed', err);
      set({ isScanning: false });
      get().addToast(err instanceof Error ? err.message : 'Scan failed', 'error');
    }
  },

  toggleFavorite: async (itemId) => {
    const item = get().items.find(i => i.id === itemId);
    if (!item) return;

    const previousFavorite = item.isFavorite;
    const isNowFavorite = !previousFavorite;

    set((state) => ({
      items: state.items.map(i => i.id === itemId ? { ...i, isFavorite: isNowFavorite } : i)
    }));

    try {
      const res = await fetch('/api/library/favorite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId })
      });
      const data = await readJsonOrThrow<{ success: boolean; isFavorite: boolean }>(res, 'Failed to update favorites');
      if (!data.success) {
        throw new Error('Failed to update favorites');
      }

      get().addToast(isNowFavorite ? 'Added to favorites' : 'Removed from favorites', 'success');
    } catch (err) {
      set((state) => ({
        items: state.items.map(i => i.id === itemId ? { ...i, isFavorite: previousFavorite } : i)
      }));
      console.error('Failed to toggle favorite', err);
      get().addToast(getErrorMessage(err, 'Failed to update favorites'), 'error');
    }
  },

  upsertCollection: async (collection, options = {}) => {
    try {
      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(collection)
      });
      const data = await readJsonOrThrow<Collection[]>(res, 'Failed to save collection');
      set({ collections: data });
      if (!options.skipSuccessToast) {
        get().addToast(options.successMessage || `Collection ${collection.id ? 'updated' : 'created'}`, 'success');
      }
      return true;
    } catch (err) {
      console.error('Failed to upsert collection', err);
      get().addToast(options.errorMessage || getErrorMessage(err, 'Failed to save collection'), 'error');
      return false;
    }
  },

  deleteCollection: async (id, options = {}) => {
    try {
      const res = await fetch('/api/collections/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await readJsonOrThrow<Collection[]>(res, 'Failed to delete collection');
      set({ collections: data });
      if (!options.skipSuccessToast) {
        get().addToast(options.successMessage || 'Collection deleted', 'success');
      }
      return true;
    } catch (err) {
      console.error('Failed to delete collection', err);
      get().addToast(options.errorMessage || getErrorMessage(err, 'Failed to delete collection'), 'error');
      return false;
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
    const saved = await state.upsertCollection(
      { ...collection, itemIds: updatedItemIds },
      {
        skipSuccessToast: true,
        errorMessage: `Failed to add item to ${collection.name}`,
      },
    );

    if (saved) {
      get().addToast(`Added to ${collection.name}`, 'success');
    }
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
      const data = await readJsonOrThrow<string[]>(res, 'Failed to scan installed content');
      set({ installedHeuristics: data });
      return Array.isArray(data) ? data.length : 0;
    } catch (err) {
      console.error('Failed to refresh installed status', err);
      get().addToast(getErrorMessage(err, 'Failed to scan installed content'), 'error');
      return 0;
    }
  },

  updateMetadata: async (itemId, metadata) => {
    const previousMetadata = get().items.find(i => i.id === itemId)?.metadata;
    if (!previousMetadata) return;

    set((state) => ({
      items: state.items.map(i => i.id === itemId ? { ...i, metadata: { ...i.metadata, ...metadata } } : i)
    }));
    try {
      const res = await fetch('/api/library/update-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, metadata })
      });
      await readJsonOrThrow<{ success: boolean }>(res, 'Failed to update metadata');
    } catch (err) {
      set((state) => ({
        items: state.items.map(i => i.id === itemId ? { ...i, metadata: previousMetadata } : i)
      }));
      console.error('Failed to update metadata', err);
      get().addToast(getErrorMessage(err, 'Failed to update metadata'), 'error');
    }
  },

  bulkUpdateMetadata: async (itemIds, metadata) => {
    const previousMetadata = new Map(
      get().items
        .filter((item) => itemIds.includes(item.id))
        .map((item) => [item.id, item.metadata]),
    );

    set((state) => ({
      items: state.items.map(i => itemIds.includes(i.id) ? { ...i, metadata: { ...i.metadata, ...metadata } } : i)
    }));
    try {
      const res = await fetch('/api/library/bulk-update-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIds, metadata })
      });
      await readJsonOrThrow<{ success: boolean; count: number }>(res, 'Failed to update items');
      get().addToast(`Updated ${itemIds.length} items`, 'success');
    } catch (err) {
      set((state) => ({
        items: state.items.map((item) => {
          const snapshot = previousMetadata.get(item.id);
          return snapshot ? { ...item, metadata: snapshot } : item;
        })
      }));
      console.error('Failed to bulk update metadata', err);
      get().addToast(getErrorMessage(err, 'Failed to update items'), 'error');
    }
  },

  bulkAutoFixMetadata: async (itemIds) => {
    try {
      const res = await fetch('/api/library/bulk-autofix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIds })
      });
      const data = await readJsonOrThrow<ContentItem[]>(res, 'Auto-fix failed');
      set((state) => ({
        items: state.items.map(i => {
          const fixed = data.find((f: any) => f.id === i.id);
          return fixed ? { ...i, metadata: fixed.metadata } : i;
        })
      }));
      get().addToast(`Auto-fixed ${data.length} items`, 'success');
    } catch (err) {
      console.error('Failed to auto-fix metadata', err);
      get().addToast(getErrorMessage(err, 'Auto-fix failed'), 'error');
    }
  },

  bulkDeleteItems: async (itemIds) => {
    const previousItems = get().items;
    const previousStagedIds = get().stagedIds;

    set((state) => ({
      items: state.items.filter(i => !itemIds.includes(i.id)),
      stagedIds: state.stagedIds.filter(id => !itemIds.includes(id))
    }));
    try {
      const res = await fetch('/api/library/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIds })
      });
      await readJsonOrThrow<{ success: boolean; count: number }>(res, 'Failed to remove selected items');
      get().addToast(`Removed ${itemIds.length} ${itemIds.length === 1 ? 'item' : 'items'} from library`, 'success');
    } catch (err) {
      set({ items: previousItems, stagedIds: previousStagedIds });
      console.error('Failed to bulk delete items', err);
      get().addToast(getErrorMessage(err, 'Failed to remove selected items'), 'error');
    }
  },

  clearLibrary: async () => {
    try {
      const res = await fetch('/api/library/clear', { method: 'POST' });
      await readJsonOrThrow<{ success: boolean }>(res, 'Failed to clear library');
      set({ items: [], stagedIds: [], installedHeuristics: [] });
      await get().fetchCollections();
      get().addToast('Library database cleared', 'success');
    } catch (err) {
      console.error('Failed to clear library', err);
      get().addToast(getErrorMessage(err, 'Failed to clear library database'), 'error');
    }
  },

  runIntegrityCheck: async () => {
    try {
      const res = await fetch('/api/library/integrity-check', { method: 'POST' });
      const data = await readJsonOrThrow<{ success: boolean; removedCount: number }>(res, 'Integrity check failed');
      if (data.success && data.removedCount > 0) {
        await get().fetchItems();
      }
      return { removedCount: data.removedCount };
    } catch (err) {
      console.error('Integrity check failed', err);
      get().addToast(getErrorMessage(err, 'Integrity check failed'), 'error');
      return { removedCount: 0 };
    }
  },

  previewRename: async (itemIds, template) => {
    const res = await fetch('/api/library/rename/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemIds, template })
    });
    return readJsonOrThrow<RenameOperation[]>(res, 'Failed to preview rename');
  },

  applyRename: async (operations) => {
    try {
      const res = await fetch('/api/library/rename/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operations })
      });
      await readJsonOrThrow<RenameOperation[]>(res, 'Failed to rename files');
      await get().fetchItems();
      return true;
    } catch (err) {
      console.error('Failed to apply rename operations', err);
      get().addToast(getErrorMessage(err, 'Failed to rename files'), 'error');
      return false;
    }
  },

  fetchOnlineMetadata: async (itemIds) => {
    try {
      const res = await fetch('/api/library/fetch-online', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIds })
      });
      const data = await readJsonOrThrow<{ success: boolean; updatedCount: number }>(res, 'Failed to refresh title metadata');
      if (data.success && data.updatedCount > 0) {
        await get().fetchItems();
      }
      return data.updatedCount;
    } catch (err) {
      console.error('Failed to refresh title metadata', err);
      get().addToast(getErrorMessage(err, 'Failed to refresh title metadata'), 'error');
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
      const data = await readJsonOrThrow<{ success: boolean; removedCount: number }>(res, 'Failed to resolve duplicates');
      if (data.success) {
        await get().fetchItems();
        get().addToast(`Resolved ${data.removedCount} duplicates`, 'success');
        return data.removedCount;
      }
      return 0;
    } catch (err) {
      console.error('Failed to resolve duplicates', err);
      get().addToast(getErrorMessage(err, 'Failed to resolve duplicates'), 'error');
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
      const data = await readJsonOrThrow<{ success: boolean }>(res, 'Organization failed');
      if (data.success) {
        await get().fetchItems();
        get().addToast('Library organized successfully', 'success');
      }
    } catch (err) {
      console.error('Failed to organize library', err);
      get().addToast(getErrorMessage(err, 'Organization failed'), 'error');
    }
  }
}));
