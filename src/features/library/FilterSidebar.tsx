import React from 'react';
import { X, Filter, Calendar, HardDrive, Hash, User, Cpu, Trash2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  filters: {
    profileId: string;
    consoleId: string;
    titleId: string;
    format: string;
    minSize: number;
    maxSize: number;
    dateRange: string;
  };
  setFilters: (filters: any) => void;
  onReset: () => void;
}

export const FilterSidebar = ({ isOpen, onClose, filters, setFilters, onReset }: FilterSidebarProps) => {
  const formats = ['All', 'CON', 'LIVE', 'PIRS', 'GOD', 'XBLA'];
  const dateRanges = ['All Time', 'Last 24 Hours', 'Last 7 Days', 'Last 30 Days', 'Last 90 Days'];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150]"
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-80 bg-surface-card border-l border-surface-border z-[160] shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b border-surface-border flex items-center justify-between bg-surface-panel/50">
              <div className="flex items-center gap-3">
                <Filter className="text-xbox-green" size={20} />
                <h3 className="text-lg font-black text-white uppercase tracking-tight">Advanced Filters</h3>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
              {/* Technical IDs */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-gray-500 tracking-widest flex items-center gap-2">
                  <Hash size={12} /> Technical Identifiers
                </h4>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-bold ml-1">Title ID</label>
                    <input 
                      type="text" 
                      value={filters.titleId}
                      onChange={(e) => setFilters({ ...filters, titleId: e.target.value })}
                      placeholder="e.g. 4D5307E6"
                      className="w-full bg-surface-panel border border-surface-border rounded-lg px-3 py-2 text-xs font-mono outline-none focus:border-xbox-green transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-bold ml-1">Profile ID</label>
                    <input 
                      type="text" 
                      value={filters.profileId}
                      onChange={(e) => setFilters({ ...filters, profileId: e.target.value })}
                      placeholder="e.g. E0000..."
                      className="w-full bg-surface-panel border border-surface-border rounded-lg px-3 py-2 text-xs font-mono outline-none focus:border-xbox-green transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-bold ml-1">Console ID</label>
                    <input 
                      type="text" 
                      value={filters.consoleId}
                      onChange={(e) => setFilters({ ...filters, consoleId: e.target.value })}
                      placeholder="Console Serial..."
                      className="w-full bg-surface-panel border border-surface-border rounded-lg px-3 py-2 text-xs font-mono outline-none focus:border-xbox-green transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Format & Size */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-gray-500 tracking-widest flex items-center gap-2">
                  <HardDrive size={12} /> Format & Size
                </h4>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-bold ml-1">Content Format</label>
                    <div className="grid grid-cols-3 gap-2">
                      {formats.map(f => (
                        <button 
                          key={f}
                          onClick={() => setFilters({ ...filters, format: f })}
                          className={`py-1.5 rounded text-[10px] font-black uppercase border transition-all ${
                            filters.format === f 
                            ? 'bg-xbox-green border-xbox-green text-white shadow-lg shadow-xbox-green/20' 
                            : 'bg-surface-panel border-surface-border text-gray-500 hover:text-gray-300'
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-bold ml-1">Size Range (MB)</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        value={filters.minSize}
                        onChange={(e) => setFilters({ ...filters, minSize: parseInt(e.target.value) || 0 })}
                        placeholder="Min"
                        className="w-full bg-surface-panel border border-surface-border rounded-lg px-3 py-2 text-xs outline-none focus:border-xbox-green transition-all"
                      />
                      <span className="text-gray-600">-</span>
                      <input 
                        type="number" 
                        value={filters.maxSize}
                        onChange={(e) => setFilters({ ...filters, maxSize: parseInt(e.target.value) || 0 })}
                        placeholder="Max"
                        className="w-full bg-surface-panel border border-surface-border rounded-lg px-3 py-2 text-xs outline-none focus:border-xbox-green transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Date Modified */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-gray-500 tracking-widest flex items-center gap-2">
                  <Calendar size={12} /> Date Modified
                </h4>
                <div className="space-y-2">
                  {dateRanges.map(range => (
                    <button 
                      key={range}
                      onClick={() => setFilters({ ...filters, dateRange: range })}
                      className={`w-full text-left px-4 py-2 rounded-lg text-xs font-bold transition-all border ${
                        filters.dateRange === range 
                        ? 'bg-xbox-green/10 border-xbox-green text-xbox-green' 
                        : 'bg-surface-panel border-surface-border text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-surface-border bg-surface-panel/50 flex gap-3">
              <button 
                onClick={onReset}
                className="flex-1 py-2.5 bg-surface-card border border-surface-border rounded-xl text-xs font-bold text-gray-400 hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw size={14} />
                Reset
              </button>
              <button 
                onClick={onClose}
                className="flex-1 py-2.5 bg-xbox-green hover:bg-xbox-hover text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-xbox-green/20"
              >
                Apply Filters
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
