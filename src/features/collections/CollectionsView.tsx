import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { FolderHeart, Plus, MoreVertical, Hash, Trash2, Edit2, Download, X, Sparkles, Clock, HardDrive, AlertCircle, Star, Package, LayoutGrid } from 'lucide-react';
import { LibraryCard } from '../library/LibraryCard';
import { Modal } from '../../components/ui/Modal';
import { GameHub } from '../library/GameHub';

export const CollectionsView = () => {
  const { collections, items, upsertCollection, deleteCollection, addToast } = useStore();
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState<string | null>(null);
  const [activeSmartType, setActiveSmartType] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [selectedTitleId, setSelectedTitleId] = useState<string | null>(null);
  const [confirmClearId, setConfirmClearId] = useState<string | null>(null);
  const [renameCollectionId, setRenameCollectionId] = useState<string | null>(null);
  const [renameCollectionName, setRenameCollectionName] = useState('');
  const [deleteCollectionId, setDeleteCollectionId] = useState<string | null>(null);

  const smartCollections = useMemo(() => [
    { id: 'recent', name: 'Recently Added', icon: Clock, color: 'text-blue-400', filter: (i: any) => {
      const dayAgo = new Date();
      dayAgo.setDate(dayAgo.getDate() - 1);
      return new Date(i.dateModified) > dayAgo;
    }},
    { id: 'large', name: 'Large Files (>1GB)', icon: HardDrive, color: 'text-purple-400', filter: (i: any) => i.size > 1024 * 1024 * 1024 },
    { id: 'missing', name: 'Missing Metadata', icon: AlertCircle, color: 'text-yellow-500', filter: (i: any) => i.metadata.gameName === 'Unknown Game' },
    { id: 'repair', name: 'Repair Needed', icon: AlertCircle, color: 'text-red-500', filter: (i: any) => i.isExtensionless },
    { id: 'favorites', name: 'Favorites', icon: Star, color: 'text-xbox-green', filter: (i: any) => i.isFavorite },
    { id: 'xbla', name: 'XBLA Games', icon: Package, color: 'text-orange-400', filter: (i: any) => i.type === 'xbla' },
    { id: 'god', name: 'GOD Games', icon: HardDrive, color: 'text-green-400', filter: (i: any) => i.type === 'god' },
    { id: 'dlc', name: 'DLC & Content', icon: Download, color: 'text-cyan-400', filter: (i: any) => ['dlc', 'title_update', 'demo'].includes(i.type) }
  ], []);

  const activeCollection = collections.find(c => c.id === activeCollectionId);
  
  const displayItems = useMemo(() => {
    if (activeSmartType) {
      const smart = smartCollections.find(s => s.id === activeSmartType);
      return smart ? items.filter(smart.filter) : [];
    }
    return items.filter(i => activeCollection?.itemIds.includes(i.id));
  }, [activeCollection, activeSmartType, items, smartCollections]);

  useEffect(() => {
    if (!activeCollectionId && !activeSmartType && collections.length > 0) {
      setActiveCollectionId(collections[0].id);
    }
  }, [collections, activeCollectionId, activeSmartType]);

  const handleExportCollection = (collection: any) => {
    const collectionData = {
      ...collection,
      items: items.filter(i => collection.itemIds.includes(i.id))
    };
    const data = JSON.stringify(collectionData, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `friied360_collection_${collection.name.toLowerCase().replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast(`Exported "${collection.name}" collection pack`, 'success');
  };

  const handleCreateCollection = async () => {
    const trimmedName = newCollectionName.trim();
    if (!trimmedName) {
      addToast('Enter a collection name first', 'error');
      return;
    }

    const created = await upsertCollection(
      { name: trimmedName, itemIds: [], description: '' },
      { successMessage: `Created "${trimmedName}"` },
    );
    if (!created) return;

    setNewCollectionName('');
    setIsCreateModalOpen(false);
  };

  const handleRenameCollection = async () => {
    const collection = collections.find(c => c.id === renameCollectionId);
    const trimmedName = renameCollectionName.trim();

    if (!collection) return;
    if (!trimmedName) {
      addToast('Collection name cannot be empty', 'error');
      return;
    }

    const renamed = await upsertCollection(
      { ...collection, name: trimmedName },
      {
        successMessage: `Renamed collection to "${trimmedName}"`,
        errorMessage: `Failed to rename "${collection.name}"`,
      },
    );
    if (!renamed) return;

    setRenameCollectionId(null);
    setRenameCollectionName('');
  };

  const handleDeleteCollection = async () => {
    if (!deleteCollectionId) return;
    const collection = collections.find((entry) => entry.id === deleteCollectionId);
    const deleted = await deleteCollection(deleteCollectionId, {
      successMessage: collection ? `Deleted "${collection.name}"` : 'Collection deleted',
      errorMessage: collection ? `Failed to delete "${collection.name}"` : 'Failed to delete collection',
    });
    if (!deleted) return;

    if (activeCollectionId === deleteCollectionId) setActiveCollectionId(null);
    setDeleteCollectionId(null);
  };

  return (
    <div className="p-8 h-full flex flex-col space-y-6" onClick={() => setShowOptions(null)}>
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <FolderHeart className="text-xbox-green" /> Custom Collections
          </h2>
          <p className="text-gray-500">Organize your items into curated sets.</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-surface-card border border-surface-border px-4 py-2 rounded-lg hover:border-xbox-green transition-all flex items-center gap-2 font-bold text-sm"
        >
          <Plus size={18} /> New Collection
        </button>
      </header>

      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-500 mb-2">
          <Sparkles size={14} /> Smart Collections
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
          {smartCollections.map(s => (
            <button
              key={s.id}
              onClick={() => { setActiveSmartType(s.id); setActiveCollectionId(null); }}
              className={`flex-shrink-0 w-40 p-4 rounded-2xl border transition-all text-left group ${
                activeSmartType === s.id 
                ? 'bg-xbox-green/10 border-xbox-green shadow-lg shadow-xbox-green/10' 
                : 'bg-surface-card border-surface-border hover:border-gray-600'
              }`}
            >
              <div className={`p-2 rounded-lg w-fit mb-4 ${activeSmartType === s.id ? 'bg-xbox-green text-white' : 'bg-surface-panel ' + s.color}`}>
                <s.icon size={20} />
              </div>
              <h4 className="font-bold text-sm truncate">{s.name}</h4>
              <p className="text-[10px] text-gray-500 uppercase font-black mt-1">
                {items.filter(s.filter).length} Items
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-500 mb-2">
          <FolderHeart size={14} /> Custom Collections
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
          {collections.map(c => (
            <div key={c.id} className="relative flex-shrink-0">
              <button
                onClick={() => { setActiveCollectionId(c.id); setActiveSmartType(null); }}
                className={`w-48 p-4 rounded-2xl border transition-all text-left group h-full ${
                    activeCollectionId === c.id 
                    ? 'bg-xbox-green/10 border-xbox-green shadow-lg shadow-xbox-green/10' 
                    : 'bg-surface-card border-surface-border hover:border-gray-600'
                }`}
              >
              <div className="flex justify-between items-start mb-8">
                  <div className={`p-2 rounded-lg ${activeCollectionId === c.id ? 'bg-xbox-green text-white' : 'bg-surface-panel text-gray-500'}`}>
                      <Hash size={20} />
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowOptions(showOptions === c.id ? null : c.id);
                    }}
                    className="p-1 hover:bg-white/10 rounded-md transition-colors"
                  >
                    <MoreVertical size={16} className="text-gray-600 group-hover:text-gray-400" />
                  </button>
              </div>
              <h4 className="font-bold truncate">{c.name}</h4>
              <p className="text-xs text-gray-500">{c.itemIds.length} Items</p>
            </button>

            {showOptions === c.id && (
              <div className="absolute top-12 right-0 w-40 bg-surface-card border border-surface-border rounded-xl shadow-2xl z-50 p-2 animate-in zoom-in-95 duration-100">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setRenameCollectionId(c.id);
                    setRenameCollectionName(c.name);
                    setShowOptions(null);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                >
                  <Edit2 size={14} /> Rename
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExportCollection(c);
                    setShowOptions(null);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                >
                  <Download size={14} /> Export Pack
                </button>
                <div className="h-px bg-surface-border my-1" />
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteCollectionId(c.id);
                    setShowOptions(null);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            )}
          </div>
        ))}
        {collections.length === 0 && (
          <div className="flex-shrink-0 w-48 p-4 rounded-2xl border border-dashed border-surface-border flex flex-col items-center justify-center text-gray-600 text-center">
            <p className="text-xs">No collections yet.</p>
          </div>
        )}
      </div>
    </div>

    {(activeCollection || activeSmartType) ? (
          <div className="flex-1 min-h-0 pt-6 border-t border-surface-border animate-in slide-in-from-bottom-4 flex flex-col">
              <div className="mb-6 flex justify-between items-center">
                  <h3 className="text-xl font-bold">
                    {activeSmartType ? smartCollections.find(s => s.id === activeSmartType)?.name : activeCollection?.name} Content
                  </h3>
                  <div className="flex items-center gap-4">
                    {activeCollection && (
                      <>
                        <span className="text-xs text-gray-500 uppercase tracking-widest font-black">Collection ID: {activeCollection.id}</span>
                        <button 
                          onClick={() => setConfirmClearId(activeCollection.id)}
                          className="text-[10px] font-black uppercase text-red-400 hover:text-red-300 transition-colors"
                        >
                          Clear Items
                        </button>
                      </>
                    )}
                  </div>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {displayItems.map(item => (
                        <div key={item.id} className="relative group">
                          <LibraryCard 
                            item={item} 
                            onOpenHub={setSelectedTitleId}
                          />
                          {activeCollection && (
                            <button 
                              onClick={async () => {
                                const updatedIds = activeCollection.itemIds.filter(id => id !== item.id);
                                await upsertCollection(
                                  { ...activeCollection, itemIds: updatedIds },
                                  {
                                    successMessage: `Removed "${item.name}" from ${activeCollection.name}`,
                                    errorMessage: `Failed to update ${activeCollection.name}`,
                                  },
                                );
                              }}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
                              title="Remove from collection"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                    ))}
                </div>
                {displayItems.length === 0 && (
                  <div className="py-20 text-center text-gray-500 italic">This collection is empty.</div>
                )}
              </div>
          </div>
      ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-600">
              <FolderHeart size={48} className="opacity-10 mb-2" />
              <p>Select a collection to view its items.</p>
          </div>
      )}

      {/* Modals */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Collection"
        footer={
          <div className="flex justify-end gap-3">
            <button 
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-white"
            >
              Cancel
            </button>
            <button 
              onClick={handleCreateCollection}
              className="px-6 py-2 bg-xbox-green hover:bg-xbox-hover text-white rounded-lg text-sm font-bold transition-all"
            >
              Create Collection
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-400">Enter a name for your new curated collection.</p>
          <input 
            type="text"
            value={newCollectionName}
            onChange={(e) => setNewCollectionName(e.target.value)}
            placeholder="e.g. My Favorite RPGs"
            className="w-full bg-surface-panel border border-surface-border rounded-xl px-4 py-3 text-white focus:border-xbox-green outline-none transition-all"
            autoFocus
          />
        </div>
      </Modal>

      <Modal
        isOpen={!!confirmClearId}
        onClose={() => setConfirmClearId(null)}
        title="Clear Collection Items"
        footer={
          <div className="flex justify-end gap-3">
            <button 
              onClick={() => setConfirmClearId(null)}
              className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-white"
            >
              Cancel
            </button>
            <button 
              onClick={async () => {
                const collection = collections.find(c => c.id === confirmClearId);
                if (collection) {
                  const cleared = await upsertCollection(
                    { ...collection, itemIds: [] },
                    {
                      successMessage: `Cleared "${collection.name}"`,
                      errorMessage: `Failed to clear "${collection.name}"`,
                    },
                  );
                  if (!cleared) return;
                }
                setConfirmClearId(null);
              }}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold transition-all"
            >
              Clear All Items
            </button>
          </div>
        }
      >
        <p className="text-sm text-gray-400">
          Are you sure you want to remove all items from this collection? This action cannot be undone.
        </p>
      </Modal>

      <Modal
        isOpen={!!renameCollectionId}
        onClose={() => {
          setRenameCollectionId(null);
          setRenameCollectionName('');
        }}
        title="Rename Collection"
        footer={
          <>
            <button
              onClick={() => {
                setRenameCollectionId(null);
                setRenameCollectionName('');
              }}
              className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleRenameCollection}
              className="px-6 py-2 bg-xbox-green hover:bg-xbox-hover text-white rounded-lg text-sm font-bold transition-all"
            >
              Save Name
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-400">Give this collection a clearer display name.</p>
          <input
            type="text"
            value={renameCollectionName}
            onChange={(e) => setRenameCollectionName(e.target.value)}
            placeholder="Collection name"
            className="w-full bg-surface-panel border border-surface-border rounded-xl px-4 py-3 text-white focus:border-xbox-green outline-none transition-all"
            autoFocus
          />
        </div>
      </Modal>

      <Modal
        isOpen={!!deleteCollectionId}
        onClose={() => setDeleteCollectionId(null)}
        title="Delete Collection"
        type="warning"
        footer={
          <>
            <button onClick={() => setDeleteCollectionId(null)} className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-white">
              Cancel
            </button>
            <button
              onClick={handleDeleteCollection}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold transition-all"
            >
              Delete Collection
            </button>
          </>
        }
      >
        <p className="text-sm text-gray-400">
          This will remove the collection container, but the Xbox content inside it will stay in your library.
        </p>
      </Modal>

      {selectedTitleId && (
        <GameHub 
          titleId={selectedTitleId} 
          onClose={() => setSelectedTitleId(null)} 
        />
      )}
    </div>
  );
};
