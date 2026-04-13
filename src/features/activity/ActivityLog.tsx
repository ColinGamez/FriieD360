import React, { useState, useEffect } from 'react';
import { History, Info, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react';

export const ActivityLog = () => {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/library') // We'll assume logs are part of a separate endpoint or we fetch them here
      .then(() => {
          // In a real app we'd have /api/logs
          // For now let's mock or fetch from db.json if we can
      });
  }, []);

  return (
    <div className="p-8 space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <History className="text-xbox-green" /> Activity Log
          </h2>
          <p className="text-gray-500">History of system operations and file changes.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-red-500 transition-colors">
            <Trash2 size={18} /> Clear History
        </button>
      </header>

      <div className="bg-surface-card border border-surface-border rounded-2xl overflow-hidden">
        <div className="divide-y divide-surface-border">
          {/* Mocking logs for now as we don't have a dedicated endpoint in the simple server yet */}
          {[
            { id: '1', level: 'success', message: 'Library scan completed successfully.', timestamp: new Date().toISOString() },
            { id: '2', level: 'info', message: 'Added 5 items to staging area.', timestamp: new Date().toISOString() },
            { id: '3', level: 'warn', message: 'Detected 12 extensionless files.', timestamp: new Date().toISOString() },
          ].map(log => (
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
        </div>
      </div>
    </div>
  );
};
