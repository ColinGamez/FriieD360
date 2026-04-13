import React, { useState } from 'react';
import { Package, Star, FolderPlus, Plus, Heart } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { ContentItem } from '../../types';

interface LibraryCardProps {
  item: ContentItem;
}

export const LibraryCard = ({ item }: LibraryCardProps) => {
  const { collections, addItemToCollection, toggleFavorite, addToStaging, stagedIds, installedHeuristics } = useStore();
  const [showMenu, setShowMenu] = useState(false);

  const isStaged = stagedIds.includes(item.id);
  const heuristic = `${item.fileName}_${item.size}`;
  const isInstalled = installedHeuristics.includes(heuristic);

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl h-full overflow-hidden flex flex-col group hover:border-xbox-green/50 transition-all relative">
      <div className="aspect-video bg-surface-panel relative flex items-center justify-center">
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1 z-10">
            <span className="bg-black/60 backdrop-blur-md text-[9px] font-black px-1.5 py-0.5 rounded text-gray-300 uppercase">
                {item.format}
            </span>
            {item.metadata.tags.map((tag: string) => (
                <span key={tag} className="bg-xbox-green/20 text-xbox-green text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                    {tag}
                </span>
            ))}
            {isInstalled && (
              <span className="bg-blue-500/20 text-blue-400 text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                Installed
              </span>
            )}
        </div>

        {/* Favorite Button */}
        <button 
            onClick={() => toggleFavorite(item.id)}
            className={`absolute top-2 right-2 p-1.5 rounded-md backdrop-blur-md transition-all z-10 ${
                item.isFavorite ? 'bg-red-500 text-white' : 'bg-black/40 text-gray-400 hover:text-white'
            }`}
        >
            <Heart size={14} fill={item.isFavorite ? "currentColor" : "none"} />
        </button>

        {/* Collection Quick-Add Button */}
        <button 
            onClick={() => setShowMenu(!showMenu)}
            className="absolute top-10 right-2 p-1.5 bg-black/40 backdrop-blur-md rounded-md text-gray-400 hover:text-white z-10"
        >
            <Plus size={14} />
        </button>

        {showMenu && (
            <div className="absolute top-10 right-10 w-40 bg-surface-card border border-surface-border rounded-lg shadow-2xl z-50 p-2 animate-in zoom-in-95 duration-100">
                <p className="text-[10px] font-bold text-gray-500 px-2 mb-1 uppercase">Add to Collection</p>
                <div className="max-h-32 overflow-y-auto custom-scrollbar">
                  {collections.map(c => (
                      <button 
                          key={c.id}
                          onClick={() => { addItemToCollection(c.id, item.id); setShowMenu(false); }}
                          className="w-full text-left px-2 py-1.5 text-xs hover:bg-xbox-green rounded transition-colors truncate"
                      >
                          {c.name}
                      </button>
                  ))}
                  {collections.length === 0 && <p className="text-[10px] text-gray-600 px-2 italic">No collections</p>}
                </div>
            </div>
        )}
        
        <Package size={48} className="text-surface-border group-hover:text-xbox-green/20 transition-colors" />
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <div className="flex-1">
            <h4 className="text-sm font-bold truncate text-white" title={item.name}>{item.name}</h4>
            <p className="text-[10px] text-xbox-green font-bold uppercase tracking-wider mt-0.5">
                {item.metadata.gameName}
            </p>
        </div>

        <div className="mt-4 pt-3 border-t border-surface-border flex items-center justify-between">
            <span className="text-[10px] text-gray-500 font-mono">{item.metadata.titleId}</span>
            <button 
                onClick={() => addToStaging(item.id)}
                className={`p-2 rounded-lg transition-colors ${isStaged ? 'bg-xbox-green text-white' : 'bg-surface-panel text-gray-400 hover:text-white'}`}
            >
                <FolderPlus size={16} />
            </button>
        </div>
      </div>
    </div>
  );
};
