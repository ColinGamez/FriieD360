import React, { useState, useEffect } from 'react';
import { History, Info, AlertCircle, CheckCircle2, Trash2, Download } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { useStore } from '../../store/useStore';
import { ActivityLog as ActivityLogEntry } from '../../types';
import { getErrorMessage, readJsonOrThrow } from '../../utils/api';

export const ActivityLog = () => {
  const { addToast } = useStore();
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [showClearModal, setShowClearModal] = useState(false);

  const filteredLogs = logs.filter(l => filter === 'all' || l.level === filter);

  const fetchLogs = () => {
    setIsLoading(true);
    fetch('/api/logs')
      .then(res => readJsonOrThrow<ActivityLogEntry[]>(res, 'Failed to load activity history'))
      .then(data => {
        setLogs([...data].reverse());
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch logs', err);
        addToast(getErrorMessage(err, 'Failed to load activity history'), 'error');
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchLogs();
  }, [addToast]);

  const clearLogs = async () => {
    try {
      const res = await fetch('/api/logs/clear', { method: 'POST' });
      await readJsonOrThrow<{ success: boolean }>(res, 'Failed to clear logs');
      setLogs([]);
      setShowClearModal(false);
      addToast('Activity history cleared', 'success');
    } catch (err) {
      console.error('Failed to clear logs', err);
      addToast(getErrorMessage(err, 'Failed to clear activity history'), 'error');
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
    addToast('Activity log exported', 'success');
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
            {['all', 'info', 'success', 'warn', 'error'].map(f => (
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
            onClick={() => setShowClearModal(true)}
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
                {log.details && (
                  <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">{log.details}</p>
                )}
              </div>
            </div>
          ))}
          {filteredLogs.length === 0 && !isLoading && logs.length === 0 && (
            <div className="py-20 text-center text-gray-500 italic">No activity recorded yet.</div>
          )}
          {filteredLogs.length === 0 && !isLoading && logs.length > 0 && (
            <div className="py-20 text-center text-gray-500 italic">
              No {filter === 'all' ? 'activity entries' : `${filter} entries`} match the current filter.
            </div>
          )}
          {isLoading && (
            <div className="py-20 text-center text-gray-500 italic">Loading history...</div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        title="Clear Activity History"
        type="warning"
        footer={
          <>
            <button onClick={() => setShowClearModal(false)} className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-white">
              Cancel
            </button>
            <button
              onClick={clearLogs}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold transition-all"
            >
              Clear History
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-300">
            This will permanently remove the in-app activity history for scans, fixes, and maintenance actions.
          </p>
          <p className="text-xs text-yellow-500/80">
            Export the log first if you want to keep a record of recent work.
          </p>
        </div>
      </Modal>
    </div>
  );
};
