import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { AlertCircle, CheckCircle2, ArrowRight, Wrench, ShieldCheck, Loader2 } from 'lucide-react';

export const ExtensionRepair = () => {
  const { items, triggerScan } = useStore();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [repairResults, setRepairResults] = useState<any[] | null>(null);

  const repairableItems = items.filter(i => i.isExtensionless);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleApplyFix = async () => {
    if (selectedIds.length === 0) return;
    setIsProcessing(true);
    
    try {
      const res = await fetch('/api/repair/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIds: selectedIds })
      });
      const data = await res.json();
      setRepairResults(data);
      await triggerScan();
    } catch (err) {
      console.error("Repair failed", err);
    } finally {
      setIsProcessing(false);
      setSelectedIds([]);
    }
  };

  if (repairableItems.length === 0 && !repairResults) {
    return (
      <div className="p-20 flex flex-col items-center justify-center text-gray-500 animate-in fade-in zoom-in-95 duration-700">
        <div className="w-24 h-24 bg-xbox-green/10 rounded-full flex items-center justify-center mb-6">
          <ShieldCheck size={48} className="text-xbox-green" />
        </div>
        <h3 className="text-2xl font-bold text-white">System Optimized</h3>
        <p className="mt-2 text-center max-w-xs">All detected Xbox 360 content files in your library have correct extensions.</p>
        <button 
          onClick={triggerScan}
          className="mt-8 px-6 py-2 bg-surface-card border border-surface-border rounded-lg hover:border-xbox-green transition-all text-sm font-bold"
        >
          Run Deep Scan
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold flex items-center">
            <Wrench className="mr-3 text-xbox-green" /> Extension Repair Tool
          </h2>
          <p className="text-gray-500 mt-1">
            Safely add .CON extensions to Xbox 360 content files.
          </p>
        </div>
        
        {repairableItems.length > 0 && (
          <button 
            onClick={handleApplyFix}
            disabled={selectedIds.length === 0 || isProcessing}
            className="px-6 py-3 bg-xbox-green hover:bg-xbox-hover disabled:bg-surface-card disabled:text-gray-600 rounded-xl font-bold transition-all shadow-lg shadow-xbox-green/20 flex items-center space-x-2"
          >
            {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <ShieldCheck size={20} />}
            <span>Apply Fix to {selectedIds.length} Items</span>
          </button>
        )}
      </header>

      {repairResults && (
        <div className="bg-surface-card border border-surface-border rounded-xl p-4 space-y-2">
            <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400">Last Operation Results</h4>
            <div className="max-h-40 overflow-y-auto custom-scrollbar">
              {repairResults.map((r, i) => (
                  <div key={i} className="flex items-center text-xs space-x-2 py-1">
                      {r.status === 'success' ? <CheckCircle2 size={14} className="text-xbox-green"/> : <AlertCircle size={14} className="text-red-500"/>}
                      <span className="font-mono truncate max-w-[200px]">{r.fileName}</span>
                      <ArrowRight size={12}/>
                      <span className="text-gray-400">{r.status === 'success' ? 'Fixed' : r.error}</span>
                  </div>
              ))}
            </div>
            <button onClick={() => setRepairResults(null)} className="text-[10px] text-xbox-green font-bold mt-2 hover:underline">Clear Results</button>
        </div>
      )}

      <div className="bg-surface-card border border-surface-border rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-panel border-b border-surface-border">
              <th className="p-4 w-10">
                <input 
                  type="checkbox" 
                  checked={selectedIds.length === repairableItems.length && repairableItems.length > 0}
                  onChange={() => setSelectedIds(selectedIds.length === repairableItems.length ? [] : repairableItems.map(i => i.id))}
                  className="rounded border-gray-700 bg-surface-back text-xbox-green focus:ring-xbox-green"
                />
              </th>
              <th className="p-4 text-xs font-bold uppercase text-gray-500">Current Filename</th>
              <th className="p-4 w-10"></th>
              <th className="p-4 text-xs font-bold uppercase text-gray-500">Proposed Filename</th>
            </tr>
          </thead>
          <tbody>
            {repairableItems.map((item) => (
              <tr key={item.id} className="border-b border-surface-border/50 hover:bg-white/5 transition-colors group">
                <td className="p-4">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.includes(item.id)}
                    onChange={() => toggleSelect(item.id)}
                    className="rounded border-gray-700 bg-surface-back text-xbox-green focus:ring-xbox-green"
                  />
                </td>
                <td className="p-4 font-mono text-sm text-red-400">
                  {item.fileName}
                </td>
                <td className="p-4">
                  <ArrowRight size={16} className="text-gray-600 group-hover:text-xbox-green transition-colors" />
                </td>
                <td className="p-4 font-mono text-sm text-xbox-green">
                  {item.fileName}.CON
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
