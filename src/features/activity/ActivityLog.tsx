import React, { useState, useEffect } from 'react';
import { History, Info, AlertCircle, CheckCircle2, Trash2, Download } from 'lucide-react';

export const ActivityLog = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  const filteredLogs = logs.filter(l => filter === 'all' || l.level === filter);

  const fetchLogs = () => {
    setIsLoading(true);
    fetch('/api/logs')
      .then(res => res.json())
      .then(data => {
        setLogs(data.reverse()); // Show newest first
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch logs', err);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const clearLogs = async () => {
    if (!confirm('Are you sure you want to clear the activity history?')) return;
    
    try {
      await fetch('/api/logs/clear', { method: 'POST' });
      setLogs([]);
    } catch (err) {
      console.error('Failed to clear logs', err);
    }
  };

  const exportLogs = () => {
    const data = JSON.stringify(logs, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `friied360_activity_log_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8 space-y-6 animate-in fade-in">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <History className="text-xbox-green" /> Activity Log
          </h2>
          <p className="text-gray-500">History of system operations and file changes.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-surface-card border border-surface-border rounded-lg p-1">
            {['all', 'info', 'success', 'error'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${
                  filter === f ? 'bg-xbox-green text-white shadow-lg shadow-xbox-green/20' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <button 
            onClick={exportLogs}
            disabled={logs.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-surface-card border border-surface-border rounded-lg text-xs font-bold text-gray-400 hover:text-white hover:border-xbox-green transition-all disabled:opacity-30"
          >
              <Download size={16} /> Export Log
          </button>
          <button 
            onClick={clearLogs}
            disabled={logs.length === 0}
            className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-30 disabled:hover:text-gray-400"
          >
              <Trash2 size={18} /> Clear History
          </button>
        </div>
      </header>

      <div className="bg-surface-card border border-surface-border rounded-2xl overflow-hidden min-h-[400px]">
        <div className="divide-y divide-surface-border">
          {filteredLogs.map(log => (
            <div key={log.id} className="p-4 flex items-start space-x-4 hover:bg-white/[0.02] transition-colors">
              <div className={`mt-1 ${
                log.level === 'success' ? 'text-xbox-green' : 
                log.level === 'warn' ? 'text-yellow-500' : 
                log.level === 'error' ? 'text-red-500' : 'text-blue-500'
              }`}>
                {log.level === 'success' && <CheckCircle2 size={18} />}
                {log.level === 'warn' && <AlertCircle size={18} />}
                {log.level === 'error' && <AlertCircle size={18} />}
                {log.level === 'info' && <Info size={18} />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{log.message}</p>
                <p className="text-[10px] text-gray-500 mt-1">{new Date(log.timestamp).toLocaleString()}</p>
              </div>
            </div>
          ))}
          {logs.length === 0 && !isLoading && (
            <div className="py-20 text-center text-gray-500 italic">No activity recorded yet.</div>
          )}
          {isLoading && (
            <div className="py-20 text-center text-gray-500 italic">Loading history...</div>
          )}
        </div>
      </div>
    </div>
  );
};
