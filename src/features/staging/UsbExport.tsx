import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { Usb, HardDrive, ArrowRight, Play, CheckCircle2, AlertCircle, Loader2, RefreshCw, User } from 'lucide-react';
import { readJsonOrThrow } from '../../utils/api';
import { getAvailableProfileIds, getProfileLabel } from '../../utils/profiles';
import { hasEnoughFreeSpace } from '../../utils/storage';

interface DriveInfo {
  id: string;
  label: string;
  freeSpace: number | null;
}

interface ExportSummary {
  success: number;
  skipped: number;
  error: number;
}

export const UsbExport = () => {
  const { stagedIds, items, clearStaging, settings, addToast, updateSettings } = useStore();
  const [drives, setDrives] = useState<DriveInfo[]>([]);
  const [selectedDrive, setSelectedDrive] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [summary, setSummary] = useState<ExportSummary | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState(settings.profileId || '0000000000000000');
  const availableProfileIds = useMemo(() => getAvailableProfileIds(settings, items), [items, settings]);

  const fetchDrives = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/system/drives');
      const data = await readJsonOrThrow<DriveInfo[]>(res, 'Failed to load drives');
      setDrives(data);
    } catch (err) {
      console.error('Failed to fetch drives', err);
      addToast('Failed to refresh drive list', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDrives();
  }, []);

  useEffect(() => {
    setSelectedProfileId(settings.profileId || '0000000000000000');
  }, [settings.profileId]);

  const formatSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const totalStagedSize = useMemo(() => {
    return items.filter(i => stagedIds.includes(i.id)).reduce((acc, i) => acc + i.size, 0);
  }, [items, stagedIds]);

  const selectedDriveInfo = drives.find(d => d.id === selectedDrive);
  const hasEnoughSpace = hasEnoughFreeSpace(selectedDriveInfo?.freeSpace ?? null, totalStagedSize);

  const handleExport = async () => {
    if (!selectedDrive || !hasEnoughSpace) return;
    setIsExporting(true);
    
    try {
      if ((settings.profileId || '0000000000000000') !== selectedProfileId) {
        await updateSettings({ profileId: selectedProfileId });
      }

      const res = await fetch('/api/export/usb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIds: stagedIds, usbPath: selectedDrive, targetProfileId: selectedProfileId })
      });
      const data = await readJsonOrThrow<ExportSummary>(res, 'USB export failed');

      setSummary(data);
      if (data.success > 0) clearStaging();
      if (data.error > 0) {
        addToast(`USB export finished with ${data.error} errors`, 'error');
      } else {
        addToast('USB export completed successfully', 'success');
      }
    } catch (err) {
      console.error("Export failed", err);
      addToast(err instanceof Error ? err.message : 'USB export failed', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl space-y-8 animate-in fade-in">
      <header>
        <h2 className="text-3xl font-bold flex items-center gap-3">
            <Usb className="text-xbox-green" /> One-Click USB Export
        </h2>
        <p className="text-gray-500 mt-1">Deploy {stagedIds.length} items to your console drive.</p>
      </header>

      {summary ? (
        <div className={`p-8 rounded-3xl text-center space-y-4 border ${summary.error > 0 ? 'bg-surface-card border-yellow-500/30' : 'bg-surface-card border-xbox-green/30'}`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${summary.error > 0 ? 'bg-yellow-500/20 text-yellow-500' : 'bg-xbox-green/20 text-xbox-green'}`}>
                <CheckCircle2 size={32} />
            </div>
            <h3 className="text-2xl font-bold">{summary.error > 0 ? 'Export Finished with Issues' : 'Export Complete'}</h3>
            <div className="flex justify-center gap-8 py-4">
                <div><p className="text-2xl font-bold">{summary.success}</p><p className="text-xs text-gray-500 uppercase">Copied</p></div>
                <div><p className="text-2xl font-bold text-yellow-500">{summary.skipped}</p><p className="text-xs text-gray-500 uppercase">Skipped</p></div>
                {summary.error > 0 && <div><p className="text-2xl font-bold text-red-500">{summary.error}</p><p className="text-xs text-gray-500 uppercase">Errors</p></div>}
            </div>
            <button onClick={() => setSummary(null)} className="px-6 py-2 bg-surface-panel hover:bg-surface-border rounded-lg text-sm transition-all">Start Another Export</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="space-y-4">
                <div className="flex justify-between items-center">
                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">1. Select Target Drive</h4>
                    <button 
                        onClick={fetchDrives}
                        disabled={isRefreshing}
                        className="p-1.5 text-gray-500 hover:text-xbox-green transition-colors rounded-md hover:bg-xbox-green/10"
                        title="Refresh Drives"
                    >
                        <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                    </button>
                </div>
                <div className="space-y-2 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
                    {drives.map(drive => (
                        <button 
                            key={drive.id}
                            onClick={() => setSelectedDrive(drive.id)}
                            className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all ${
                                selectedDrive === drive.id ? 'bg-xbox-green/10 border-xbox-green' : 'bg-surface-card border-surface-border hover:border-gray-600'
                            }`}
                        >
                            <div className="flex items-center gap-3 text-left">
                                <HardDrive className={selectedDrive === drive.id ? 'text-xbox-green' : 'text-gray-500'} />
                                <div>
                                    <p className="font-bold">{drive.label}</p>
                                    <p className="text-xs text-gray-500">
                                      {drive.id} • {typeof drive.freeSpace === 'number' ? `${formatSize(drive.freeSpace)} free` : 'Unknown free space'}
                                    </p>
                                </div>
                            </div>
                            {selectedDrive === drive.id && <CheckCircle2 size={18} className="text-xbox-green" />}
                        </button>
                    ))}
                    {drives.length === 0 && (
                      <div className="p-4 bg-surface-card border border-surface-border rounded-xl text-center text-gray-500 text-sm italic">
                        No removable drives detected.
                      </div>
                    )}
                </div>

                <div className="p-4 bg-surface-card border border-surface-border rounded-xl space-y-3">
                    <div className="flex items-center gap-2 text-sm font-bold">
                      <User size={16} className="text-xbox-green" />
                      <span>Content Owner</span>
                    </div>
                    <select
                      value={selectedProfileId}
                      onChange={(e) => setSelectedProfileId(e.target.value)}
                      className="w-full bg-surface-panel border border-surface-border rounded-lg px-3 py-2 text-sm font-mono outline-none focus:border-xbox-green"
                    >
                      {availableProfileIds.map((id) => (
                        <option key={id} value={id}>
                          {getProfileLabel(id, settings.profileMappings)}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-gray-500">
                      Themes, gamerpics, and avatar items will use this owner folder during export.
                    </p>
                </div>
            </section>

            <section className="bg-surface-card border border-surface-border rounded-3xl p-6 flex flex-col">
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">2. Export Summary</h4>
                <div className="flex-1 space-y-3">
                    <div className="flex justify-between text-sm"><span className="text-gray-500">Items to Copy:</span><span className="font-bold">{stagedIds.length}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-500">Total Size:</span><span className="font-bold">{formatSize(totalStagedSize)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-500">Destination:</span><span className="font-mono text-xbox-green truncate max-w-[150px]">{selectedDrive || 'Not Selected'}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-500">Content Owner:</span><span className="font-mono text-white truncate max-w-[150px]">{getProfileLabel(selectedProfileId, settings.profileMappings)}</span></div>
                    
                    {!hasEnoughSpace && (
                      <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-500 text-xs">
                        <AlertCircle size={14} />
                        <span>Not enough free space on target drive!</span>
                      </div>
                    )}

                    <div className="pt-4 mt-4 border-t border-surface-border">
                        <p className="text-[10px] text-gray-500 uppercase font-black leading-relaxed">
                            Structure: <br/>
                            <span className="text-gray-300 font-mono">/Content/{selectedProfileId}/...</span>
                        </p>
                    </div>
                </div>

                <button 
                    disabled={!selectedDrive || stagedIds.length === 0 || isExporting || !hasEnoughSpace}
                    onClick={handleExport}
                    className="w-full mt-8 py-4 bg-xbox-green hover:bg-xbox-hover disabled:bg-surface-panel disabled:text-gray-600 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-xbox-green/20 flex items-center justify-center gap-3 transition-all"
                >
                    {isExporting ? <Loader2 className="animate-spin" /> : <Play size={20} />}
                    {isExporting ? 'Deploying Content...' : 'Deploy to USB'}
                </button>
            </section>
        </div>
      )}
    </div>
  );
};
