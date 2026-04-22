import React, { useState, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { Modal } from '../../components/ui/Modal';
import { TitleIdService, TitleInfo } from '../../services/TitleIdService';
import { AlertCircle, CheckCircle2, ArrowRight, Wrench, ShieldCheck, Loader2, Copy, Trash2, FileSearch, X, Hash, Edit2, Filter, Search, RefreshCw, PieChart as ChartIcon, User, AlertTriangle, Info, Zap, ChevronRight, ExternalLink } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { getErrorMessage, readJsonOrThrow } from '../../utils/api';
import type { RepairOperationResult } from '../../types';
import type { RenameOperation } from '../../services/RenameService';

const getRepairSummary = (results: RepairOperationResult[]) => ({
  successCount: results.filter((result) => result.status === 'success').length,
  errorCount: results.filter((result) => result.status === 'error').length,
});

export const ExtensionRepair = () => {
  const { items, triggerScan, bulkDeleteItems, runIntegrityCheck, addToast } = useStore();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [repairResults, setRepairResults] = useState<RepairOperationResult[] | null>(null);
  const [activeTab, setActiveTab] = useState<'extensions' | 'duplicates' | 'integrity' | 'rename' | 'usage' | 'bulk' | 'lookup' | 'health'>('extensions');
  const [renameTemplate, setRenameTemplate] = useState('[TitleID] [GameName] - [Name]');
  const [renamePreview, setRenamePreview] = useState<RenameOperation[] | null>(null);
  const [bulkData, setBulkData] = useState({ gameName: '', category: '' });
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupResults, setLookupResults] = useState<TitleInfo[]>([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showIntegrityModal, setShowIntegrityModal] = useState(false);
  const [showFixModal, setShowFixModal] = useState<string | null>(null);
  const [showRenameConfirmModal, setShowRenameConfirmModal] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const { previewRename, applyRename, bulkUpdateMetadata, resolveDuplicates } = useStore();

  const handleLookup = (q: string) => {
    setLookupQuery(q);
    if (q.length < 2) {
      setLookupResults([]);
      return;
    }
    const results = TitleIdService.search(q);
    setLookupResults(results);
  };

  const repairableItems = items.filter(i => i.isExtensionless);

  const duplicates = useMemo(() => {
    const groups = new Map<string, any[]>();
    items.forEach(item => {
      const key = `${item.metadata.titleId}_${item.size}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    });
    return Array.from(groups.values()).filter(group => group.length > 1);
  }, [items]);

  const franchiseData = useMemo(() => {
    const data: Record<string, number> = {};
    items.forEach(i => {
      const cat = i.metadata.category || 'Other';
      data[cat] = (data[cat] || 0) + i.size;
    });
    return Object.entries(data)
      .map(([name, size]) => ({ name, size: Math.round(size / 1024 / 1024) }))
      .sort((a, b) => b.size - a.size)
      .slice(0, 8);
  }, [items]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleApplyFix = async () => {
    if (selectedIds.length === 0) return;
    setIsProcessing(true);
    
    try {
      const idsToRepair = [...selectedIds];
      const res = await fetch('/api/repair/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIds: idsToRepair })
      });
      const data = await readJsonOrThrow<RepairOperationResult[]>(res, 'Failed to repair selected files');
      setRepairResults(data);

      const { successCount, errorCount } = getRepairSummary(data);
      if (successCount > 0) {
        await triggerScan();
      }

      if (errorCount === 0) {
        addToast(`Repaired ${successCount} file${successCount === 1 ? '' : 's'}`, 'success');
      } else if (successCount > 0) {
        addToast(`Repaired ${successCount} file${successCount === 1 ? '' : 's'}, ${errorCount} failed`, 'error');
      } else {
        addToast('Unable to repair the selected files', 'error');
      }

      setSelectedIds(data.filter((result) => result.status === 'error').map((result) => result.id));
    } catch (err) {
      console.error("Repair failed", err);
      addToast(getErrorMessage(err, 'Repair failed'), 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    setIsProcessing(true);
    await bulkDeleteItems(selectedIds);
    setSelectedIds([]);
    setIsProcessing(false);
  };

  const handleIntegrityCheck = async () => {
    setIsProcessing(true);
    const { removedCount } = await runIntegrityCheck();
    setIsProcessing(false);
    setShowIntegrityModal(false);
    useStore.getState().addToast(`Integrity check complete. Removed ${removedCount} missing items.`, 'success');
  };

  const handleResolveDuplicates = async (strategy: 'keep_newest' | 'keep_oldest' | 'keep_shortest_path') => {
    setIsProcessing(true);
    await resolveDuplicates(strategy);
    setIsProcessing(false);
    setShowDuplicateModal(false);
  };

  const handleApplyRename = async () => {
    if (!renamePreview) return;

    try {
      setIsProcessing(true);
      const renamed = await applyRename(renamePreview);
      if (!renamed) {
        return;
      }
      setRenamePreview(null);
      setShowRenameConfirmModal(false);
      addToast(`Renamed ${renamePreview.length} files`, 'success');
    } catch (err) {
      console.error('Batch rename failed', err);
      addToast('Batch rename failed', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteHealthItem = async () => {
    if (!confirmDeleteId) return;
    await bulkDeleteItems([confirmDeleteId]);
    setConfirmDeleteId(null);
  };

  return (
    <div className="p-8 space-y-6 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold flex items-center">
            <Wrench className="mr-3 text-xbox-green" /> Library Maintenance
          </h2>
          <p className="text-gray-500 mt-1">
            Keep your Xbox 360 library clean, organized, and error-free.
          </p>
        </div>
      </header>

      <div className="flex space-x-1 bg-surface-panel p-1 rounded-xl w-fit">
        <button 
          onClick={() => { setActiveTab('extensions'); setSelectedIds([]); }}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'extensions' ? 'bg-surface-card text-xbox-green shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Extension Repair ({repairableItems.length})
        </button>
        <button 
          onClick={() => { setActiveTab('duplicates'); setSelectedIds([]); }}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'duplicates' ? 'bg-surface-card text-xbox-green shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Duplicate Finder ({duplicates.length})
        </button>
        <button 
          onClick={() => { setActiveTab('integrity'); setSelectedIds([]); }}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'integrity' ? 'bg-surface-card text-xbox-green shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Integrity Check
        </button>
        <button 
          onClick={() => { setActiveTab('rename'); setSelectedIds([]); setRenamePreview(null); }}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'rename' ? 'bg-surface-card text-xbox-green shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Batch Rename
        </button>
        <button 
          onClick={() => { setActiveTab('usage'); setSelectedIds([]); }}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'usage' ? 'bg-surface-card text-xbox-green shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Storage Usage
        </button>
        <button 
          onClick={() => { setActiveTab('bulk'); setSelectedIds([]); }}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'bulk' ? 'bg-surface-card text-xbox-green shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Bulk Metadata
        </button>
        <button 
          onClick={() => { setActiveTab('lookup'); setSelectedIds([]); }}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'lookup' ? 'bg-surface-card text-xbox-green shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Title ID Lookup
        </button>
        <button 
          onClick={() => { setActiveTab('health'); setSelectedIds([]); }}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'health' ? 'bg-surface-card text-xbox-green shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Content Health
        </button>
      </div>

      {activeTab === 'lookup' && (
        <div className="space-y-6 animate-in slide-in-from-bottom duration-300">
          <div className="bg-surface-card border border-surface-border rounded-2xl p-8">
            <div className="max-w-2xl mx-auto space-y-8">
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold">Title ID Database</h3>
                <p className="text-gray-500">Search for games by name or Title ID to verify metadata.</p>
              </div>

              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-xbox-green transition-colors" size={20} />
                <input 
                  type="text" 
                  value={lookupQuery}
                  onChange={(e) => handleLookup(e.target.value)}
                  placeholder="Search game name or 8-digit Title ID..."
                  className="w-full bg-surface-panel border border-surface-border rounded-xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-xbox-green/20 focus:border-xbox-green transition-all font-medium text-lg"
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                {lookupResults.map(result => (
                  <div key={result.id} className="bg-surface-panel border border-surface-border rounded-xl p-4 flex items-center justify-between group hover:border-xbox-green transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-surface-card flex items-center justify-center border border-surface-border group-hover:bg-xbox-green/10 transition-colors">
                        <Hash className="text-xbox-green" size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-white">{result.name}</h4>
                        <p className="text-xs text-gray-500">
                          {[result.franchise, result.releaseYear].filter(Boolean).join(' • ') || 'Xbox 360 Title ID'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-mono font-black text-xbox-green">{result.id}</p>
                      <button 
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(result.id);
                            addToast(`Copied Title ID ${result.id}`, 'success');
                          } catch (err) {
                            console.error('Failed to copy Title ID', err);
                            addToast('Unable to copy Title ID', 'error');
                          }
                        }}
                        className="text-[10px] font-bold text-gray-500 hover:text-white uppercase tracking-widest flex items-center gap-1 ml-auto"
                      >
                        <Copy size={10} /> Copy ID
                      </button>
                    </div>
                  </div>
                ))}
                {lookupQuery.length >= 2 && lookupResults.length === 0 && (
                  <div className="text-center py-12 bg-surface-panel rounded-xl border border-dashed border-surface-border">
                    <p className="text-gray-500 italic">No matches found in local database.</p>
                  </div>
                )}
                {lookupQuery.length < 2 && (
                  <div className="text-center py-12 bg-surface-panel rounded-xl border border-dashed border-surface-border">
                    <p className="text-gray-500 italic">Enter at least 2 characters to search.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'extensions' && (
        <div className="space-y-6">
          {repairableItems.length === 0 && !repairResults ? (
            <div className="py-20 flex flex-col items-center justify-center text-gray-500">
              <ShieldCheck size={48} className="text-xbox-green mb-4" />
              <h3 className="text-xl font-bold text-white">Extensions Optimized</h3>
              <p className="text-sm">All files have correct extensions.</p>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-400">Detected {repairableItems.length} files missing .CON extensions.</p>
                <button 
                  onClick={handleApplyFix}
                  disabled={selectedIds.length === 0 || isProcessing}
                  className="px-6 py-2 bg-xbox-green hover:bg-xbox-hover disabled:opacity-50 rounded-lg font-bold transition-all flex items-center space-x-2"
                >
                  {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                  <span>Apply Fix ({selectedIds.length})</span>
                </button>
              </div>
              
              <div className="bg-surface-card border border-surface-border rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-surface-panel border-b border-surface-border">
                    <tr>
                      <th className="p-4 w-10">
                        <input 
                          type="checkbox" 
                          checked={selectedIds.length === repairableItems.length && repairableItems.length > 0}
                          onChange={() => setSelectedIds(selectedIds.length === repairableItems.length ? [] : repairableItems.map(i => i.id))}
                          className="rounded border-gray-700 bg-surface-back text-xbox-green"
                        />
                      </th>
                      <th className="p-4 text-xs font-bold uppercase text-gray-500">Current Filename</th>
                      <th className="p-4 text-xs font-bold uppercase text-gray-500">Proposed Fix</th>
                    </tr>
                  </thead>
                  <tbody>
                    {repairableItems.map(item => (
                      <tr key={item.id} className="border-b border-surface-border/50 hover:bg-white/5 transition-colors">
                        <td className="p-4">
                          <input 
                            type="checkbox" 
                            checked={selectedIds.includes(item.id)}
                            onChange={() => toggleSelect(item.id)}
                            className="rounded border-gray-700 bg-surface-back text-xbox-green"
                          />
                        </td>
                        <td className="p-4 font-mono text-xs text-red-400">{item.fileName}</td>
                        <td className="p-4 font-mono text-xs text-xbox-green">{item.fileName}.CON</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {repairResults && (
                <div className="bg-surface-card border border-surface-border rounded-2xl overflow-hidden">
                  <div className="bg-surface-panel px-6 py-4 border-b border-surface-border flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white">Repair Report</h4>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                        {getRepairSummary(repairResults).successCount} fixed • {getRepairSummary(repairResults).errorCount} failed
                      </p>
                    </div>
                    <button
                      onClick={() => setRepairResults(null)}
                      className="text-xs font-bold text-gray-500 hover:text-white transition-colors"
                    >
                      Clear Report
                    </button>
                  </div>
                  <div className="max-h-[320px] overflow-y-auto custom-scrollbar divide-y divide-surface-border/50">
                    {repairResults.map((result) => (
                      <div key={`${result.id}-${result.newPath}`} className="p-4 flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-xs font-mono text-white truncate">{result.fileName}</p>
                          <p className="text-[10px] text-gray-500 font-mono truncate">
                            {result.status === 'error' ? result.error || 'Unknown repair error' : result.newFileName}
                          </p>
                        </div>
                        <span className={`shrink-0 px-2 py-1 rounded text-[10px] font-black uppercase ${
                          result.status === 'success'
                            ? 'bg-xbox-green/10 text-xbox-green'
                            : 'bg-red-500/10 text-red-500'
                        }`}>
                          {result.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'duplicates' && (
        <div className="space-y-6">
          {duplicates.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-gray-500">
              <Copy size={48} className="text-xbox-green mb-4" />
              <h3 className="text-xl font-bold text-white">No Duplicates Found</h3>
              <p className="text-sm">Your library is clean of redundant entries.</p>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <p className="text-sm text-gray-400">Found {duplicates.length} groups of potential duplicates.</p>
                  <button 
                    onClick={() => setShowDuplicateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-xbox-green/10 border border-xbox-green/30 text-xbox-green rounded-lg hover:bg-xbox-green/20 transition-all text-xs font-bold"
                  >
                    <Zap size={14} />
                    Auto-Resolve Engine
                  </button>
                </div>
                <button 
                  onClick={handleDeleteSelected}
                  disabled={selectedIds.length === 0 || isProcessing}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg font-bold transition-all flex items-center space-x-2"
                >
                  {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                  <span>Remove Selected ({selectedIds.length})</span>
                </button>
              </div>

              <div className="space-y-4">
                {duplicates.map((group, idx) => (
                  <div key={idx} className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
                    <div className="bg-surface-panel px-4 py-2 border-b border-surface-border flex justify-between items-center">
                      <span className="text-xs font-bold text-xbox-green uppercase tracking-wider">{group[0].metadata.gameName || 'Unknown Game'}</span>
                      <span className="text-[10px] text-gray-500 font-mono">{group[0].metadata.titleId} • {(group[0].size / 1024 / 1024).toFixed(1)} MB</span>
                    </div>
                    <div className="divide-y divide-surface-border/50">
                      {group.map(item => (
                        <div key={item.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                          <div className="flex items-center space-x-4 flex-1 min-w-0">
                            <input 
                              type="checkbox" 
                              checked={selectedIds.includes(item.id)}
                              onChange={() => toggleSelect(item.id)}
                              className="rounded border-gray-700 bg-surface-back text-xbox-green"
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-bold truncate">{item.fileName}</p>
                              <p className="text-[10px] text-gray-500 truncate font-mono">{item.fullPath}</p>
                            </div>
                          </div>
                          <span className="text-[10px] bg-surface-panel px-2 py-1 rounded border border-surface-border text-gray-400 ml-4">
                            {new Date(item.dateModified).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'integrity' && (
        <div className="py-20 flex flex-col items-center justify-center text-gray-500 space-y-6">
          <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center">
            <FileSearch size={48} className="text-blue-400" />
          </div>
          <div className="text-center max-w-md">
            <h3 className="text-2xl font-bold text-white">Integrity Check</h3>
            <p className="mt-2">This will verify that every item in your library still exists on your disk. Missing items will be removed from the database.</p>
          </div>
          <button 
            onClick={() => setShowIntegrityModal(true)}
            disabled={isProcessing}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 flex items-center space-x-3"
          >
            {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <ShieldCheck size={20} />}
            <span>Run Integrity Check</span>
          </button>
        </div>
      )}
      {activeTab === 'rename' && (
        <div className="space-y-6">
          <div className="bg-surface-card border border-surface-border rounded-2xl p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-lg font-bold">Rename Template</h4>
                <p className="text-sm text-gray-500">Define how your files should be renamed. Use placeholders to insert metadata.</p>
                <input 
                  type="text" 
                  value={renameTemplate}
                  onChange={(e) => setRenameTemplate(e.target.value)}
                  className="w-full bg-surface-panel border border-surface-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-xbox-green/20 focus:border-xbox-green font-mono text-sm"
                />
                <div className="flex flex-wrap gap-2">
                  {['[TitleID]', '[GameName]', '[Name]', '[Category]', '[ProfileID]'].map(tag => (
                    <button 
                      key={tag}
                      onClick={() => setRenameTemplate(prev => prev + tag)}
                      className="px-2 py-1 bg-surface-panel border border-surface-border rounded text-[10px] font-bold text-gray-400 hover:text-xbox-green hover:border-xbox-green transition-all"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-surface-panel rounded-xl p-4 border border-surface-border space-y-3">
                <h5 className="text-xs font-black uppercase text-gray-500">Template Guide</h5>
                <ul className="text-xs space-y-2 text-gray-400">
                  <li><span className="text-xbox-green font-bold">[TitleID]</span> - 8-char hex (e.g. 4D5307E6)</li>
                  <li><span className="text-xbox-green font-bold">[GameName]</span> - Derived game title (e.g. Halo 3)</li>
                  <li><span className="text-xbox-green font-bold">[Name]</span> - Current filename without extension</li>
                  <li><span className="text-xbox-green font-bold">[Category]</span> - Franchise or content type</li>
                  <li><span className="text-xbox-green font-bold">[ProfileID]</span> - 16-char profile hex</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4 border-t border-surface-border">
              <button 
                onClick={async () => {
                  setIsProcessing(true);
                  const preview = await previewRename(items.map(i => i.id), renameTemplate);
                  setRenamePreview(preview);
                  setIsProcessing(false);
                }}
                disabled={isProcessing}
                className="px-6 py-2 bg-surface-panel border border-surface-border rounded-lg font-bold hover:border-xbox-green transition-all"
              >
                Preview All
              </button>
              <button 
                onClick={() => setShowRenameConfirmModal(true)}
                disabled={!renamePreview || isProcessing}
                className="px-6 py-2 bg-xbox-green hover:bg-xbox-hover disabled:opacity-50 rounded-lg font-bold transition-all flex items-center space-x-2 shadow-lg shadow-xbox-green/20"
              >
                {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                <span>Apply Rename</span>
              </button>
            </div>
          </div>

          {renamePreview && (
            <div className="bg-surface-card border border-surface-border rounded-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
              <div className="bg-surface-panel px-6 py-4 border-b border-surface-border flex justify-between items-center">
                <h4 className="font-bold">Rename Preview ({renamePreview.length} items)</h4>
                <button onClick={() => setRenamePreview(null)} className="text-gray-500 hover:text-white"><X size={20}/></button>
              </div>
              <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-left">
                  <thead className="bg-surface-panel/50 text-[10px] font-black uppercase text-gray-500 sticky top-0">
                    <tr>
                      <th className="p-4">Original Filename</th>
                      <th className="p-4 w-10 text-center"><ArrowRight size={14} /></th>
                      <th className="p-4">New Filename</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border/30">
                    {renamePreview.map((op, idx) => (
                      <tr key={idx} className="hover:bg-white/5 transition-colors">
                        <td className="p-4 text-xs font-mono text-gray-500 truncate max-w-[300px]">{op.fileName}</td>
                        <td className="p-4 text-center"><ArrowRight size={14} className="text-xbox-green inline" /></td>
                        <td className="p-4 text-xs font-mono text-white truncate max-w-[300px]">{op.newFileName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
      {activeTab === 'usage' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-surface-card border border-surface-border rounded-2xl p-6 space-y-6">
              <h4 className="text-lg font-bold flex items-center gap-2">
                <Hash className="text-xbox-green" /> Space by Category
              </h4>
              <div className="space-y-4">
                {['game', 'dlc', 'theme', 'gamerpic', 'avatar_item'].map(type => {
                  const typeItems = items.filter(i => i.type === type);
                  const totalSize = typeItems.reduce((acc, i) => acc + i.size, 0);
                  const percentage = (totalSize / (items.reduce((acc, i) => acc + i.size, 0) || 1)) * 100;
                  
                  return (
                    <div key={type} className="space-y-2">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="capitalize text-gray-400">{type.replace('_', ' ')}</span>
                        <span className="text-white">{(totalSize / 1024 / 1024 / 1024).toFixed(2)} GB</span>
                      </div>
                      <div className="h-2 bg-surface-panel rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-xbox-green transition-all duration-1000" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-surface-card border border-surface-border rounded-2xl p-6 space-y-6">
              <h4 className="text-lg font-bold flex items-center gap-2">
                <AlertCircle className="text-yellow-500" /> Top 10 Largest Files
              </h4>
              <div className="space-y-3">
                {[...items].sort((a, b) => b.size - a.size).slice(0, 10).map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-surface-panel rounded-xl border border-surface-border/50">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold truncate">{item.name}</p>
                      <p className="text-[10px] text-gray-500 truncate font-mono">{item.metadata.titleId}</p>
                    </div>
                    <span className="text-xs font-mono text-xbox-green ml-4">{(item.size / 1024 / 1024).toFixed(1)} MB</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-surface-card border border-surface-border rounded-2xl p-6">
            <h4 className="text-lg font-bold mb-6 flex items-center gap-2">
              <ChartIcon className="text-xbox-green" size={20} /> Franchise Distribution (MB)
            </h4>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={franchiseData} layout="vertical" margin={{ left: 40, right: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={100} 
                    tick={{ fill: '#888', fontSize: 10 }}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(16, 124, 16, 0.1)' }}
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                    itemStyle={{ color: '#107C10' }}
                  />
                  <Bar dataKey="size" fill="#107C10" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
      {activeTab === 'bulk' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface-card border border-surface-border rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Edit2 className="text-xbox-green" size={20} /> Bulk Update Values
              </h3>
              <p className="text-sm text-gray-500">Apply these values to all selected items below.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">Game Name</label>
                  <input 
                    type="text" 
                    value={bulkData.gameName}
                    onChange={(e) => setBulkData({...bulkData, gameName: e.target.value})}
                    placeholder="E.g. Halo 3"
                    className="w-full bg-surface-panel border border-surface-border rounded-lg px-4 py-2.5 outline-none focus:ring-1 focus:ring-xbox-green"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">Category / Franchise</label>
                  <input 
                    type="text" 
                    value={bulkData.category}
                    onChange={(e) => setBulkData({...bulkData, category: e.target.value})}
                    placeholder="E.g. Halo"
                    className="w-full bg-surface-panel border border-surface-border rounded-lg px-4 py-2.5 outline-none focus:ring-1 focus:ring-xbox-green"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={async () => {
                    if (selectedIds.length === 0) return;
                    setIsProcessing(true);
                    await bulkUpdateMetadata(selectedIds, bulkData);
                    setIsProcessing(false);
                    setSelectedIds([]);
                    setBulkData({ gameName: '', category: '' });
                  }}
                  disabled={selectedIds.length === 0 || isProcessing || (!bulkData.gameName && !bulkData.category)}
                  className="flex-1 py-3 bg-xbox-green hover:bg-xbox-hover disabled:opacity-50 rounded-xl font-bold transition-all shadow-lg shadow-xbox-green/20"
                >
                  {isProcessing ? 'Applying...' : `Apply to ${selectedIds.length} Items`}
                </button>
                <button 
                  onClick={async () => {
                    if (selectedIds.length === 0) return;
                    setIsProcessing(true);
                    await useStore.getState().bulkAutoFixMetadata(selectedIds);
                    setIsProcessing(false);
                    setSelectedIds([]);
                  }}
                  disabled={selectedIds.length === 0 || isProcessing}
                  className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20"
                  title="Auto-fix metadata based on Title ID"
                >
                  <RefreshCw size={20} className={isProcessing ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            <div className="bg-surface-card border border-surface-border rounded-2xl p-6">
              <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                <Filter className="text-xbox-green" size={20} /> Selection Helper
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => {
                    const unknown = items.filter(i => i.metadata.gameName === 'Unknown Game').map(i => i.id);
                    setSelectedIds(unknown);
                  }}
                  className="p-3 bg-surface-panel border border-surface-border rounded-lg text-xs font-bold hover:border-xbox-green transition-all"
                >
                  Select All "Unknown Games"
                </button>
                <button 
                  onClick={() => {
                    const missing = items.filter(i => !i.metadata.technical?.profileId).map(i => i.id);
                    setSelectedIds(missing);
                  }}
                  className="p-3 bg-surface-panel border border-surface-border rounded-lg text-xs font-bold hover:border-xbox-green transition-all"
                >
                  Select Missing Tech Info
                </button>
                <button 
                  onClick={() => setSelectedIds(items.map(i => i.id))}
                  className="p-3 bg-surface-panel border border-surface-border rounded-lg text-xs font-bold hover:border-xbox-green transition-all"
                >
                  Select Entire Library
                </button>
                <button 
                  onClick={() => setSelectedIds([])}
                  className="p-3 bg-surface-panel border border-surface-border rounded-lg text-xs font-bold hover:text-red-500 transition-all"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>

          <div className="bg-surface-card border border-surface-border rounded-2xl overflow-hidden">
            <div className="p-4 bg-surface-panel border-b border-surface-border flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">Library Items ({items.length})</h3>
              <div className="relative w-48">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input 
                  type="text" 
                  placeholder="Filter list..."
                  className="w-full bg-surface-back border border-surface-border rounded-md pl-8 pr-3 py-1 text-[10px] outline-none focus:border-xbox-green"
                />
              </div>
            </div>
            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-left">
                <thead className="bg-surface-panel/50 sticky top-0 z-10">
                  <tr>
                    <th className="p-3 w-10"></th>
                    <th className="p-3 text-[10px] font-black uppercase text-gray-500">Name</th>
                    <th className="p-3 text-[10px] font-black uppercase text-gray-500">Title ID</th>
                    <th className="p-3 text-[10px] font-black uppercase text-gray-500">Game Name</th>
                    <th className="p-3 text-[10px] font-black uppercase text-gray-500">Category</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border/50">
                  {items.map(item => (
                    <tr 
                      key={item.id} 
                      onClick={() => toggleSelect(item.id)}
                      className={`hover:bg-white/5 transition-colors cursor-pointer ${selectedIds.includes(item.id) ? 'bg-xbox-green/5' : ''}`}
                    >
                      <td className="p-3">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                          selectedIds.includes(item.id) ? 'bg-xbox-green border-xbox-green' : 'border-gray-700'
                        }`}>
                          {selectedIds.includes(item.id) && <CheckCircle2 size={10} className="text-white" />}
                        </div>
                      </td>
                      <td className="p-3 text-xs font-medium truncate max-w-[200px]">{item.name}</td>
                      <td className="p-3 text-[10px] font-mono text-gray-500">{item.metadata.titleId}</td>
                      <td className="p-3 text-xs text-xbox-green font-bold">{item.metadata.gameName}</td>
                      <td className="p-3 text-xs text-gray-400">{item.metadata.category}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {activeTab === 'health' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-surface-card border border-surface-border rounded-2xl p-6 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                <AlertCircle size={24} />
              </div>
              <div>
                <h4 className="font-bold">Unknown Games</h4>
                <p className="text-xs text-gray-500 mt-1">Items with generic or missing game titles.</p>
              </div>
              <p className="text-3xl font-black text-white">
                {items.filter(i => i.metadata.gameName === 'Unknown Game').length}
              </p>
            </div>
            <div className="bg-surface-card border border-surface-border rounded-2xl p-6 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                <User size={24} />
              </div>
              <div>
                <h4 className="font-bold">Missing Profile IDs</h4>
                <p className="text-xs text-gray-500 mt-1">Items not linked to a specific Xbox profile.</p>
              </div>
              <p className="text-3xl font-black text-white">
                {items.filter(i => !i.metadata.technical?.profileId || i.metadata.technical?.profileId === '0000000000000000').length}
              </p>
            </div>
            <div className="bg-surface-card border border-surface-border rounded-2xl p-6 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-xbox-green/10 flex items-center justify-center text-xbox-green">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h4 className="font-bold">Healthy Items</h4>
                <p className="text-xs text-gray-500 mt-1">Items with complete metadata and valid paths.</p>
              </div>
              <p className="text-3xl font-black text-white">
                {items.filter(i => i.metadata.gameName !== 'Unknown Game' && i.metadata.technical?.profileId).length}
              </p>
            </div>
          </div>

          <div className="bg-surface-card border border-surface-border rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-surface-border flex items-center justify-between">
              <h3 className="text-lg font-bold">Health Issues List</h3>
              <button 
                onClick={async () => {
                  setIsProcessing(true);
                  const unknownIds = items.filter(i => i.metadata.gameName === 'Unknown Game').map(i => i.id);
                  if (unknownIds.length > 0) {
                    await useStore.getState().bulkAutoFixMetadata(unknownIds);
                  }
                  setIsProcessing(false);
                }}
                disabled={isProcessing}
                className="px-4 py-2 bg-xbox-green hover:bg-xbox-hover text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2"
              >
                <RefreshCw size={14} className={isProcessing ? 'animate-spin' : ''} />
                Auto-Fix All Issues
              </button>
            </div>
            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-left">
                <thead className="bg-surface-panel/50 sticky top-0 z-10">
                  <tr>
                    <th className="p-4 text-[10px] font-black uppercase text-gray-500">Item</th>
                    <th className="p-4 text-[10px] font-black uppercase text-gray-500">Issue</th>
                    <th className="p-4 text-[10px] font-black uppercase text-gray-500">Severity</th>
                    <th className="p-4 text-[10px] font-black uppercase text-gray-500">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border/50">
                  {items.filter(i => i.metadata.gameName === 'Unknown Game' || !i.metadata.technical?.profileId).map(item => (
                    <tr key={item.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <p className="text-xs font-bold text-white">{item.name}</p>
                        <p className="text-[10px] text-gray-500 font-mono">{item.metadata.titleId}</p>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          {item.metadata.gameName === 'Unknown Game' && (
                            <span className="text-[10px] text-yellow-500 font-bold flex items-center gap-1">
                              <AlertCircle size={10} /> Missing Game Title
                            </span>
                          )}
                          {!item.metadata.technical?.profileId && (
                            <span className="text-[10px] text-blue-400 font-bold flex items-center gap-1">
                              <User size={10} /> Missing Profile ID
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                          item.metadata.gameName === 'Unknown Game' ? 'bg-red-500/20 text-red-500' : 'bg-yellow-500/20 text-yellow-500'
                        }`}>
                          {item.metadata.gameName === 'Unknown Game' ? 'Critical' : 'Moderate'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => setShowFixModal(item.id)}
                            className="p-2 bg-xbox-green/10 text-xbox-green hover:bg-xbox-green hover:text-white rounded-lg transition-all"
                            title="Fix Metadata"
                          >
                            <Wrench size={14} />
                          </button>
                          <button 
                            onClick={() => setConfirmDeleteId(item.id)}
                            className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                            title="Delete Item"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showFixModal && (
        <Modal
          isOpen={!!showFixModal}
          onClose={() => setShowFixModal(null)}
          title="Fix Item Metadata"
          footer={
            <button 
              onClick={() => setShowFixModal(null)}
              className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-white"
            >
              Close
            </button>
          }
        >
          <div className="space-y-6">
            {(() => {
              const item = items.find(i => i.id === showFixModal);
              if (!item) return null;
              const suggested = TitleIdService.getById(item.metadata.titleId);
              
              return (
                <>
                  <div className="p-4 bg-surface-panel rounded-xl border border-surface-border">
                    <p className="text-[10px] font-black uppercase text-gray-500 mb-2">Current Item</p>
                    <p className="text-sm font-bold">{item.name}</p>
                    <p className="text-xs text-xbox-green font-mono">{item.metadata.titleId}</p>
                  </div>

                  {suggested ? (
                    <div className="p-4 bg-xbox-green/5 border border-xbox-green/30 rounded-xl space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-xbox-green rounded-lg text-white">
                          <CheckCircle2 size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase text-xbox-green">Suggested Match</p>
                          <p className="text-lg font-bold">{suggested.name}</p>
                          <p className="text-xs text-gray-400">{suggested.franchise} • {suggested.releaseYear}</p>
                        </div>
                      </div>
                      <button 
                        onClick={async () => {
                          setIsProcessing(true);
                          await bulkUpdateMetadata([item.id], { 
                            gameName: suggested.name, 
                            category: suggested.franchise 
                          });
                          setIsProcessing(false);
                          setShowFixModal(null);
                        }}
                        className="w-full py-3 bg-xbox-green hover:bg-xbox-hover text-white rounded-xl font-bold transition-all shadow-lg shadow-xbox-green/20 flex items-center justify-center gap-2"
                      >
                        <Zap size={18} /> Apply Suggested Metadata
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 bg-yellow-500/5 border border-yellow-500/30 rounded-xl space-y-4">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="text-yellow-500" size={24} />
                        <p className="text-sm font-bold">No automatic match found for Title ID {item.metadata.titleId}.</p>
                      </div>
                      <p className="text-xs text-gray-500">You can manually search the database below to find the correct game.</p>
                      
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                        <input 
                          type="text"
                          placeholder="Search database..."
                          className="w-full bg-surface-panel border border-surface-border rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:border-xbox-green"
                          onChange={(e) => handleLookup(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                        {lookupResults.slice(0, 5).map(res => (
                          <button 
                            key={res.id}
                            onClick={async () => {
                              setIsProcessing(true);
                              await bulkUpdateMetadata([item.id], { 
                                gameName: res.name, 
                                category: res.franchise 
                              });
                              setIsProcessing(false);
                              setShowFixModal(null);
                            }}
                            className="w-full p-3 bg-surface-panel hover:bg-surface-border rounded-lg text-left flex justify-between items-center group transition-all"
                          >
                            <div>
                              <p className="text-xs font-bold group-hover:text-xbox-green">{res.name}</p>
                              <p className="text-[10px] text-gray-500">{res.franchise}</p>
                            </div>
                            <span className="text-[10px] font-mono text-gray-400">{res.id}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </Modal>
      )}

      <Modal
        isOpen={showDuplicateModal}
        onClose={() => setShowDuplicateModal(false)}
        title="Auto-Resolve Duplicates"
        type="warning"
        footer={
          <button onClick={() => setShowDuplicateModal(false)} className="px-4 py-2 text-gray-400 hover:text-white font-bold">Cancel</button>
        }
      >
        <div className="space-y-6">
          <p className="text-sm text-gray-300 leading-relaxed">
            Select a strategy to automatically resolve duplicate entries in your library. 
            This will remove redundant database entries but <b>will not delete files from your disk</b>.
          </p>
          <div className="grid grid-cols-1 gap-3">
            <button 
              onClick={() => handleResolveDuplicates('keep_shortest_path')}
              className="p-4 bg-surface-panel border border-surface-border rounded-xl hover:border-xbox-green transition-all text-left flex items-center justify-between group"
            >
              <div>
                <p className="font-bold text-white group-hover:text-xbox-green transition-colors">Keep Shortest Path</p>
                <p className="text-[10px] text-gray-500">Preserves the item with the cleanest directory structure.</p>
              </div>
              <ChevronRight size={16} className="text-gray-600 group-hover:text-xbox-green" />
            </button>
            <button 
              onClick={() => handleResolveDuplicates('keep_newest')}
              className="p-4 bg-surface-panel border border-surface-border rounded-xl hover:border-xbox-green transition-all text-left flex items-center justify-between group"
            >
              <div>
                <p className="font-bold text-white group-hover:text-xbox-green transition-colors">Keep Newest</p>
                <p className="text-[10px] text-gray-500">Preserves the item with the most recent modification date.</p>
              </div>
              <ChevronRight size={16} className="text-gray-600 group-hover:text-xbox-green" />
            </button>
            <button 
              onClick={() => handleResolveDuplicates('keep_oldest')}
              className="p-4 bg-surface-panel border border-surface-border rounded-xl hover:border-xbox-green transition-all text-left flex items-center justify-between group"
            >
              <div>
                <p className="font-bold text-white group-hover:text-xbox-green transition-colors">Keep Oldest</p>
                <p className="text-[10px] text-gray-500">Preserves the original item based on modification date.</p>
              </div>
              <ChevronRight size={16} className="text-gray-600 group-hover:text-xbox-green" />
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showRenameConfirmModal}
        onClose={() => setShowRenameConfirmModal(false)}
        title="Apply Batch Rename"
        type="warning"
        footer={
          <>
            <button onClick={() => setShowRenameConfirmModal(false)} className="px-4 py-2 text-gray-400 hover:text-white font-bold">Cancel</button>
            <button
              onClick={handleApplyRename}
              className="px-6 py-2 bg-xbox-green hover:bg-xbox-hover text-white rounded-xl font-bold shadow-lg shadow-xbox-green/20"
            >
              Rename Files
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-300">
            Apply the current rename preview to <b>{renamePreview?.length || 0}</b> files on disk.
          </p>
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex gap-3">
            <AlertTriangle className="text-yellow-500 shrink-0" size={20} />
            <p className="text-xs text-yellow-500/80 leading-relaxed">
              This changes real filenames on disk. Review the preview list before continuing.
            </p>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        title="Delete Library Item"
        type="warning"
        footer={
          <>
            <button onClick={() => setConfirmDeleteId(null)} className="px-4 py-2 text-gray-400 hover:text-white font-bold">Cancel</button>
            <button
              onClick={handleDeleteHealthItem}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-600/20"
            >
              Remove Item
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-300">
            Remove <b>{items.find(i => i.id === confirmDeleteId)?.name || 'this item'}</b> from the FriieD360 library index.
          </p>
          <p className="text-xs text-yellow-500/80">
            This does not delete the underlying file from your disk.
          </p>
        </div>
      </Modal>

      <Modal
        isOpen={showIntegrityModal}
        onClose={() => setShowIntegrityModal(false)}
        title="Confirm Integrity Check"
        type="info"
        footer={
          <>
            <button onClick={() => setShowIntegrityModal(false)} className="px-4 py-2 text-gray-400 hover:text-white font-bold">Cancel</button>
            <button onClick={handleIntegrityCheck} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20">Start Check</button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-300">This process will scan all <b>{items.length}</b> items in your library to verify their presence on disk.</p>
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex gap-3">
            <Info className="text-blue-400 shrink-0" size={20} />
            <p className="text-xs text-blue-400/80 leading-relaxed">
              Items that are no longer accessible (e.g. on a disconnected drive) will be removed from the library view.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};
