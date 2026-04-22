import React, { useMemo, useState } from 'react';
import { X, Package, Download, FolderPlus, ShieldCheck, AlertCircle, Info, ExternalLink, Globe, LayoutGrid, Layers, User, Monitor, RefreshCw } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { ContentItem } from '../../types';
import { MetadataService } from '../../services/MetadataService';

interface GameHubProps {
  titleId: string;
  onClose: () => void;
}

export const GameHub = ({ titleId, onClose }: GameHubProps) => {
  const { items, addToStaging, stagedIds, fetchOnlineMetadata } = useStore();
  const [isFetching, setIsFetching] = useState(false);

  const relatedItems = useMemo(() => {
    return items.filter(item => item.metadata.titleId === titleId);
  }, [items, titleId]);

  const gameInfo = useMemo(() => {
    const game = relatedItems.find(i => i.type === 'god' || i.type === 'xbla') || relatedItems[0];
    return game?.metadata;
  }, [relatedItems]);

  const groupedContent = useMemo(() => {
    const groups: Record<string, ContentItem[]> = {
      'Base Game': relatedItems.filter(i => i.type === 'god' || i.type === 'xbla'),
      'DLC & Content': relatedItems.filter(i => i.type === 'dlc'),
      'Themes': relatedItems.filter(i => i.type === 'theme'),
      'Gamerpics': relatedItems.filter(i => i.type === 'gamerpic'),
      'Avatar Items': relatedItems.filter(i => i.type === 'avatar_item'),
      'Title Updates': relatedItems.filter(i => i.type === 'title_update'),
      'Other': relatedItems.filter(i => !['god', 'xbla', 'dlc', 'theme', 'gamerpic', 'avatar_item', 'title_update'].includes(i.type))
    };
    return groups;
  }, [relatedItems]);

  const stats = useMemo(() => {
    const totalSize = relatedItems.reduce((acc, i) => acc + i.size, 0);
    const hasUpdate = relatedItems.some(i => i.type === 'title_update');
    const dlcCount = relatedItems.filter(i => i.type === 'dlc').length;
    return { totalSize, hasUpdate, dlcCount };
  }, [relatedItems]);

  const handleStageAll = () => {
    relatedItems.forEach(item => addToStaging(item.id));
  };

  const handleFetchOnline = async () => {
    setIsFetching(true);
    await fetchOnlineMetadata(relatedItems.map(i => i.id));
    setIsFetching(false);
  };

  return (
    <div className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
      <div className="bg-surface-card border border-surface-border rounded-3xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl shadow-xbox-green/10">
        {/* Header Section */}
        <div className="relative h-64 shrink-0 overflow-hidden">
          <img 
            src={gameInfo?.coverUrl || MetadataService.getCoverArtUrl(titleId)} 
            alt={gameInfo?.gameName}
            className="w-full h-full object-cover blur-2xl opacity-30 scale-110"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-card via-surface-card/60 to-transparent" />
          
          <div className="absolute inset-0 p-8 flex items-end justify-between">
            <div className="flex items-center gap-8">
              <div className="w-32 h-48 bg-surface-panel rounded-xl border border-surface-border shadow-2xl overflow-hidden group">
                <img 
                  src={gameInfo?.coverUrl || MetadataService.getCoverArtUrl(titleId)} 
                  alt={gameInfo?.gameName}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 bg-xbox-green text-white text-[10px] font-black rounded uppercase tracking-widest">Game Hub</span>
                  <span className="text-gray-500 font-mono text-xs">{titleId}</span>
                </div>
                <h2 className="text-5xl font-black text-white tracking-tight">{gameInfo?.gameName || 'Unknown Game'}</h2>
                <div className="flex items-center gap-6 text-sm text-gray-400 font-bold">
                  <span className="flex items-center gap-2"><Layers size={16} className="text-xbox-green" /> {relatedItems.length} Total Items</span>
                  <span className="flex items-center gap-2"><Package size={16} className="text-xbox-green" /> {(stats.totalSize / 1024 / 1024).toFixed(2)} MB</span>
                  {stats.hasUpdate && <span className="flex items-center gap-2 text-xbox-green"><ShieldCheck size={16} /> Title Update Found</span>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={handleFetchOnline}
                disabled={isFetching}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
              >
                {isFetching ? <RefreshCw size={20} className="animate-spin" /> : <Globe size={20} />}
                <span>Refresh Metadata</span>
              </button>
              <button 
                onClick={handleStageAll}
                className="flex items-center gap-2 px-6 py-3 bg-xbox-green hover:bg-xbox-hover text-white rounded-xl font-bold transition-all shadow-lg shadow-xbox-green/20"
              >
                <FolderPlus size={20} />
                <span>Stage All Content</span>
              </button>
              <button 
                onClick={onClose}
                className="p-3 bg-surface-panel border border-surface-border rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
              >
                <X size={24} />
              </button>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 overflow-hidden flex">
          {/* Sidebar Info */}
          <div className="w-80 border-r border-surface-border p-8 space-y-8 overflow-y-auto custom-scrollbar">
            <section className="space-y-4">
              <h4 className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em]">Quick Lookups</h4>
              <div className="grid grid-cols-1 gap-2">
                <a 
                  href={`http://xboxunity.net/Resources/Lib/TitleId/${titleId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-surface-panel border border-surface-border rounded-xl text-xs font-bold text-gray-400 hover:text-xbox-green hover:border-xbox-green transition-all"
                >
                  <span>XboxUnity</span>
                  <ExternalLink size={14} />
                </a>
                <a 
                  href={`https://www.google.com/search?q=Xbox+360+Title+ID+${titleId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-surface-panel border border-surface-border rounded-xl text-xs font-bold text-gray-400 hover:text-xbox-green hover:border-xbox-green transition-all"
                >
                  <span>Google Search</span>
                  <ExternalLink size={14} />
                </a>
              </div>
            </section>

            <section className="space-y-4">
              <h4 className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em]">Integrity Status</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-surface-panel border border-surface-border rounded-xl">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-xbox-green" />
                    <span className="text-xs font-bold">Base Game</span>
                  </div>
                  <span className="text-[10px] text-xbox-green font-black uppercase">Verified</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-surface-panel border border-surface-border rounded-xl">
                  <div className="flex items-center gap-2">
                    {stats.hasUpdate ? <ShieldCheck size={16} className="text-xbox-green" /> : <AlertCircle size={16} className="text-yellow-500" />}
                    <span className="text-xs font-bold">Title Update</span>
                  </div>
                  <span className={`text-[10px] font-black uppercase ${stats.hasUpdate ? 'text-xbox-green' : 'text-yellow-500'}`}>
                    {stats.hasUpdate ? 'Installed' : 'Missing'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-surface-panel border border-surface-border rounded-xl">
                  <div className="flex items-center gap-2">
                    <Layers size={16} className="text-xbox-green" />
                    <span className="text-xs font-bold">DLC Content</span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-black uppercase">{stats.dlcCount} Found</span>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h4 className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em]">Technical Metadata</h4>
              <div className="space-y-2">
                <div className="p-3 bg-surface-panel border border-surface-border rounded-xl">
                  <p className="text-[9px] text-gray-500 uppercase font-black mb-1">Franchise</p>
                  <p className="text-xs font-bold text-white">{gameInfo?.category || 'General'}</p>
                </div>
                <div className="p-3 bg-surface-panel border border-surface-border rounded-xl">
                  <p className="text-[9px] text-gray-500 uppercase font-black mb-1">Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {gameInfo?.tags.map(t => (
                      <span key={t} className="px-1.5 py-0.5 bg-xbox-green/10 text-xbox-green text-[9px] font-black rounded uppercase">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 p-8 overflow-y-auto custom-scrollbar space-y-12">
            {Object.entries(groupedContent).map(([groupName, groupItems]) => (
              groupItems.length > 0 && (
                <section key={groupName} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black uppercase tracking-widest text-white flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-xbox-green" />
                      {groupName}
                      <span className="text-xs text-gray-600 font-bold ml-2">({groupItems.length})</span>
                    </h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {groupItems.map(item => (
                      <div 
                        key={item.id}
                        className="p-4 bg-surface-panel border border-surface-border rounded-2xl hover:border-xbox-green/50 transition-all group relative overflow-hidden"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-surface-card border border-surface-border flex items-center justify-center text-gray-500 group-hover:text-xbox-green transition-colors">
                              <Package size={20} />
                            </div>
                            <div className="min-w-0">
                              <h5 className="text-sm font-bold truncate text-white" title={item.name}>{item.name}</h5>
                              <p className="text-[10px] text-gray-500 font-mono">{item.format} • {(item.size / 1024 / 1024).toFixed(1)} MB</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => addToStaging(item.id)}
                            className={`p-2 rounded-lg transition-all ${stagedIds.includes(item.id) ? 'bg-xbox-green text-white' : 'bg-surface-card text-gray-500 hover:text-white hover:bg-xbox-green/20'}`}
                          >
                            <FolderPlus size={16} />
                          </button>
                        </div>
                        
                        <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest text-gray-600">
                          <span className="flex items-center gap-1"><User size={10} /> {item.metadata.technical?.profileId || '0000000000000000'}</span>
                          <span className="flex items-center gap-1"><Monitor size={10} /> {item.metadata.technical?.consoleId || '0000000000'}</span>
                        </div>

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-xbox-green/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                      </div>
                    ))}
                  </div>
                </section>
              )
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
