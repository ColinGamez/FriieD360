import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { PackageCheck, ArrowRight, Trash2, Play, CheckCircle, AlertCircle, Copy, Folder, HardDrive, LayoutList, Network, ShieldCheck } from 'lucide-react';
import { FolderTreePreview } from './FolderTreePreview';
import { UsbExportWizard } from './UsbExportWizard';
import { buildContentRelativePath } from '../../utils/contentPaths';
import { getErrorMessage, readJsonOrThrow } from '../../utils/api';
import { hasEnoughFreeSpace } from '../../utils/storage';
import type { CopyOperationResult } from '../../types';

const getResultStatusClasses = (status: CopyOperationResult['status']) => {
  if (status === 'success') {
    return 'bg-xbox-green/10 text-xbox-green';
  }

  if (status === 'skipped') {
    return 'bg-yellow-500/10 text-yellow-500';
  }

  return 'bg-red-500/10 text-red-500';
};

export const StagingArea = () => {
  const { items, stagedIds, settings, removeFromStaging, clearStaging, setActiveTab, addToast } = useStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<CopyOperationResult[] | null>(null);
  const [freeSpace, setFreeSpace] = useState<number | null>(null);
  const [isCheckingSpace, setIsCheckingSpace] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'tree'>('list');
  const [showWizard, setShowWizard] = useState(false);

  const stagedItems = useMemo(() => items.filter(i => stagedIds.includes(i.id)), [items, stagedIds]);
  const stagedOwnerLabel = settings.profileId && settings.profileId !== '0000000000000000'
    ? settings.profileMappings?.[settings.profileId] || settings.profileId
    : 'Global / All Profiles';
  const stagedPreviewItems = useMemo(() => (
    stagedItems.map((item) => ({
      item,
      relativePath: buildContentRelativePath(item, { contentOwnerId: settings.profileId }),
    }))
  ), [settings.profileId, stagedItems]);
  
  const totalSize = useMemo(() => stagedItems.reduce((acc, i) => acc + i.size, 0), [stagedItems]);

  useEffect(() => {
    if (!settings?.outputFolder) {
      setFreeSpace(null);
      setIsCheckingSpace(false);
      return;
    }

    let cancelled = false;
    setIsCheckingSpace(true);

    fetch(`/api/system/free-space?path=${encodeURIComponent(settings.outputFolder)}`)
      .then((res) => readJsonOrThrow<{ free: number | null }>(res, 'Failed to check available space'))
      .then((data) => {
        if (!cancelled) {
          setFreeSpace(typeof data.free === 'number' ? data.free : null);
        }
      })
      .catch(err => {
        if (!cancelled) {
          console.error("Failed to check free space", err);
          setFreeSpace(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsCheckingSpace(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [settings?.outputFolder]);

  const formatSize = (bytes: number) => {
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const hasEnoughSpace = hasEnoughFreeSpace(freeSpace, totalSize);

  const handleExecute = async () => {
    if (!settings.outputFolder) {
      addToast('Configure an output folder before staging content', 'error');
      setActiveTab('settings');
      return;
    }

    if (!hasEnoughSpace) {
      addToast('The configured output folder does not have enough free space', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch('/api/staging/copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIds: stagedIds, targetProfileId: settings.profileId })
      });
      const data = await readJsonOrThrow<CopyOperationResult[]>(res, 'Failed to stage content');

      setResults(data);
      const successCount = data.filter((result) => result.status === 'success').length;
      const skippedCount = data.filter((result) => result.status === 'skipped').length;
      const errorCount = data.filter((result) => result.status === 'error').length;

      if (errorCount === 0) {
        const suffix = skippedCount > 0 ? ` (${skippedCount} skipped)` : '';
        useStore.getState().addToast(`Quick stage copy completed: ${successCount} copied${suffix}`, 'success');
        clearStaging();
      } else {
        useStore.getState().addToast(`Quick stage copy finished with ${errorCount} errors`, 'error');
      }
    } catch (err) {
      console.error("Staging failed", err);
      useStore.getState().addToast(getErrorMessage(err, 'Staging operation failed'), 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  if (stagedItems.length === 0 && !results) {
    return (
      <div className="p-20 flex flex-col items-center justify-center text-gray-500 border-2 border-dashed border-surface-border m-8 rounded-3xl">
        <PackageCheck size={64} className="opacity-10 mb-4" />
        <h3 className="text-xl font-bold text-white">Queue Empty</h3>
        <p>Go to your library and add items to the staging queue.</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold">Staging Manager</h2>
          <p className="text-gray-500 mt-1">Preparing {stagedItems.length} items for export.</p>
        </div>
        <div className="flex space-x-3">
          <div className="flex flex-col items-end justify-center px-4 border-r border-surface-border mr-2">
            <p className="text-[10px] text-gray-500 uppercase font-black">Total Size</p>
            <p className="text-sm font-bold text-white">{formatSize(totalSize)}</p>
          </div>
          <div className="flex flex-col items-end justify-center px-4 border-r border-surface-border mr-2">
            <p className="text-[10px] text-gray-500 uppercase font-black">Content Owner</p>
            <p className="text-sm font-bold text-white">{stagedOwnerLabel}</p>
          </div>
          <button onClick={clearStaging} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">Clear All</button>
          <button 
            onClick={handleExecute}
            disabled={isProcessing || !settings?.outputFolder || stagedIds.length === 0 || !hasEnoughSpace}
            className="px-6 py-3 bg-surface-card border border-surface-border hover:border-xbox-green disabled:bg-surface-card disabled:text-gray-600 rounded-xl font-bold transition-all flex items-center space-x-2"
          >
            <Play size={18} />
            <span>{isProcessing ? 'Copying...' : 'Quick Stage Copy'}</span>
          </button>
          <button 
            onClick={() => setShowWizard(true)}
            disabled={isProcessing || !settings?.outputFolder || stagedIds.length === 0 || !hasEnoughSpace}
            className="px-8 py-3 bg-xbox-green hover:bg-xbox-hover disabled:bg-surface-card disabled:text-gray-600 rounded-xl font-bold transition-all shadow-lg shadow-xbox-green/20 flex items-center space-x-2"
          >
            <ShieldCheck size={20} />
            <span>Launch Export Wizard</span>
          </button>
        </div>
      </header>

      {settings?.outputFolder && (
        <div className={`p-4 rounded-xl flex items-center justify-between border ${
          hasEnoughSpace ? 'bg-xbox-green/5 border-xbox-green/20 text-xbox-green' : 'bg-red-500/10 border-red-500/50 text-red-500'
        }`}>
          <div className="flex items-center space-x-3">
            <HardDrive size={20} />
            <div>
              <p className="text-xs font-bold">Target: {settings.outputFolder}</p>
              <p className="text-[10px] opacity-70">
                {isCheckingSpace ? 'Checking free space...' : freeSpace !== null ? `${formatSize(freeSpace)} free available` : 'Free-space check unavailable'}
              </p>
            </div>
          </div>
          {!hasEnoughSpace && (
            <div className="flex items-center space-x-2">
              <AlertCircle size={16} />
              <span className="text-xs font-bold uppercase">Insufficient Space</span>
            </div>
          )}
        </div>
      )}

      {!settings?.outputFolder && (
        <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl flex items-center space-x-3 text-red-500">
          <AlertCircle size={20} />
          <p className="text-sm font-bold">Error: No output folder configured in Settings.</p>
          <button
            onClick={() => setActiveTab('settings')}
            className="ml-auto px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-lg text-xs font-bold hover:bg-red-500/20 transition-all"
          >
            Open Settings
          </button>
        </div>
      )}

      {results ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-lg">Execution Report</h4>
            <button onClick={() => setResults(null)} className="text-xbox-green text-sm hover:underline">Start New Session</button>
          </div>
          <div className="grid gap-2 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
            {results.map((res, i) => (
              <div key={i} className="bg-surface-card p-3 rounded-lg flex items-center justify-between border border-surface-border">
                <div className="flex items-center space-x-3">
                  {res.status === 'success' && <CheckCircle className="text-xbox-green" size={18} />}
                  {res.status === 'skipped' && <AlertCircle className="text-yellow-500" size={18} />}
                  {res.status === 'error' && <AlertCircle className="text-red-500" size={18} />}
                  <div>
                    <p className="text-sm font-medium">{res.fileName}</p>
                    <p className="text-[10px] text-gray-500 truncate max-w-md">{res.error || res.dest}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${getResultStatusClasses(res.status)}`}>
                  {res.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Staging Queue</h4>
            <div className="flex bg-surface-card border border-surface-border rounded-lg p-1">
              <button 
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-xbox-green text-white shadow-lg shadow-xbox-green/20' : 'text-gray-500 hover:text-gray-300'}`}
                title="List View"
              >
                <LayoutList size={16} />
              </button>
              <button 
                onClick={() => setViewMode('tree')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'tree' ? 'bg-xbox-green text-white shadow-lg shadow-xbox-green/20' : 'text-gray-500 hover:text-gray-300'}`}
                title="Structure Preview"
              >
                <Network size={16} />
              </button>
            </div>
          </div>

          {viewMode === 'tree' ? (
            <FolderTreePreview items={stagedItems} contentOwnerId={settings.profileId} />
          ) : (
            <div className="bg-surface-card border border-surface-border rounded-2xl overflow-hidden">
              <div className="p-4 bg-surface-panel border-b border-surface-border flex items-center text-xs font-bold text-gray-500 uppercase tracking-widest">
                <div className="flex-1">Item & Source</div>
                <div className="w-8"></div>
                <div className="flex-1 pl-8">Standardized Destination Path</div>
              </div>
              <div className="divide-y divide-surface-border/50 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {stagedPreviewItems.map(({ item, relativePath }) => (
                  <div key={item.id} className="p-4 flex items-center group hover:bg-white/[0.02] transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{item.name}</p>
                      <p className="text-[10px] text-gray-500 truncate">{item.fullPath}</p>
                    </div>
                    
                    <div className="px-4 text-gray-700">
                      <ArrowRight size={20} />
                    </div>

                    <div className="flex-1 min-w-0 pl-4">
                      <div className="flex items-center space-x-2 text-xbox-green/80">
                        <Folder size={14} />
                        <p className="text-[10px] font-mono truncate">
                          {relativePath}
                        </p>
                      </div>
                    </div>

                    <button 
                      onClick={() => removeFromStaging(item.id)}
                      className="ml-4 p-2 text-gray-600 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showWizard && (
        <UsbExportWizard onClose={() => setShowWizard(false)} />
      )}
    </div>
  );
};
