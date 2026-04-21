import React from 'react';
import { Package, Palette, Star, AlertCircle, PackageCheck, RefreshCw, PieChart as ChartIcon, UserCircle, HardDrive, Loader2, Zap } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
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
  const { items, stagedIds, setActiveTab, triggerScan, isScanning, settings } = useStore();
  const [logs, setLogs] = React.useState<any[]>([]);
  const [sysStatus, setSysStatus] = React.useState<any>(null);
  
  React.useEffect(() => {
    const fetchLogs = () => {
      fetch('/api/logs')
        .then(res => res.json())
        .then(data => setLogs(data.reverse()))
        .catch(err => console.error('Failed to fetch logs', err));
    };

    const fetchStatus = () => {
      fetch('/api/system/status')
        .then(res => res.json())
        .then(data => setSysStatus(data))
        .catch(err => console.error('Failed to fetch system status', err));
    };

    fetchLogs();
    fetchStatus();
    const interval = setInterval(() => {
      fetchStatus();
      fetchLogs();
    }, 10000);
    return () => clearInterval(interval);
  }, [isScanning]);

  const typeDistribution = React.useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach(item => {
      counts[item.type] = (counts[item.type] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ 
      name: name.replace('_', ' ').toUpperCase(), 
      value 
    })).sort((a, b) => b.value - a.value);
  }, [items]);

  const storageDistribution = React.useMemo(() => {
    const sizes: Record<string, number> = {};
    items.forEach(item => {
      sizes[item.type] = (sizes[item.type] || 0) + item.size;
    });
    return Object.entries(sizes).map(([name, value]) => ({ 
      name: name.replace('_', ' ').toUpperCase(), 
      value: Math.round(value / 1024 / 1024) // MB
    })).sort((a, b) => b.value - a.value);
  }, [items]);

  const franchiseData = React.useMemo(() => {
    const data: Record<string, number> = {};
    items.forEach(i => {
      const cat = i.metadata.category || 'Other';
      data[cat] = (data[cat] || 0) + 1;
    });
    return Object.entries(data)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [items]);

  const largestItems = React.useMemo(() => {
    return [...items].sort((a, b) => b.size - a.size).slice(0, 5);
  }, [items]);

  const recentItems = React.useMemo(() => {
    return [...items]
      .sort((a, b) => new Date(b.dateModified).getTime() - new Date(a.dateModified).getTime())
      .slice(0, 5);
  }, [items]);

  const COLORS = ['#107C10', '#0078D4', '#5C2D91', '#D83B01', '#FFB900', '#B4009E', '#00B7C3', '#E81123'];

  const avatarCount = items.filter(i => i.type === 'avatar_item').length;
  const themeCount = items.filter(i => i.type === 'theme').length;
  const profileCount = new Set(items.map(i => i.metadata.technical?.profileId).filter(id => id && id !== '0000000000000000')).size;
  const favoriteCount = items.filter(i => i.isFavorite).length;
  const repairNeeded = items.filter(i => i.isExtensionless).length;
  const missingTech = items.filter(i => !i.metadata.technical || i.metadata.technical.profileId === '0000000000000000').length;
  const unknownTitles = items.filter(i => i.metadata.gameName === 'Unknown Game').length;
  const missingCovers = items.filter(i => !i.metadata.coverUrl).length;
  const healthyItems = items.length - unknownTitles - repairNeeded;
  const healthPercentage = Math.round((healthyItems / (items.length || 1)) * 100);

  const healthData = [
    { name: 'Healthy', value: healthyItems, color: '#107C10' },
    { name: 'Unknown', value: unknownTitles, color: '#D83B01' },
    { name: 'Repair', value: repairNeeded, color: '#E81123' },
  ];

  const [selectedFranchise, setSelectedFranchise] = React.useState<string | null>(null);

  const franchiseBreakdown = React.useMemo(() => {
    if (!selectedFranchise) return [];
    const franchiseItems = items.filter(i => (i.metadata.category || 'Other') === selectedFranchise);
    const counts: Record<string, number> = {};
    franchiseItems.forEach(i => {
      counts[i.type] = (counts[i.type] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ 
      name: name.replace('_', ' ').toUpperCase(), 
      value 
    }));
  }, [items, selectedFranchise]);

  const franchises = React.useMemo(() => {
    return Array.from(new Set(items.map(i => i.metadata.category || 'Other'))).sort();
  }, [items]);

  const profileActivity = React.useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach(item => {
      const pid = item.metadata.technical?.profileId || '0000000000000000';
      if (pid !== '0000000000000000') {
        counts[pid] = (counts[pid] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([id, value]) => ({ 
        name: (settings.profileMappings?.[id] || id.substring(0, 8) + '...'), 
        value 
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [items, settings.profileMappings]);

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
        <StatCard title="Profiles" value={profileCount} icon={UserCircle} color="bg-xbox-green" />
        <StatCard title="Repair Needed" value={repairNeeded} icon={AlertCircle} color="bg-red-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-surface-card border border-surface-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-lg font-bold flex items-center gap-2">
                <ChartIcon size={20} className="text-xbox-green" /> Library Distribution
              </h4>
            </div>
            <div className="h-[300px] w-full">
              {items.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={typeDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {typeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Legend verticalAlign="middle" align="right" layout="vertical" />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500 italic">No data to display</div>
              )}
            </div>
          </div>

          <div className="bg-surface-card border border-surface-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-lg font-bold flex items-center gap-2">
                <HardDrive size={20} className="text-xbox-green" /> Storage Breakdown (MB)
              </h4>
            </div>
            <div className="h-[300px] w-full">
              {items.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={storageDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {storageDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Legend verticalAlign="middle" align="right" layout="vertical" />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500 italic">No data to display</div>
              )}
            </div>
          </div>

          <div className="bg-surface-card border border-surface-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-lg font-bold flex items-center gap-2">
                <Star size={20} className="text-xbox-green" /> Top Franchises
              </h4>
            </div>
            <div className="h-[300px] w-full">
              {items.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={franchiseData} layout="vertical" margin={{ left: 20, right: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={100} 
                      tick={{ fill: '#888', fontSize: 10 }}
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(16, 124, 16, 0.1)' }}
                      contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                      itemStyle={{ color: '#107C10' }}
                    />
                    <Bar dataKey="value" fill="#107C10" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500 italic">No data to display</div>
              )}
            </div>
          </div>

          <div className="bg-surface-card border border-surface-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-lg font-bold flex items-center gap-2">
                <Palette size={20} className="text-xbox-green" /> Franchise Deep Dive
              </h4>
              <select 
                value={selectedFranchise || ''} 
                onChange={(e) => setSelectedFranchise(e.target.value || null)}
                className="bg-surface-panel border border-surface-border rounded-lg px-3 py-1 text-xs font-bold outline-none focus:border-xbox-green transition-all"
              >
                <option value="">Select Franchise...</option>
                {franchises.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div className="h-[300px] w-full">
              {selectedFranchise ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={franchiseBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {franchiseBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[(index + 4) % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Legend verticalAlign="middle" align="right" layout="vertical" />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 italic space-y-2">
                  <ChartIcon size={32} className="opacity-20" />
                  <p className="text-sm">Select a franchise to see content breakdown</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-surface-card border border-surface-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-lg font-bold flex items-center gap-2">
                  <UserCircle size={20} className="text-xbox-green" /> Profile Distribution
                </h4>
              </div>
              <div className="h-[300px] w-full">
                {profileActivity.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={profileActivity} layout="vertical" margin={{ left: 20, right: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" horizontal={false} />
                      <XAxis type="number" hide />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        width={100} 
                        tick={{ fill: '#888', fontSize: 10 }}
                      />
                      <Tooltip 
                        cursor={{ fill: 'rgba(16, 124, 16, 0.1)' }}
                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                        itemStyle={{ color: '#107C10' }}
                      />
                      <Bar dataKey="value" fill="#107C10" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500 italic space-y-2">
                    <UserCircle size={32} className="opacity-20" />
                    <p className="text-sm">No profile-linked content found</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-surface-card border border-surface-border rounded-2xl p-6 flex flex-col">
              <h4 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Zap size={20} className="text-xbox-green" /> Recent Activity
              </h4>
              <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2">
                {logs.slice(0, 6).map((log, idx) => (
                  <div key={idx} className="flex gap-3 relative">
                    {idx !== logs.slice(0, 6).length - 1 && (
                      <div className="absolute left-[11px] top-6 bottom-0 w-px bg-surface-border" />
                    )}
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 ${
                      log.level === 'error' ? 'bg-red-500/20 text-red-500' :
                      log.level === 'success' ? 'bg-xbox-green/20 text-xbox-green' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      <div className="w-2 h-2 rounded-full bg-current" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-200 truncate">{log.message}</p>
                      <p className="text-[10px] text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))}
                {logs.length === 0 && (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-600 italic text-xs">
                    No recent activity
                  </div>
                )}
              </div>
              <button 
                onClick={() => setActiveTab('activity')}
                className="mt-6 w-full py-2 bg-surface-panel border border-surface-border rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-xbox-green hover:text-white transition-all"
              >
                View All Logs
              </button>
            </div>
          </div>

          <div className="bg-surface-card border border-surface-border rounded-2xl p-6">
            <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
              <PackageCheck size={20} className="text-xbox-green" /> Library Health
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-surface-panel border border-surface-border rounded-xl">
                <p className="text-[10px] font-black uppercase text-gray-500">Metadata Accuracy</p>
                <p className={`text-2xl font-bold ${unknownTitles > 0 ? 'text-yellow-500' : 'text-xbox-green'}`}>
                  {Math.round(((items.length - unknownTitles) / (items.length || 1)) * 100)}%
                </p>
              </div>
              <div className="p-4 bg-surface-panel border border-surface-border rounded-xl">
                <p className="text-[10px] font-black uppercase text-gray-500">Integrity Status</p>
                <p className={`text-2xl font-bold ${repairNeeded > 0 ? 'text-red-500' : 'text-xbox-green'}`}>
                  {repairNeeded > 0 ? 'Action Needed' : 'Nominal'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-surface-card border border-surface-border rounded-2xl p-6">
            <h4 className="text-lg font-bold mb-4">Recent Items Found</h4>
            <div className="space-y-4">
              {recentItems.map((item) => (
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
              {recentItems.length === 0 && (
                <div className="py-10 text-center text-gray-500 italic">No items scanned yet.</div>
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
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Smart Collections</h4>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Recent', count: items.filter(i => {
                  const dayAgo = new Date();
                  dayAgo.setDate(dayAgo.getDate() - 1);
                  return new Date(i.dateModified) > dayAgo;
                }).length, color: 'text-blue-400' },
                { label: 'Large', count: items.filter(i => i.size > 1024 * 1024 * 1024).length, color: 'text-purple-400' },
                { label: 'Missing', count: unknownTitles, color: 'text-yellow-500' },
                { label: 'Repair', count: repairNeeded, color: 'text-red-500' },
                { label: 'Favorites', count: favoriteCount, color: 'text-xbox-green' },
                { label: 'Profiles', count: profileCount, color: 'text-cyan-400' }
              ].map(s => (
                <div key={s.label} className="p-3 bg-surface-panel border border-surface-border rounded-xl flex flex-col items-center justify-center text-center">
                  <span className={`text-xl font-bold ${s.color}`}>{s.count}</span>
                  <span className="text-[9px] text-gray-500 uppercase font-black">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface-card border border-surface-border rounded-2xl p-6">
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Largest Items</h4>
            <div className="space-y-3">
              {largestItems.map((item, idx) => (
                <div key={item.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-6 h-6 rounded bg-surface-panel flex items-center justify-center text-[10px] font-bold text-gray-500">
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate group-hover:text-xbox-green transition-colors">{item.metadata.gameName}</p>
                      <p className="text-[10px] text-gray-500 truncate">{item.fileName}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-gray-400">{(item.size / 1024 / 1024).toFixed(0)}MB</span>
                </div>
              ))}
              {largestItems.length === 0 && <p className="text-xs text-gray-600 italic">No items found</p>}
            </div>
          </div>

          <div className="bg-surface-card border border-surface-border rounded-2xl p-6">
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">System Status</h4>
            {sysStatus ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">CPU Load</span>
                  <span className="text-xs font-bold text-white">{sysStatus.cpu}%</span>
                </div>
                <div className="h-1 w-full bg-surface-panel rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: `${sysStatus.cpu}%` }} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">Memory Usage</span>
                  <span className="text-xs font-bold text-white">{sysStatus.memory}%</span>
                </div>
                <div className="h-1 w-full bg-surface-panel rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500" style={{ width: `${sysStatus.memory}%` }} />
                </div>
                <div className="pt-2 flex justify-between text-[9px] text-gray-600 font-bold uppercase">
                  <span>{sysStatus.platform} ({sysStatus.arch})</span>
                  <span>Uptime: {Math.floor(sysStatus.uptime / 3600)}h {Math.floor((sysStatus.uptime % 3600) / 60)}m</span>
                </div>
              </div>
            ) : (
              <div className="h-20 flex items-center justify-center">
                <Loader2 size={20} className="animate-spin text-gray-700" />
              </div>
            )}
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

          <div className="bg-surface-card border border-surface-border rounded-2xl p-6">
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Library Health</h4>
            <div className="flex flex-col items-center">
              <div className="h-48 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={healthData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {healthData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-white">{healthPercentage}%</span>
                  <span className="text-[8px] text-gray-500 uppercase font-black">Healthy</span>
                </div>
              </div>
              <div className="w-full space-y-3 mt-2">
                {healthData.map(d => (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-xs text-gray-400">{d.name}</span>
                    </div>
                    <span className="text-xs font-bold text-white">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
