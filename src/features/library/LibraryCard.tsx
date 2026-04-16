import React, { useState } from 'react';
import { Package, Star, FolderPlus, Plus, Heart, Edit2, Check, X, Info, Cpu, User, Monitor, ExternalLink, Hash, Image as ImageIcon, LayoutGrid, Eye } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { ContentItem } from '../../types';
import { MetadataService } from '../../services/MetadataService';

interface LibraryCardProps {
  item: ContentItem;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  onOpenHub?: (titleId: string) => void;
  onPreview?: (item: ContentItem) => void;
  isSelectionMode?: boolean;
  hideLabels?: boolean;
}

export const LibraryCard = ({ item, isSelected, onSelect, onOpenHub, onPreview, isSelectionMode, hideLabels }: LibraryCardProps) => {
  const { collections, addItemToCollection, toggleFavorite, addToStaging, stagedIds, installedHeuristics, updateMetadata, settings } = useStore();
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showTechInfo, setShowTechInfo] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'structure'>('info');
  const [editData, setEditData] = useState({
    name: item.name,
    gameName: item.metadata.gameName,
    category: item.metadata.category
  });

  const isStaged = stagedIds.includes(item.id);
  const heuristic = `${item.fileName}_${item.size}`;
  const isInstalled = installedHeuristics.includes(heuristic);

  const handleCardClick = (e: React.MouseEvent) => {
    if (isSelectionMode && onSelect) {
      e.preventDefault();
      e.stopPropagation();
      onSelect(item.id);
    }
  };

  const handleSave = async () => {
    await updateMetadata(item.id, { 
      gameName: editData.gameName, 
      category: editData.category 
    });
    // Note: item.name is top-level, we'd need a separate endpoint for that if we wanted to rename the file or just the display name
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="bg-surface-card border border-xbox-green rounded-xl h-full overflow-hidden flex flex-col p-4 space-y-3 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center">
          <h4 className="text-[10px] font-bold text-gray-500 uppercase">Edit Metadata</h4>
          <button onClick={() => setIsEditing(false)} className="text-gray-500 hover:text-white"><X size={14}/></button>
        </div>
        <div className="space-y-2">
          <div>
            <label className="text-[9px] text-gray-500 uppercase font-bold">Game Name</label>
            <input 
              type="text" 
              value={editData.gameName}
              onChange={(e) => setEditData({...editData, gameName: e.target.value})}
              className="w-full bg-surface-panel border border-surface-border rounded px-2 py-1 text-xs outline-none focus:border-xbox-green"
            />
          </div>
          <div>
            <label className="text-[9px] text-gray-500 uppercase font-bold">Category / Franchise</label>
            <input 
              type="text" 
              value={editData.category}
              onChange={(e) => setEditData({...editData, category: e.target.value})}
              className="w-full bg-surface-panel border border-surface-border rounded px-2 py-1 text-xs outline-none focus:border-xbox-green"
            />
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <button 
            onClick={handleSave}
            className="flex-1 bg-xbox-green text-white py-1.5 rounded text-[10px] font-bold flex items-center justify-center gap-1"
          >
            <Check size={12}/> Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={handleCardClick}
      className={`bg-surface-card border rounded-xl h-full overflow-hidden flex flex-col group transition-all relative cursor-pointer ${
        isSelected ? 'border-xbox-green ring-1 ring-xbox-green shadow-lg shadow-xbox-green/20' : 'border-surface-border hover:border-xbox-green/50'
      }`}
    >
      <div className="aspect-[2/3] bg-surface-panel relative flex items-center justify-center overflow-hidden">
        {item.metadata.titleId && item.metadata.titleId !== 'Unknown' ? (
          <img 
            src={MetadataService.getCoverArtUrl(item.metadata.titleId)} 
            alt={item.metadata.gameName}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            referrerPolicy="no-referrer"
          />
        ) : (
          <Package size={48} className="text-surface-border group-hover:text-xbox-green/20 transition-colors" />
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />

        {/* Selection Indicator */}
        {isSelectionMode && (
          <div className={`absolute top-2 left-2 w-5 h-5 rounded-full border-2 z-20 flex items-center justify-center transition-all ${
            isSelected ? 'bg-xbox-green border-xbox-green' : 'bg-black/40 border-white/20'
          }`}>
            {isSelected && <Check size={12} className="text-white" />}
          </div>
        )}

        {/* Badges */}
        <div className={`absolute top-2 flex flex-wrap gap-1 z-10 transition-all ${isSelectionMode ? 'left-9' : 'left-2'}`}>
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
            <span className="bg-surface-card/80 backdrop-blur-md text-gray-500 text-[9px] font-mono px-1.5 py-0.5 rounded border border-surface-border">
                {item.metadata.titleId}
            </span>
        </div>

        {/* Action Buttons */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 z-10">
          <button 
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
              className="p-1.5 bg-black/40 backdrop-blur-md rounded-md text-gray-400 hover:text-white"
              title="Add to Collection"
          >
              <Plus size={14} />
          </button>

          <button 
              onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
              className="p-1.5 bg-black/40 backdrop-blur-md rounded-md text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
              title="Edit Metadata"
          >
              <Edit2 size={14} />
          </button>

          <button 
              onClick={(e) => { e.stopPropagation(); setShowTechInfo(true); }}
              className="p-1.5 bg-black/40 backdrop-blur-md rounded-md text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
              title="View Details"
          >
              <Info size={14} />
          </button>

          <button 
              onClick={(e) => { e.stopPropagation(); onOpenHub?.(item.metadata.titleId); }}
              className="p-1.5 bg-black/40 backdrop-blur-md rounded-md text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
              title="Open Game Hub"
          >
              <LayoutGrid size={14} />
          </button>

          {(item.type === 'theme' || item.type === 'gamerpic') && (
            <button 
                onClick={(e) => { e.stopPropagation(); onPreview?.(item); }}
                className="p-1.5 bg-black/40 backdrop-blur-md rounded-md text-xbox-green hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                title="Preview Content"
            >
                <Eye size={14} />
            </button>
          )}
        </div>

        {/* Quick Actions Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/90 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex justify-around items-center z-20">
          <button 
            onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id); }}
            className={`p-2 rounded-full transition-all ${item.isFavorite ? 'text-red-500 bg-red-500/10' : 'text-white hover:bg-white/10'}`}
            title="Favorite"
          >
            <Heart size={16} fill={item.isFavorite ? "currentColor" : "none"} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); addToStaging(item.id); }}
            className={`p-2 rounded-full transition-all ${isStaged ? 'text-xbox-green bg-xbox-green/10' : 'text-white hover:bg-white/10'}`}
            title="Stage"
          >
            <FolderPlus size={16} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); setShowTechInfo(true); }}
            className="p-2 rounded-full text-white hover:bg-white/10 transition-all"
            title="Details"
          >
            <Info size={16} />
          </button>
        </div>

        {showTechInfo && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-surface-card border border-surface-border rounded-2xl w-full max-w-sm p-6 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Cpu className="text-xbox-green" size={20} /> Content Details
                </h3>
                <button onClick={() => setShowTechInfo(false)} className="text-gray-500 hover:text-white"><X size={20}/></button>
              </div>

              <div className="flex border-b border-surface-border">
                <button 
                  onClick={() => setActiveTab('info')}
                  className={`flex-1 py-2 text-xs font-bold transition-all border-b-2 ${activeTab === 'info' ? 'border-xbox-green text-white' : 'border-transparent text-gray-500'}`}
                >
                  Technical
                </button>
                <button 
                  onClick={() => setActiveTab('structure')}
                  className={`flex-1 py-2 text-xs font-bold transition-all border-b-2 ${activeTab === 'structure' ? 'border-xbox-green text-white' : 'border-transparent text-gray-500'}`}
                >
                  Structure
                </button>
              </div>
              
              <div className="space-y-4 min-h-[300px]">
                {activeTab === 'info' ? (
                  <>
                    <div className="bg-surface-panel p-3 rounded-lg border border-surface-border">
                      <p className="text-[10px] text-gray-500 uppercase font-black mb-1">File Path</p>
                      <p className="text-xs font-mono break-all text-gray-300">{item.fullPath}</p>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <div className="bg-surface-panel p-3 rounded-lg border border-surface-border flex items-center gap-3">
                        <User className="text-xbox-green" size={16} />
                        <div>
                          <p className="text-[9px] text-gray-500 uppercase font-black">Profile ID</p>
                          <p className="text-xs font-mono text-white">
                            {item.metadata.technical?.profileId || '0000000000000000'}
                            {item.metadata.technical?.profileId && settings.profileMappings?.[item.metadata.technical.profileId] && (
                              <span className="ml-2 text-xbox-green font-bold text-[10px]">
                                ({settings.profileMappings[item.metadata.technical.profileId]})
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="bg-surface-panel p-3 rounded-lg border border-surface-border flex items-center gap-3">
                        <Monitor className="text-xbox-green" size={16} />
                        <div>
                          <p className="text-[9px] text-gray-500 uppercase font-black">Console ID</p>
                          <p className="text-xs font-mono text-white">{item.metadata.technical?.consoleId || '0000000000'}</p>
                        </div>
                      </div>
                      <div className="bg-surface-panel p-3 rounded-lg border border-surface-border flex items-center gap-3">
                        <Cpu className="text-xbox-green" size={16} />
                        <div>
                          <p className="text-[9px] text-gray-500 uppercase font-black">Device ID</p>
                          <p className="text-xs font-mono text-white truncate max-w-[200px]">{item.metadata.technical?.deviceId || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="bg-surface-panel p-3 rounded-lg border border-surface-border flex items-center gap-3">
                        <Hash className="text-xbox-green" size={16} />
                        <div>
                          <p className="text-[9px] text-gray-500 uppercase font-black">Media ID</p>
                          <p className="text-xs font-mono text-white">{item.metadata.technical?.mediaId || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase px-1">
                      <span>Format: {item.format}</span>
                      <span>Size: {(item.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>

                    <div className="pt-2 space-y-2">
                      <p className="text-[9px] text-gray-500 uppercase font-black px-1">Online Lookups</p>
                      <div className="grid grid-cols-2 gap-2">
                        <a 
                          href={`http://xboxunity.net/Resources/Lib/TitleId/${item.metadata.titleId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 py-2 bg-surface-panel border border-surface-border rounded-lg text-[10px] font-bold text-gray-400 hover:text-xbox-green hover:border-xbox-green transition-all"
                        >
                          XboxUnity <ExternalLink size={10} />
                        </a>
                        <a 
                          href={`https://www.google.com/search?q=Xbox+360+Title+ID+${item.metadata.titleId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 py-2 bg-surface-panel border border-surface-border rounded-lg text-[10px] font-bold text-gray-400 hover:text-xbox-green hover:border-xbox-green transition-all"
                        >
                          Google Search <ExternalLink size={10} />
                        </a>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-surface-panel border border-surface-border rounded-xl">
                      <div className="flex items-center gap-2 mb-4">
                        <ImageIcon size={16} className="text-xbox-green" />
                        <span className="text-xs font-bold">Package Contents</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-gray-400">/Content/0000000000000000/</span>
                          <span className="text-gray-600">DIR</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] pl-4">
                          <span className="text-gray-300">{item.metadata.titleId}/</span>
                          <span className="text-gray-600">DIR</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] pl-8">
                          <span className="text-gray-300">00000002/</span>
                          <span className="text-gray-600">DIR</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] pl-12">
                          <span className="text-xbox-green font-bold">{item.fileName}</span>
                          <span className="text-gray-600">FILE</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-500 italic text-center px-4">
                      This structure is inferred from the STFS header and standard Xbox 360 content paths.
                    </p>
                  </div>
                )}
              </div>

              <button 
                onClick={() => setShowTechInfo(false)}
                className="w-full py-3 bg-surface-panel border border-surface-border rounded-xl font-bold hover:bg-surface-card transition-all"
              >
                Close
              </button>
            </div>
          </div>
        )}

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
      </div>

      {!hideLabels && (
        <div className="p-4 flex-1 flex flex-col">
          <div className="flex-1">
              <h4 className="text-sm font-bold truncate text-white" title={item.name}>{item.name}</h4>
              <p className="text-[10px] text-xbox-green font-bold uppercase tracking-wider mt-0.5">
                  {item.metadata.gameName}
              </p>
          </div>

          <div className="mt-4 pt-3 border-t border-surface-border flex items-center justify-between">
              <span className="text-[10px] text-gray-500 font-mono">{item.metadata.titleId}</span>
              <div className="flex items-center gap-1">
                <button 
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id); }}
                    className={`p-1.5 rounded-md transition-all ${
                        item.isFavorite ? 'text-red-500' : 'text-gray-500 hover:text-white'
                    }`}
                    title="Toggle Favorite"
                >
                    <Heart size={14} fill={item.isFavorite ? "currentColor" : "none"} />
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); addToStaging(item.id); }}
                    className={`p-1.5 rounded-md transition-colors ${isStaged ? 'bg-xbox-green text-white' : 'bg-surface-panel text-gray-400 hover:text-white'}`}
                    title="Add to Staging"
                >
                    <FolderPlus size={14} />
                </button>
              </div>
          </div>
        </div>
      )}
    </div>
  );
};
