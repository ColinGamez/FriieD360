import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { FolderHeart, Plus, MoreVertical, Hash } from 'lucide-react';
import { LibraryCard } from '../library/LibraryCard';

export const CollectionsView = () => {
  const { collections, items, upsertCollection } = useStore();
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);

  const activeCollection = collections.find(c => c.id === activeCollectionId);
  const collectionItems = items.filter(i => activeCollection?.itemIds.includes(i.id));

  useEffect(() => {
    if (collections.length > 0 && !activeCollectionId) {
      setActiveCollectionId(collections[0].id);
    }
  }, [collections]);

  return (
    <div className="p-8 h-full flex flex-col space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <FolderHeart className="text-xbox-green" /> Custom Collections
          </h2>
          <p className="text-gray-500">Organize your items into curated sets.</p>
        </div>
        <button 
          onClick={() => {
              const name = prompt("Collection Name?");
              if (name) upsertCollection({ name, itemIds: [], description: '' });
          }}
          className="bg-surface-card border border-surface-border px-4 py-2 rounded-lg hover:border-xbox-green transition-all flex items-center gap-2"
        >
          <Plus size={18} /> New Collection
        </button>
      </header>

      <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
        {collections.map(c => (
          <button
            key={c.id}
            onClick={() => setActiveCollectionId(c.id)}
            className={`flex-shrink-0 w-48 p-4 rounded-2xl border transition-all text-left group ${
                activeCollectionId === c.id 
                ? 'bg-xbox-green/10 border-xbox-green shadow-lg shadow-xbox-green/10' 
                : 'bg-surface-card border-surface-border hover:border-gray-600'
            }`}
          >
            <div className="flex justify-between items-start mb-8">
                <div className={`p-2 rounded-lg ${activeCollectionId === c.id ? 'bg-xbox-green text-white' : 'bg-surface-panel text-gray-500'}`}>
                    <Hash size={20} />
                </div>
                <MoreVertical size={16} className="text-gray-600 opacity-0 group-hover:opacity-100" />
            </div>
            <h4 className="font-bold truncate">{c.name}</h4>
            <p className="text-xs text-gray-500">{c.itemIds.length} Items</p>
          </button>
        ))}
        {collections.length === 0 && (
          <div className="flex-shrink-0 w-48 p-4 rounded-2xl border border-dashed border-surface-border flex flex-col items-center justify-center text-gray-600 text-center">
            <p className="text-xs">No collections yet.</p>
          </div>
        )}
      </div>

      {activeCollection ? (
          <div className="flex-1 min-h-0 pt-6 border-t border-surface-border animate-in slide-in-from-bottom-4 flex flex-col">
              <div className="mb-6 flex justify-between items-center">
                  <h3 className="text-xl font-bold">{activeCollection.name} Content</h3>
                  <span className="text-xs text-gray-500 uppercase tracking-widest font-black">Collection ID: {activeCollection.id}</span>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {collectionItems.map(item => (
                        <div key={item.id}>
                          <LibraryCard item={item} />
                        </div>
                    ))}
                </div>
                {collectionItems.length === 0 && (
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
    </div>
  );
};
