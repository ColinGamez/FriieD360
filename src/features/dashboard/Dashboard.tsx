import React from 'react';
import { Package, Palette, Star, AlertCircle, PackageCheck, RefreshCw } from 'lucide-react';
import { useStore } from '../../store/useStore';

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <div className="bg-surface-card border border-surface-border p-6 rounded-2xl hover:border-xbox-green/40 transition-all group">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">{title}</p>
        <h3 className="text-4xl font-bold mt-2 group-hover:text-white transition-colors">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl bg-opacity-10 ${color}`}>
        <Icon size={24} className={color.replace('bg-', 'text-')} />
      </div>
    </div>
  </div>
);

export const Dashboard = () => {
  const { items, stagedIds, setActiveTab, triggerScan, isScanning } = useStore();
  const [recentLogs, setRecentLogs] = React.useState<any[]>([]);
  
  React.useEffect(() => {
    fetch('/api/logs')
      .then(res => res.json())
      .then(data => setRecentLogs(data.reverse().slice(0, 5)))
      .catch(err => console.error('Failed to fetch logs', err));
  }, [isScanning]);

  const avatarCount = items.filter(i => i.type === 'avatar_item').length;
  const themeCount = items.filter(i => i.type === 'theme').length;
  const favoriteCount = items.filter(i => i.isFavorite).length;
  const repairNeeded = items.filter(i => i.isExtensionless).length;

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold">Welcome, Chief</h2>
          <p className="text-gray-400 mt-1">System is healthy. All source folders are indexed.</p>
        </div>
        <button 
          onClick={() => triggerScan(true)}
          disabled={isScanning}
          className="flex items-center gap-2 px-4 py-2 bg-surface-card border border-surface-border rounded-lg hover:border-xbox-green transition-all disabled:opacity-50 text-sm font-bold"
        >
          <RefreshCw size={16} className={isScanning ? 'animate-spin' : ''} />
          {isScanning ? 'Scanning...' : 'Deep Scan'}
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Avatar Items" value={avatarCount} icon={Package} color="bg-blue-500" />
        <StatCard title="Themes" value={themeCount} icon={Palette} color="bg-purple-500" />
        <StatCard title="Favorites" value={favoriteCount} icon={Star} color="bg-yellow-500" />
        <StatCard title="Repair Needed" value={repairNeeded} icon={AlertCircle} color="bg-red-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-surface-card border border-surface-border rounded-2xl p-6">
            <h4 className="text-lg font-bold mb-4">Recent Items Found</h4>
            <div className="space-y-4">
              {items.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-panel transition-colors border border-transparent hover:border-surface-border">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-surface-panel rounded-lg border border-surface-border flex items-center justify-center">
                      <Package size={20} className="text-gray-500" />
                    </div>
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-gray-500 truncate max-w-xs">{item.parentFolder}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-600">
                    {new Date(item.dateModified).toLocaleDateString()}
                  </span>
                </div>
              ))}
              {items.length === 0 && (
                <div className="py-10 text-center text-gray-500 italic">No items scanned yet.</div>
              )}
            </div>
          </div>

          <div className="bg-surface-card border border-surface-border rounded-2xl p-6">
            <h4 className="text-lg font-bold mb-4">System Events</h4>
            <div className="space-y-3">
              {recentLogs.map((log) => (
                <div key={log.id} className="flex items-start space-x-3 text-sm">
                  <div className={`mt-1 w-1.5 h-1.5 rounded-full ${
                    log.level === 'success' ? 'bg-xbox-green' : 
                    log.level === 'error' ? 'bg-red-500' : 'bg-blue-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-gray-300 leading-tight">{log.message}</p>
                    <p className="text-[10px] text-gray-600 mt-1">{new Date(log.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
              {recentLogs.length === 0 && (
                <p className="text-sm text-gray-600 italic">No recent events.</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="space-y-8">
          <div className="bg-xbox-green/5 border border-xbox-green/20 rounded-2xl p-6 flex flex-col justify-center items-center text-center">
            <PackageCheck size={48} className="text-xbox-green mb-4 opacity-50" />
            <h4 className="text-xl font-bold">Ready to Stage</h4>
            <p className="text-sm text-gray-400 mt-2 mb-6 px-4">
              You have {stagedIds.length} items in your staging queue ready for export.
            </p>
            <button 
              onClick={() => setActiveTab('staging')}
              className="w-full py-3 bg-xbox-green hover:bg-xbox-hover text-white rounded-xl font-bold transition-all shadow-lg shadow-xbox-green/20"
            >
              Go to Staging
            </button>
          </div>

          <div className="bg-surface-card border border-surface-border rounded-2xl p-6">
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Quick Tips</h4>
            <ul className="space-y-3 text-xs text-gray-500">
              <li className="flex gap-2">
                <span className="text-xbox-green">•</span>
                <span>Use the <b>Repair Tool</b> to fix files missing the .CON extension.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-xbox-green">•</span>
                <span>Staged items are copied to your output folder, keeping originals safe.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-xbox-green">•</span>
                <span>Connect your Xbox drive and use <b>USB Export</b> for one-click deployment.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
