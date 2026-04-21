import React, { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Loader2, RefreshCw, Eye, EyeOff, Edit2, Package, Trash2, X, Download, LayoutGrid, GalleryHorizontal, Globe, FileText, FolderPlus, AlertTriangle, CheckCircle2, Info, Type } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { ContentItem, ContentType } from '../../types';
import { LibraryCard } from './LibraryCard';
import { GameHub } from './GameHub';
import { ContentPreviewer } from './ContentPreviewer';
import { FilterSidebar } from './FilterSidebar';
import { Modal } from '../../components/ui/Modal';
import { buildInstalledContentKey } from '../../utils/contentPaths';

interface LibraryViewProps {
  title: string;
  types: ContentType[];
}

export const LibraryView = ({ title, types }: LibraryViewProps) => {
  const { items, isScanning, fetchItems, triggerScan, installedHeuristics, addToStaging, bulkUpdateMetadata, bulkDeleteItems, globalSearch, fetchOnlineMetadata } = useStore();
  const [activeFranchise, setActiveFranchise] = useState('All');
  const [hideInstalled, setHideInstalled] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('name');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    profileId: '',
    consoleId: '',
    titleId: '',
    format: 'All',
    minSize: 0,
    maxSize: 0,
    dateRange: 'All Time'
  });
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'gallery'>('grid');
  const [gridDensity, setGridDensity] = useState<'compact' | 'normal' | 'large'>('normal');
  const [isBulkEditing, setIsBulkEditing] = useState(false);
  const [bulkEditData, setBulkEditData] = useState({ gameName: '', category: '' });
  const [selectedTitleId, setSelectedTitleId] = useState<string | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [previewItem, setPreviewItem] = useState<ContentItem | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showOrganizeConfirm, setShowOrganizeConfirm] = useState(false);
  const [isFetchingOnline, setIsFetchingOnline] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const { organizeLibrary } = useStore();

  useEffect(() => {
    fetchItems();
  }, []);

  const franchises = useMemo(() => ['All', ...new Set(items.filter(i => types.includes(i.type)).map(i => i.metadata.category))], [items, types]);

  const filteredItems = useMemo(() => {
    const filtered = items.filter(item => {
      const matchesType = types.includes(item.type);
      const matchesSearch = item.name.toLowerCase().includes(globalSearch.toLowerCase()) || 
                            item.metadata?.gameName.toLowerCase().includes(globalSearch.toLowerCase()) ||
                            item.metadata?.titleId.toLowerCase().includes(globalSearch.toLowerCase());
      const matchesFranchise = activeFranchise === 'All' || item.metadata?.category === activeFranchise;
      
      const matchesProfile = !advancedFilters.profileId || item.metadata.technical?.profileId?.toLowerCase().includes(advancedFilters.profileId.toLowerCase());
      const matchesConsole = !advancedFilters.consoleId || item.metadata.technical?.consoleId?.toLowerCase().includes(advancedFilters.consoleId.toLowerCase());
      const matchesTitleId = !advancedFilters.titleId || item.metadata.titleId.toLowerCase().includes(advancedFilters.titleId.toLowerCase());
      const matchesFormat = advancedFilters.format === 'All' || item.format === advancedFilters.format;

      // Size Filter
      const sizeMB = item.size / 1024 / 1024;
      const matchesMinSize = advancedFilters.minSize === 0 || sizeMB >= advancedFilters.minSize;
      const matchesMaxSize = advancedFilters.maxSize === 0 || sizeMB <= advancedFilters.maxSize;

      // Date Filter
      let matchesDate = true;
      if (advancedFilters.dateRange !== 'All Time') {
        const now = new Date();
        const itemDate = new Date(item.dateModified);
        const diff = now.getTime() - itemDate.getTime();
        const days = diff / (1000 * 60 * 60 * 24);
        
        if (advancedFilters.dateRange === 'Last 24 Hours') matchesDate = days <= 1;
        else if (advancedFilters.dateRange === 'Last 7 Days') matchesDate = days <= 7;
        else if (advancedFilters.dateRange === 'Last 30 Days') matchesDate = days <= 30;
        else if (advancedFilters.dateRange === 'Last 90 Days') matchesDate = days <= 90;
      }

      const isInstalled = installedHeuristics.includes(buildInstalledContentKey(item));
      const matchesInstalledFilter = hideInstalled ? !isInstalled : true;

      return matchesType && matchesSearch && matchesFranchise && matchesInstalledFilter && 
             matchesProfile && matchesConsole && matchesTitleId && matchesFormat && 
             matchesMinSize && matchesMaxSize && matchesDate;
    });

    return filtered.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'date') return new Date(b.dateModified).getTime() - new Date(a.dateModified).getTime();
      if (sortBy === 'size') return b.size - a.size;
      return 0;
    });
  }, [items, types, globalSearch, activeFranchise, hideInstalled, installedHeuristics, sortBy, advancedFilters]);

  const [isRenaming, setIsRenaming] = useState(false);
  const [renameTemplate, setRenameTemplate] = useState('[GameName] ([TitleID])');
  const [renameOperations, setRenameOperations] = useState<any[]>([]);
  const [isPreviewingRename, setIsPreviewingRename] = useState(false);

  const handlePreviewRename = async () => {
    if (selectedIds.length === 0) return;
    setIsPreviewingRename(true);
    const ops = await useStore.getState().previewRename(selectedIds, renameTemplate);
    setRenameOperations(ops);
    setIsPreviewingRename(false);
  };

  const handleApplyRename = async () => {
    if (renameOperations.length === 0) return;
    setIsProcessing(true);
    await useStore.getState().applyRename(renameOperations);
    setIsRenaming(false);
    setRenameOperations([]);
    setSelectedIds([]);
    setIsSelectionMode(false);
    setIsProcessing(false);
  };

  const handleStageAll = () => {
    filteredItems.forEach(item => addToStaging(item.id));
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkUpdate = async () => {
    if (selectedIds.length === 0) return;
    const metadata: any = {};
    if (bulkEditData.gameName) metadata.gameName = bulkEditData.gameName;
    if (bulkEditData.category) metadata.category = bulkEditData.category;
    
    await bulkUpdateMetadata(selectedIds, metadata);
    setIsBulkEditing(false);
    setSelectedIds([]);
    setIsSelectionMode(false);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsProcessing(true);
    await bulkDeleteItems(selectedIds);
    setSelectedIds([]);
    setIsSelectionMode(false);
    setShowDeleteConfirm(false);
    setIsProcessing(false);
  };

  const handleOrganizeLibrary = async () => {
    if (selectedIds.length === 0) return;
    setIsProcessing(true);
    await organizeLibrary(selectedIds);
    setSelectedIds([]);
    setIsSelectionMode(false);
    setShowOrganizeConfirm(false);
    setIsProcessing(false);
  };

  const handleFetchOnline = async () => {
    if (selectedIds.length === 0) return;
    setIsFetchingOnline(true);
    const updated = await fetchOnlineMetadata(selectedIds);
    useStore.getState().addToast(`Successfully updated ${updated} items from online database`, 'success');
    setIsFetchingOnline(false);
    setSelectedIds([]);
    setIsSelectionMode(false);
  };

  const handleBulkStage = () => {
    selectedIds.forEach(id => addToStaging(id));
    setSelectedIds([]);
    setIsSelectionMode(false);
  };

  const handleExportList = () => {
    const data = JSON.stringify(filteredItems, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `friied360_library_${title.toLowerCase().replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportHtml = () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>FriieD360 Library Report - ${title}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #050505; color: #fff; padding: 40px; }
          h1 { color: #107C10; border-bottom: 2px solid #107C10; padding-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #222; }
          th { background: #111; color: #107C10; text-transform: uppercase; font-size: 12px; }
          tr:hover { background: #0a0a0a; }
          .title-id { font-family: monospace; color: #888; }
          .game-name { font-weight: bold; color: #107C10; }
          .size { color: #666; font-size: 11px; }
        </style>
      </head>
      <body>
        <h1>FriieD360 Library Report: ${title}</h1>
        <p>Generated on ${new Date().toLocaleString()} - ${filteredItems.length} items</p>
        <table>
          <thead>
            <tr>
              <th>Game Name</th>
              <th>Title ID</th>
              <th>Filename</th>
              <th>Format</th>
              <th>Size</th>
            </tr>
          </thead>
          <tbody>
            ${filteredItems.map(item => `
              <tr>
                <td class="game-name">${item.metadata.gameName}</td>
                <td class="title-id">${item.metadata.titleId}</td>
                <td>${item.name}</td>
                <td>${item.format}</td>
                <td class="size">${(item.size / 1024 / 1024).toFixed(2)} MB</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `friied360_report_${title.toLowerCase().replace(/\s+/g, '_')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredItems.length && filteredItems.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map(i => i.id));
    }
  };

  const GUTTER = 16;
  const COLUMN_WIDTH = 220 + GUTTER;
  const ROW_HEIGHT = 220 + GUTTER;

  const Cell = ({ columnIndex, rowIndex, style, data }: any) => {
    const itemIndex = rowIndex * data.columnCount + columnIndex;
    const item = data.items[itemIndex];

    if (!item) return null;

    return (
      <div style={{
        ...style,
        left: style.left + GUTTER,
        top: style.top + GUTTER,
        width: style.width - GUTTER,
        height: style.height - GUTTER
      }}>
        <LibraryCard item={item} />
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col p-8 space-y-6">
      <div className="flex justify-between items-end">
        <div className="flex items-center space-x-6">
          {isSelectionMode && (
            <div className="flex items-center space-x-2 bg-surface-card border border-surface-border rounded-lg px-3 py-2 animate-in slide-in-from-left duration-200">
              <input 
                type="checkbox" 
                checked={selectedIds.length === filteredItems.length && filteredItems.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 accent-xbox-green cursor-pointer"
              />
              <span className="text-xs font-bold text-gray-400">{selectedIds.length} Selected</span>
            </div>
          )}
          <div>
            <h2 className="text-3xl font-bold">{title}</h2>
            <p className="text-gray-500 mt-1">{filteredItems.length} items discovered</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`flex items-center space-x-2 px-4 py-2 border rounded-lg transition-all text-sm font-bold ${
              showAdvancedFilters ? 'bg-xbox-green border-xbox-green text-white' : 'bg-surface-card border-surface-border text-gray-400 hover:text-white'
            }`}
          >
            <Filter size={18} />
            <span>Filters</span>
          </button>

          <button 
            onClick={() => {
              setIsSelectionMode(!isSelectionMode);
              setSelectedIds([]);
            }}
            className={`flex items-center space-x-2 px-4 py-2 border rounded-lg transition-all text-sm font-bold ${
              isSelectionMode ? 'bg-xbox-green border-xbox-green text-white' : 'bg-surface-card border-surface-border text-gray-400 hover:text-white'
            }`}
          >
            <Filter size={18} />
            <span>{isSelectionMode ? 'Cancel Selection' : 'Multi-Select'}</span>
          </button>

          {filteredItems.length > 0 && !isSelectionMode && (
            <button 
              onClick={handleStageAll}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500/10 border border-blue-500/50 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-all text-sm font-bold"
            >
              <Filter size={18} />
              <span>Stage All {filteredItems.length}</span>
            </button>
          )}

          <button 
            onClick={() => setHideInstalled(!hideInstalled)}
            className={`flex items-center space-x-2 px-4 py-2 border rounded-lg transition-all text-sm font-bold ${
              hideInstalled ? 'bg-blue-500/10 border-blue-500 text-blue-400' : 'bg-surface-card border-surface-border text-gray-400 hover:text-white'
            }`}
          >
            {hideInstalled ? <EyeOff size={18} /> : <Eye size={18} />}
            <span>{hideInstalled ? 'Hiding Installed' : 'Show All'}</span>
          </button>

          <button 
            onClick={handleExportList}
            className="p-2 bg-surface-card border border-surface-border rounded-lg hover:border-xbox-green transition-all text-gray-400 hover:text-white"
            title="Export current list as JSON"
          >
            <Download size={18} />
          </button>

          <button 
            onClick={() => setShowOrganizeConfirm(true)}
            disabled={selectedIds.length === 0}
            className="flex items-center space-x-2 px-4 py-2 bg-surface-card border border-surface-border rounded-lg hover:border-xbox-green transition-all disabled:opacity-50 text-gray-400 hover:text-white"
            title="Organize selected items into folders"
          >
            <FolderPlus size={18} />
            <span className="text-sm font-bold">Organize</span>
          </button>

          {isSelectionMode && (
            <button 
              onClick={handleFetchOnline}
              disabled={selectedIds.length === 0 || isFetchingOnline}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500/10 border border-blue-500/50 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-all disabled:opacity-50 text-sm font-bold"
              title="Fetch metadata from Xbox Unity"
            >
              {isFetchingOnline ? <RefreshCw size={18} className="animate-spin" /> : <Globe size={18} />}
              <span>Fetch Online</span>
            </button>
          )}

          {isSelectionMode && (
            <button 
              onClick={() => setShowDeleteConfirm(true)}
              disabled={selectedIds.length === 0}
              className="flex items-center space-x-2 px-4 py-2 bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/20 transition-all disabled:opacity-50 text-sm font-bold"
              title="Remove selected items"
            >
              <Trash2 size={18} />
              <span>Remove</span>
            </button>
          )}

          <button 
            onClick={handleExportHtml}
            className="p-2 bg-surface-card border border-surface-border rounded-lg hover:border-xbox-green transition-all text-gray-400 hover:text-white"
            title="Export current list as HTML Report"
          >
            <FileText size={18} />
          </button>

          <button 
            onClick={async () => {
              const ids = filteredItems.map(i => i.id);
              if (ids.length === 0) return;
              const count = await fetchOnlineMetadata(ids);
              alert(`Updated ${count} items with online metadata.`);
            }}
            className="p-2 bg-surface-card border border-surface-border rounded-lg hover:border-xbox-green transition-all text-gray-400 hover:text-white"
            title="Fetch Online Metadata for filtered items"
          >
            <Globe size={18} />
          </button>

          <button 
            onClick={() => fetchItems()}
            className="p-2 bg-surface-card border border-surface-border rounded-lg hover:border-xbox-green transition-all text-gray-400 hover:text-white"
            title="Sync with database"
          >
            <RefreshCw size={18} />
          </button>

          <button 
            onClick={() => triggerScan(true)}
            disabled={isScanning}
            className="flex items-center space-x-2 px-4 py-2 bg-surface-card border border-surface-border rounded-lg hover:border-xbox-green transition-all disabled:opacity-50 group"
            title="Re-verify all files, ignoring cache"
          >
            {isScanning ? <Loader2 size={18} className="animate-spin text-xbox-green" /> : <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-500" />}
            <span className="text-sm font-bold">{isScanning ? 'Scanning...' : 'Deep Scan'}</span>
          </button>

          <button 
            onClick={() => triggerScan(false)}
            disabled={isScanning}
            className="flex items-center space-x-2 px-4 py-2 bg-xbox-green rounded-lg hover:bg-xbox-hover transition-all disabled:opacity-50"
          >
            {isScanning ? <Loader2 size={18} className="animate-spin text-white" /> : <RefreshCw size={18} />}
            <span className="text-sm font-bold">{isScanning ? 'Scanning...' : 'Scan Folders'}</span>
          </button>

          <div className="flex bg-surface-card border border-surface-border rounded-lg p-1">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-xbox-green text-white' : 'text-gray-500 hover:text-white'}`}
              title="Grid View"
            >
              <LayoutGrid size={16} />
            </button>
            <button 
              onClick={() => setViewMode('gallery')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'gallery' ? 'bg-xbox-green text-white' : 'text-gray-500 hover:text-white'}`}
              title="Gallery View"
            >
              <GalleryHorizontal size={16} />
            </button>
          </div>

          {viewMode === 'grid' && (
            <div className="flex items-center gap-2">
              <div className="flex bg-surface-card border border-surface-border rounded-lg p-1">
                {['compact', 'normal', 'large'].map((d) => (
                  <button
                    key={d}
                    onClick={() => setGridDensity(d as any)}
                    className={`px-2 py-1 text-[9px] font-black uppercase tracking-widest rounded transition-all ${
                      gridDensity === d ? 'bg-xbox-green text-white' : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {d[0]}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setShowLabels(!showLabels)}
                className={`p-2 border rounded-lg transition-all ${
                  !showLabels ? 'bg-xbox-green/10 border-xbox-green text-xbox-green' : 'bg-surface-card border-surface-border text-gray-400 hover:text-white'
                }`}
                title={showLabels ? 'Switch to Covers Only' : 'Show Labels'}
              >
                {showLabels ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>
          )}

          <select 
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="bg-surface-card border border-surface-border rounded-lg px-3 py-2 text-sm font-bold outline-none focus:border-xbox-green cursor-pointer"
          >
            <option value="name">Sort by Name</option>
            <option value="date">Sort by Date</option>
            <option value="size">Sort by Size</option>
          </select>
        </div>
      </div>

      <div className="flex bg-surface-card border border-surface-border rounded-xl p-1 overflow-x-auto max-w-full custom-scrollbar">
        {franchises.slice(0, 8).map(f => (
          <button
            key={f}
            onClick={() => setActiveFranchise(f)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeFranchise === f ? 'bg-xbox-green text-white shadow-lg shadow-xbox-green/20' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {f}
          </button>
        ))}
        {franchises.length > 8 && (
          <select 
            value={franchises.includes(activeFranchise) && franchises.indexOf(activeFranchise) >= 8 ? activeFranchise : 'More'}
            onChange={(e) => setActiveFranchise(e.target.value)}
            className="bg-transparent text-xs font-bold text-gray-500 px-2 outline-none"
          >
            <option value="More" disabled>More...</option>
            {franchises.slice(8).map(f => (
              <option key={f} value={f} className="bg-surface-card">{f}</option>
            ))}
          </select>
        )}
      </div>

      {/* Advanced Filters Sidebar is handled by FilterSidebar component */}

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 relative">
        {isSelectionMode && selectedIds.length > 0 && (
          <div className="sticky top-0 z-50 bg-xbox-green text-white px-6 py-4 rounded-xl shadow-2xl flex items-center justify-between mb-6 animate-in slide-in-from-top duration-300">
            <div className="flex items-center space-x-4">
              <span className="text-lg font-black">{selectedIds.length} items selected</span>
              <div className="h-6 w-px bg-white/20" />
              <button 
                onClick={() => setSelectedIds(filteredItems.map(i => i.id))}
                className="text-xs font-bold hover:underline"
              >
                Select All Filtered
              </button>
              <button 
                onClick={() => setSelectedIds([])}
                className="text-xs font-bold hover:underline"
              >
                Clear Selection
              </button>
            </div>
            
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setIsBulkEditing(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all text-sm font-bold border border-white/20"
              >
                <Edit2 size={18} />
                <span>Bulk Edit</span>
              </button>
              <button 
                onClick={async () => {
                  const count = await fetchOnlineMetadata(selectedIds);
                  alert(`Updated ${count} items with online metadata.`);
                  setSelectedIds([]);
                  setIsSelectionMode(false);
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all text-sm font-bold border border-white/20"
              >
                <Globe size={18} />
                <span>Fetch Online</span>
              </button>
              <button 
                onClick={() => setIsRenaming(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all text-sm font-bold border border-white/20"
              >
                <Type size={18} />
                <span>Rename</span>
              </button>
              <button 
                onClick={handleBulkStage}
                className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all text-sm font-bold border border-white/20"
              >
                <Package size={18} />
                <span>Stage Selected</span>
              </button>
              <button 
                onClick={handleBulkDelete}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-all text-sm font-bold shadow-lg"
              >
                <Trash2 size={18} />
                <span>Remove</span>
              </button>
            </div>
          </div>
        )}

        {isBulkEditing && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-surface-card border border-surface-border rounded-2xl w-full max-w-md p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold">Bulk Edit Metadata</h3>
                <button onClick={() => setIsBulkEditing(false)} className="text-gray-500 hover:text-white"><X size={24}/></button>
              </div>
              <p className="text-sm text-gray-400">Updating {selectedIds.length} items. Leave fields blank to keep existing values.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">Game Name</label>
                  <input 
                    type="text" 
                    value={bulkEditData.gameName}
                    onChange={(e) => setBulkEditData({...bulkEditData, gameName: e.target.value})}
                    placeholder="E.g. Halo 3"
                    className="w-full bg-surface-panel border border-surface-border rounded-lg px-4 py-2.5 outline-none focus:ring-1 focus:ring-xbox-green"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">Category / Franchise</label>
                  <input 
                    type="text" 
                    value={bulkEditData.category}
                    onChange={(e) => setBulkEditData({...bulkEditData, category: e.target.value})}
                    placeholder="E.g. Halo"
                    className="w-full bg-surface-panel border border-surface-border rounded-lg px-4 py-2.5 outline-none focus:ring-1 focus:ring-xbox-green"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setIsBulkEditing(false)}
                  className="flex-1 px-4 py-3 bg-surface-panel border border-surface-border rounded-xl font-bold hover:bg-surface-card transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleBulkUpdate}
                  className="flex-1 px-4 py-3 bg-xbox-green text-white rounded-xl font-bold hover:bg-xbox-hover transition-all shadow-lg shadow-xbox-green/20"
                >
                  Apply to {selectedIds.length} Items
                </button>
              </div>
            </div>
          </div>
        )}

        <div className={viewMode === 'grid' 
          ? `grid gap-4 ${
              gridDensity === 'compact' ? 'grid-cols-4 md:grid-cols-6 lg:grid-cols-10' :
              gridDensity === 'large' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :
              'grid-cols-2 md:grid-cols-4 lg:grid-cols-6'
            }`
          : "grid grid-cols-1 gap-2"
        }>
          {filteredItems.map(item => (
            <div key={item.id}>
              {viewMode === 'grid' ? (
                <LibraryCard 
                  item={item} 
                  isSelected={selectedIds.includes(item.id)}
                  onSelect={toggleSelection}
                  onOpenHub={setSelectedTitleId}
                  onPreview={setPreviewItem}
                  isSelectionMode={isSelectionMode}
                  hideLabels={!showLabels}
                />
              ) : (
                <div 
                  onClick={() => isSelectionMode && toggleSelection(item.id)}
                  className={`flex items-center p-3 bg-surface-card border rounded-xl hover:border-xbox-green/50 transition-all cursor-pointer group ${
                    selectedIds.includes(item.id) ? 'border-xbox-green bg-xbox-green/5' : 'border-surface-border'
                  }`}
                >
                  <div className="w-12 h-12 bg-surface-panel rounded-lg flex items-center justify-center text-gray-600 group-hover:text-xbox-green transition-colors mr-4">
                    <Package size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold truncate text-white">{item.name}</h4>
                      <span className="text-[10px] text-gray-500 font-mono">{item.metadata.titleId}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-xbox-green font-bold uppercase">{item.metadata.gameName}</span>
                      <span className="text-[10px] text-gray-500 uppercase font-black">{item.type.replace('_', ' ')}</span>
                      <span className="text-[10px] text-gray-500">{(item.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                  </div>
                  {isSelectionMode && (
                    <div className={`ml-4 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      selectedIds.includes(item.id) ? 'bg-xbox-green border-xbox-green' : 'border-white/20'
                    }`}>
                      {selectedIds.includes(item.id) && <X size={12} className="text-white rotate-45" />}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        {filteredItems.length === 0 && (
          <div className="py-20 text-center text-gray-500 italic">No items found matching your filters.</div>
        )}

        {selectedTitleId && (
          <GameHub 
            titleId={selectedTitleId} 
            onClose={() => setSelectedTitleId(null)} 
          />
        )}

        {previewItem && (
          <ContentPreviewer 
            item={previewItem} 
            onClose={() => setPreviewItem(null)} 
          />
        )}

        <FilterSidebar 
          isOpen={showAdvancedFilters}
          onClose={() => setShowAdvancedFilters(false)}
          filters={advancedFilters}
          setFilters={setAdvancedFilters}
          onReset={() => setAdvancedFilters({
            profileId: '',
            consoleId: '',
            titleId: '',
            format: 'All',
            minSize: 0,
            maxSize: 0,
            dateRange: 'All Time'
          })}
        />

        <Modal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          title="Confirm Removal"
          type="warning"
          footer={
            <>
              <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 text-gray-400 hover:text-white font-bold">Cancel</button>
              <button onClick={handleBulkDelete} className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-600/20">Remove {selectedIds.length} Items</button>
            </>
          }
        >
          <div className="space-y-4">
            <p className="text-gray-300">You are about to remove <b>{selectedIds.length}</b> items from your library database.</p>
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex gap-3">
              <AlertTriangle className="text-yellow-500 shrink-0" size={20} />
              <p className="text-xs text-yellow-500/80 leading-relaxed">
                This action only removes the entries from <b>FriieD360 Studio</b>. The actual files on your storage device will remain untouched.
              </p>
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={showOrganizeConfirm}
          onClose={() => setShowOrganizeConfirm(false)}
          title="Organize Library"
          type="info"
          footer={
            <>
              <button onClick={() => setShowOrganizeConfirm(false)} className="px-4 py-2 text-gray-400 hover:text-white font-bold">Cancel</button>
              <button onClick={handleOrganizeLibrary} className="px-6 py-2 bg-xbox-green hover:bg-xbox-hover text-white rounded-xl font-bold shadow-lg shadow-xbox-green/20">Organize {selectedIds.length} Items</button>
            </>
          }
        >
          <div className="space-y-4">
            <p className="text-gray-300">This will move <b>{selectedIds.length}</b> items into a standardized folder structure based on their Title ID and Category.</p>
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex gap-3">
              <Info className="text-blue-400 shrink-0" size={20} />
              <p className="text-xs text-blue-400/80 leading-relaxed">
                Standardized structure: <br/>
                <code className="text-[10px] bg-black/30 px-1 rounded">/Content/0000000000000000/[TitleID]/[Category]/...</code>
              </p>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};
