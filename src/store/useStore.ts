import { create } from 'zustand';
import { ContentItem, AppSettings, Collection, ViewID, ScanProgress } from '../types';

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

  setActiveTab: (tab: ViewID) => void;
  fetchItems: () => Promise<void>;
  fetchSettings: () => Promise<void>;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  triggerScan: () => Promise<void>;
  toggleFavorite: (itemId: string) => Promise<void>;
  upsertCollection: (collection: Partial<Collection>) => Promise<void>;
  addItemToCollection: (collectionId: string, itemId: string) => Promise<void>;
  addToStaging: (id: string) => void;
  removeFromStaging: (id: string) => void;
  clearStaging: () => void;
  refreshInstalledStatus: (drivePath: string) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  items: [],
  settings: { sourceFolders: [], outputFolder: '', theme: 'dark', scanOnStartup: false },
  collections: [],
  stagedIds: [],
  isScanning: false,
  scanProgress: { total: 0, current: 0, folder: '', isScanning: false },
  isLoadingSettings: false,
  activeTab: 'dashboard',
  installedHeuristics: [],

  setActiveTab: (tab) => set({ activeTab: tab }),

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
      set({ settings: data, isLoadingSettings: false });
    } catch (err) {
      console.error('Failed to fetch settings', err);
      set({ isLoadingSettings: false });
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
      set({ settings: data });
    } catch (err) {
      console.error('Failed to update settings', err);
    }
  },

  triggerScan: async () => {
    set({ isScanning: true });
    try {
      const res = await fetch('/api/scanner/scan', { method: 'POST' });
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
    set((state) => ({
      items: state.items.map(i => i.id === itemId ? { ...i, isFavorite: !i.isFavorite } : i)
    }));
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
    } catch (err) {
      console.error('Failed to upsert collection', err);
    }
  },

  addItemToCollection: async (collectionId, itemId) => {
    const state = get();
    const collection = state.collections.find(c => c.id === collectionId);
    if (!collection || collection.itemIds.includes(itemId)) return;

    const updatedItemIds = [...collection.itemIds, itemId];
    await state.upsertCollection({ ...collection, itemIds: updatedItemIds });
  },

  addToStaging: (id) => set((state) => ({ 
    stagedIds: state.stagedIds.includes(id) ? state.stagedIds : [...state.stagedIds, id] 
  })),

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
  }
}));
