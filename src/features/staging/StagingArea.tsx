import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { PackageCheck, ArrowRight, Trash2, Play, CheckCircle, AlertCircle, Copy, Folder } from 'lucide-react';

export const StagingArea = () => {
  const { items, stagedIds, settings, removeFromStaging, clearStaging } = useStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);

  const stagedItems = items.filter(i => stagedIds.includes(i.id));

  const handleExecute = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/staging/copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIds: stagedIds })
      });
      const data = await res.json();
      setResults(data);
      if (!data.some((r: any) => r.status === 'error')) clearStaging();
    } catch (err) {
      console.error("Staging failed", err);
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
          <button onClick={clearStaging} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">Clear All</button>
          <button 
            onClick={handleExecute}
            disabled={isProcessing || !settings?.outputFolder || stagedIds.length === 0}
            className="px-8 py-3 bg-xbox-green hover:bg-xbox-hover disabled:bg-surface-card disabled:text-gray-600 rounded-xl font-bold transition-all shadow-lg shadow-xbox-green/20 flex items-center space-x-2"
          >
            {isProcessing ? <Play className="animate-pulse" /> : <Copy size={20} />}
            <span>{isProcessing ? 'Copying Files...' : 'Execute Staging'}</span>
          </button>
        </div>
      </header>

      {!settings?.outputFolder && (
        <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl flex items-center space-x-3 text-red-500">
          <AlertCircle size={20} />
          <p className="text-sm font-bold">Error: No output folder configured in Settings.</p>
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
                    <p className="text-[10px] text-gray-500 truncate max-w-md">{res.dest}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${
                  res.status === 'success' ? 'bg-xbox-green/10 text-xbox-green' : 'bg-gray-500/10 text-gray-400'
                }`}>
                  {res.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-surface-card border border-surface-border rounded-2xl overflow-hidden">
          <div className="p-4 bg-surface-panel border-b border-surface-border flex items-center text-xs font-bold text-gray-500 uppercase tracking-widest">
            <div className="flex-1">Item & Source</div>
            <div className="w-8"></div>
            <div className="flex-1 pl-8">Standardized Destination Path</div>
          </div>
          <div className="divide-y divide-surface-border/50 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {stagedItems.map(item => (
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
                      Content/0000.../{item.metadata.titleId || (item.type === 'avatar_item' ? 'FFED0707' : 'FFFE07D1')}/.../{item.fileName}
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
  );
};
