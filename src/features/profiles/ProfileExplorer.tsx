import React, { useMemo, useState } from 'react';
import { useStore } from '../../store/useStore';
import { User, Package, ChevronRight, Search, Filter, HardDrive, Cpu, Edit2, Check, X, FolderPlus, AlertCircle } from 'lucide-react';
import { ContentItem } from '../../types';

export const ProfileExplorer = () => {
  const { items, settings, updateSettings, addToStaging, addToast } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');

  const profileMappings = settings.profileMappings || {};

  const profileGroups = useMemo(() => {
    const groups: Record<string, ContentItem[]> = {};
    
    items.forEach(item => {
      const profileId = item.metadata.technical?.profileId || '0000000000000000';
      if (!groups[profileId]) {
        groups[profileId] = [];
      }
      groups[profileId].push(item);
    });

    return Object.entries(groups)
      .map(([id, items]) => ({
        id,
        name: profileMappings[id] || (id === '0000000000000000' ? 'Global / No Profile' : id),
        items,
        count: items.length,
        totalSize: items.reduce((acc, i) => acc + i.size, 0)
      }))
      .sort((a, b) => b.count - a.count);
  }, [items, profileMappings]);

  const filteredProfiles = profileGroups.filter(p => 
    p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.items.some(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const selectedProfileData = useMemo(() => {
    if (!selectedProfile) return null;
    return profileGroups.find(p => p.id === selectedProfile);
  }, [selectedProfile, profileGroups]);

  const handleSaveName = async () => {
    if (!selectedProfile) return;
    const updatedMappings = { ...profileMappings, [selectedProfile]: tempName };
    await updateSettings({ profileMappings: updatedMappings });
    setIsEditingName(false);
  };

  const handleStageAll = () => {
    if (!selectedProfileData) return;
    selectedProfileData.items.forEach(item => addToStaging(item.id));
    addToast(`Added ${selectedProfileData.items.length} profile items to staging`, 'success');
  };

  const formatSize = (bytes: number) => {
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const selectedProfileStats = useMemo(() => {
    if (!selectedProfileData) return [];
    const counts: Record<string, number> = {};
    selectedProfileData.items.forEach(i => {
      counts[i.type] = (counts[i.type] || 0) + 1;
    });
    return Object.entries(counts).map(([type, count]) => ({ type, count }));
  }, [selectedProfileData]);

  const profileHealth = useMemo(() => {
    if (!selectedProfileData) return null;
    const consoleIds = new Set(selectedProfileData.items.map(i => i.metadata.technical?.consoleId).filter(Boolean));
    const deviceIds = new Set(selectedProfileData.items.map(i => i.metadata.technical?.deviceId).filter(Boolean));
    
    return {
      isConsistent: consoleIds.size <= 1,
      consoleCount: consoleIds.size,
      deviceCount: deviceIds.size
    };
  }, [selectedProfileData]);

  return (
    <div className="p-8 h-full flex flex-col space-y-6 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <User className="text-xbox-green" /> Profile Explorer
          </h2>
          <p className="text-gray-500 mt-1">Analyze content distribution by Profile ID.</p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
          <input 
            type="text" 
            placeholder="Search Profile IDs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface-card border border-surface-border rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:border-xbox-green transition-all"
          />
        </div>
      </header>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Profile List */}
        <div className="w-1/3 bg-surface-card border border-surface-border rounded-2xl overflow-hidden flex flex-col">
          <div className="p-4 bg-surface-panel border-b border-surface-border flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">Detected Profiles</h3>
            <span className="bg-xbox-green/20 text-xbox-green text-[10px] font-bold px-2 py-0.5 rounded-full">
              {filteredProfiles.length} Total
            </span>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-surface-border/50">
            {filteredProfiles.map(profile => (
              <button 
                key={profile.id}
                onClick={() => setSelectedProfile(profile.id)}
                className={`w-full p-4 flex items-center justify-between group transition-all hover:bg-white/[0.02] ${
                  selectedProfile === profile.id ? 'bg-xbox-green/10 border-l-4 border-l-xbox-green' : ''
                }`}
              >
                <div className="text-left">
                  <p className={`text-sm font-mono font-bold ${selectedProfile === profile.id ? 'text-xbox-green' : 'text-white'}`}>
                    {profile.name}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-1 uppercase font-black">
                    {profile.id !== profile.name ? `${profile.id} • ` : ''}{profile.count} Items • {formatSize(profile.totalSize)}
                  </p>
                </div>
                <ChevronRight size={16} className={`transition-transform ${selectedProfile === profile.id ? 'text-xbox-green translate-x-1' : 'text-gray-700 group-hover:text-gray-400'}`} />
              </button>
            ))}
          </div>
        </div>

        {/* Profile Details */}
        <div className="flex-1 bg-surface-card border border-surface-border rounded-2xl overflow-hidden flex flex-col">
          {selectedProfileData ? (
            <>
              <div className="p-6 bg-surface-panel border-b border-surface-border flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-xbox-green/20 rounded-xl flex items-center justify-center text-xbox-green">
                    <User size={24} />
                  </div>
                  <div>
                    {isEditingName ? (
                      <div className="flex items-center gap-2">
                        <input 
                          type="text" 
                          value={tempName}
                          onChange={(e) => setTempName(e.target.value)}
                          autoFocus
                          className="bg-surface-card border border-xbox-green rounded px-2 py-1 text-sm font-bold outline-none"
                        />
                        <button onClick={handleSaveName} className="p-1 text-xbox-green hover:bg-xbox-green/10 rounded"><Check size={16}/></button>
                        <button onClick={() => setIsEditingName(false)} className="p-1 text-red-500 hover:bg-red-500/10 rounded"><X size={16}/></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 group">
                        <h3 className="text-xl font-bold">{selectedProfileData.name}</h3>
                        <button 
                          onClick={() => { setTempName(selectedProfileData.name); setIsEditingName(true); }}
                          className="p-1 text-gray-500 hover:text-xbox-green opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Edit2 size={14} />
                        </button>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 uppercase font-black tracking-widest">
                      {selectedProfileData.id} • {selectedProfileData.count} Associated Items
                    </p>
                    <div className="flex gap-2 mt-2">
                      {selectedProfileStats.map(s => (
                        <span key={s.type} className="text-[9px] font-black uppercase px-2 py-0.5 bg-surface-card border border-surface-border rounded text-gray-400">
                          {s.count} {s.type.replace('_', ' ')}
                        </span>
                      ))}
                      {profileHealth && !profileHealth.isConsistent && (
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded text-red-500 flex items-center gap-1">
                          <AlertCircle size={10} />
                          Inconsistent Console IDs ({profileHealth.consoleCount})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">{formatSize(selectedProfileData.totalSize)}</p>
                    <p className="text-[10px] text-gray-500 uppercase font-black">Total Footprint</p>
                  </div>
                  <button 
                    onClick={handleStageAll}
                    className="flex items-center gap-2 px-4 py-2 bg-xbox-green hover:bg-xbox-hover text-white rounded-lg font-bold text-xs transition-all shadow-lg shadow-xbox-green/10"
                  >
                    <FolderPlus size={16} />
                    <span>Stage All</span>
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                <div className="grid grid-cols-1 gap-3">
                  {selectedProfileData.items.map(item => (
                    <div key={item.id} className="bg-surface-panel border border-surface-border rounded-xl p-4 flex items-center justify-between group hover:border-xbox-green/50 transition-all">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-10 h-10 bg-surface-card rounded-lg flex items-center justify-center text-gray-500 group-hover:text-xbox-green transition-colors">
                          <Package size={20} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate text-white">{item.name}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[10px] text-xbox-green font-bold uppercase">{item.type.replace('_', ' ')}</span>
                            <span className="text-[10px] text-gray-500 font-mono">{item.metadata.titleId}</span>
                            <span className="text-[10px] text-gray-500">{formatSize(item.size)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex flex-col items-end text-[9px] text-gray-500 uppercase font-black mr-2">
                          <span>Console: {item.metadata.technical?.consoleId || 'N/A'}</span>
                          <span>Device: {item.metadata.technical?.deviceId?.substring(0, 8) || 'N/A'}...</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
              <User size={64} className="opacity-10 mb-4" />
              <p className="text-lg font-bold">Select a profile to view details</p>
              <p className="text-sm">Explore content associated with specific Xbox 360 profiles.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
