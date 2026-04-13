import React, { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Loader2, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { ContentType } from '../../types';
import { LibraryCard } from './LibraryCard';

interface LibraryViewProps {
  title: string;
  type: ContentType;
}

export const LibraryView = ({ title, type }: LibraryViewProps) => {
  const { items, isScanning, fetchItems, triggerScan, installedHeuristics } = useStore();
  const [search, setSearch] = useState('');
  const [activeFranchise, setActiveFranchise] = useState('All');
  const [hideInstalled, setHideInstalled] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const franchises = useMemo(() => ['All', ...new Set(items.filter(i => i.type === type).map(i => i.metadata.category))], [items, type]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesType = item.type === type;
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                            item.metadata?.gameName.toLowerCase().includes(search.toLowerCase());
      const matchesFranchise = activeFranchise === 'All' || item.metadata?.category === activeFranchise;
      
      const heuristic = `${item.fileName}_${item.size}`;
      const isInstalled = installedHeuristics.includes(heuristic);
      const matchesInstalledFilter = hideInstalled ? !isInstalled : true;

      return matchesType && matchesSearch && matchesFranchise && matchesInstalledFilter;
    });
  }, [items, type, search, activeFranchise, hideInstalled, installedHeuristics]);

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
        <div>
          <h2 className="text-3xl font-bold">{title}</h2>
          <p className="text-gray-500 mt-1">{filteredItems.length} items discovered</p>
        </div>
        
        <div className="flex items-center space-x-3">
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
            onClick={() => fetchItems()}
            className="p-2 bg-surface-card border border-surface-border rounded-lg hover:border-xbox-green transition-all text-gray-400 hover:text-white"
            title="Sync with database"
          >
            <RefreshCw size={18} />
          </button>

          <button 
            onClick={triggerScan}
            disabled={isScanning}
            className="flex items-center space-x-2 px-4 py-2 bg-surface-card border border-surface-border rounded-lg hover:border-xbox-green transition-all disabled:opacity-50"
          >
            {isScanning ? <Loader2 size={18} className="animate-spin text-xbox-green" /> : <RefreshCw size={18} />}
            <span className="text-sm font-bold">{isScanning ? 'Scanning...' : 'Scan Folders'}</span>
          </button>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${title.toLowerCase()}...`}
              className="bg-surface-input border border-surface-border rounded-lg pl-10 pr-4 py-2 focus:ring-1 focus:ring-xbox-green outline-none w-64 transition-all text-sm"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {franchises.map(f => (
          <button
            key={f}
            onClick={() => setActiveFranchise(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeFranchise === f 
              ? 'bg-xbox-green text-white shadow-lg shadow-xbox-green/20' 
              : 'bg-surface-card text-gray-500 hover:bg-surface-panel'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredItems.map(item => (
            <div key={item.id}>
              <LibraryCard item={item} />
            </div>
          ))}
        </div>
        {filteredItems.length === 0 && (
          <div className="py-20 text-center text-gray-500 italic">No items found matching your filters.</div>
        )}
      </div>
    </div>
  );
};
