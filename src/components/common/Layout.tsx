import React from 'react';
import { 
  LayoutDashboard, UserCircle, Layout as LayoutIcon, 
  PackageCheck, History, Settings, ChevronRight, HardDrive, Wrench, FolderHeart, Usb,
  Loader2, Gamepad2, Image, Layers, Search, X, RefreshCw, CheckCircle2, Info, AlertCircle
} from 'lucide-react';
import { ViewID } from '../../types';
import { useStore, Toast } from '../../store/useStore';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarItemProps {
  icon: any;
  label: string;
  active: boolean;
  onClick: () => void;
}

const SidebarItem = ({ icon: Icon, label, active, onClick }: SidebarItemProps) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
      active 
        ? 'bg-xbox-green text-white shadow-lg shadow-xbox-green/20' 
        : 'text-gray-400 hover:bg-surface-card hover:text-white'
    }`}
  >
    <Icon size={20} className={active ? 'text-white' : 'group-hover:text-xbox-green'} />
    <span className="font-medium">{label}</span>
    {active && <ChevronRight size={16} className="ml-auto" />}
  </button>
);

export const AppLayout = ({ activeTab, setActiveTab, children }: { activeTab: ViewID, setActiveTab: (tab: ViewID) => void, children: React.ReactNode }) => {
  const { isScanning, scanProgress, globalSearch, setGlobalSearch, theme, triggerScan, toasts, removeToast, searchHistory, settings } = useStore();
  const [showHistory, setShowHistory] = React.useState(false);
  const hasSourceFolders = settings.sourceFolders.length > 0;
  
  return (
    <div className={`flex h-screen bg-surface-back text-gray-100 overflow-hidden theme-${theme}`} onClick={() => setShowHistory(false)}>
      {/* Theme Background Elements */}
      {theme === 'blades' && (
        <div className="fixed inset-0 pointer-events-none opacity-40 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-32 bg-xbox-green" />
          <div className="absolute top-32 left-0 w-full h-full bg-gradient-to-b from-white to-[#e4e4e4]" />
          <div className="absolute top-0 left-0 w-full h-full flex justify-around items-start pt-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="w-px h-full bg-black/5" />
            ))}
          </div>
        </div>
      )}
      {theme === 'metro' && (
        <div className="fixed inset-0 pointer-events-none opacity-5">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>
      )}

      {/* Toast Container */}
      <div className="fixed top-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl min-w-[280px] ${
                toast.type === 'success' ? 'bg-xbox-green/10 border-xbox-green text-xbox-green' :
                toast.type === 'error' ? 'bg-red-500/10 border-red-500 text-red-500' :
                'bg-surface-card border-surface-border text-white'
              }`}
            >
              {toast.type === 'success' && <CheckCircle2 size={18} />}
              {toast.type === 'error' && <AlertCircle size={18} />}
              {toast.type === 'info' && <Info size={18} />}
              <span className="text-sm font-bold flex-1">{toast.message}</span>
              <button onClick={() => removeToast(toast.id)} className="opacity-50 hover:opacity-100 transition-opacity">
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <aside className="w-64 bg-surface-panel border-r border-surface-border p-6 flex flex-col z-20">
        <div className="mb-12 px-2 flex flex-col items-center">
          <div className="relative w-14 h-14 mb-4 group">
            {/* Outer Sphere - Silver/Grey Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-400 to-gray-600 rounded-full shadow-xl border border-white/20" />
            
            {/* Inner Depth */}
            <div className="absolute inset-1 bg-gradient-to-tl from-gray-700 via-gray-500 to-gray-300 rounded-full" />
            
            {/* Xbox 'X' Glow Effect */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-8 h-8">
                {/* Green Glow behind X */}
                <div className="absolute inset-0 bg-xbox-green blur-[4px] opacity-60 rounded-full" />
                
                {/* The X bars */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-7 bg-xbox-green rotate-45 rounded-full shadow-[0_0_10px_rgba(16,124,16,1)]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-7 bg-xbox-green -rotate-45 rounded-full shadow-[0_0_10px_rgba(16,124,16,1)]" />
                
                {/* Inner X highlight */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-6 bg-white/40 rotate-45 rounded-full" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-6 bg-white/40 -rotate-45 rounded-full" />
              </div>
            </div>
            
            {/* Surface Shine */}
            <div className="absolute top-1 left-3 w-1/2 h-1/3 bg-gradient-to-b from-white/40 to-transparent rounded-full blur-[1px]" />
          </div>

          <div className="text-center">
            <h1 className="text-2xl font-light tracking-tighter text-white leading-none flex items-center justify-center">
              <span className="font-bold text-xbox-green mr-0.5">FriieD</span>360
            </h1>
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.5em] mt-2 ml-1 opacity-80">Studio</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-2">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <div className="pt-4 pb-2 px-4 text-[10px] font-black text-gray-600 uppercase tracking-widest">Library</div>
          <SidebarItem icon={UserCircle} label="Avatar Items" active={activeTab === 'avatar'} onClick={() => setActiveTab('avatar')} />
          <SidebarItem icon={LayoutIcon} label="Themes" active={activeTab === 'themes'} onClick={() => setActiveTab('themes')} />
          <SidebarItem icon={Layers} label="DLC & Content" active={activeTab === 'dlc'} onClick={() => setActiveTab('dlc')} />
          <SidebarItem icon={Image} label="Gamerpics" active={activeTab === 'gamerpics'} onClick={() => setActiveTab('gamerpics')} />
          <SidebarItem icon={Gamepad2} label="Games" active={activeTab === 'games'} onClick={() => setActiveTab('games')} />
          <SidebarItem icon={UserCircle} label="Profiles" active={activeTab === 'profiles'} onClick={() => setActiveTab('profiles')} />
          
          <div className="pt-4 pb-2 px-4 text-[10px] font-black text-gray-600 uppercase tracking-widest">Tools</div>
          <SidebarItem icon={FolderHeart} label="Collections" active={activeTab === 'collections'} onClick={() => setActiveTab('collections')} />
          <SidebarItem icon={PackageCheck} label="Staging Area" active={activeTab === 'staging'} onClick={() => setActiveTab('staging')} />
          <SidebarItem icon={Usb} label="USB Export" active={activeTab === 'usb_export'} onClick={() => setActiveTab('usb_export')} />
          <SidebarItem icon={Wrench} label="Maintenance" active={activeTab === 'repair'} onClick={() => setActiveTab('repair')} />
        </nav>

        <div className="mt-auto pt-6 border-t border-surface-border space-y-1">
          <button 
            onClick={() => {
              if (hasSourceFolders) {
                void triggerScan();
                return;
              }

              setActiveTab('settings');
            }}
            disabled={isScanning}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group hover:bg-xbox-green/10 text-gray-400 hover:text-xbox-green mb-2"
          >
            <RefreshCw size={20} className={`${isScanning ? 'animate-spin text-xbox-green' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
            <span className="text-sm font-bold">{isScanning ? 'Scanning...' : hasSourceFolders ? 'Quick Scan' : 'Add Sources'}</span>
          </button>
          <SidebarItem icon={History} label="Activity" active={activeTab === 'activity'} onClick={() => setActiveTab('activity')} />
          <SidebarItem icon={Settings} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-surface-back relative">
        <header className="h-20 border-b border-surface-border flex items-center justify-between px-8 bg-surface-panel/50 backdrop-blur-md z-10">
          <div className="flex-1 max-w-xl relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-xbox-green transition-colors" size={20} />
            <input 
              type="text" 
              value={globalSearch}
              onFocus={() => setShowHistory(true)}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                setGlobalSearch(e.target.value);
                if (e.target.value && activeTab !== 'library' && activeTab !== 'games' && activeTab !== 'dlc' && activeTab !== 'gamerpics' && activeTab !== 'avatar' && activeTab !== 'themes') {
                  setActiveTab('library');
                }
              }}
              placeholder="Search library, games, title IDs..."
              className="w-full bg-surface-card border border-surface-border rounded-xl py-2.5 pl-12 pr-12 outline-none focus:ring-2 focus:ring-xbox-green/20 focus:border-xbox-green transition-all font-medium text-sm"
            />
            {showHistory && searchHistory.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-surface-card border border-surface-border rounded-xl shadow-2xl z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-2 border-b border-surface-border bg-surface-panel/50">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 px-2">Recent Searches</p>
                </div>
                <div className="p-1">
                  {searchHistory.map((h, i) => (
                    <button
                      key={i}
                      onClick={(e) => {
                        e.stopPropagation();
                        setGlobalSearch(h);
                        setShowHistory(false);
                        if (activeTab !== 'library') setActiveTab('library');
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-xbox-green rounded-lg transition-all flex items-center gap-3"
                    >
                      <History size={14} className="text-gray-600" />
                      {h}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {globalSearch && (
              <button 
                onClick={() => setGlobalSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            )}
          </div>

          <div className="flex items-center space-x-4 ml-8">
            <div className="flex flex-col items-end">
              <p className="text-xs font-bold text-white">System Status</p>
              <p className="text-[10px] text-xbox-green font-bold uppercase">Connected</p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto relative custom-scrollbar">
          {isScanning && (
            <div className="sticky top-0 z-[60] bg-surface-panel/80 backdrop-blur-md border-b border-xbox-green/30 px-8 py-3 animate-in slide-in-from-top duration-300">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <Loader2 size={16} className="animate-spin text-xbox-green" />
                  <span className="text-xs font-bold uppercase tracking-wider text-white">Scanning Library...</span>
                </div>
                <span className="text-[10px] font-mono text-gray-500">
                  {scanProgress.current} / {scanProgress.total} files
                </span>
              </div>
              <div className="h-1.5 w-full bg-surface-border rounded-full overflow-hidden">
                <div 
                  className="h-full bg-xbox-green transition-all duration-500 ease-out shadow-[0_0_10px_rgba(16,124,16,0.5)]"
                  style={{ width: `${(scanProgress.current / (scanProgress.total || 1)) * 100}%` }}
                />
              </div>
              <p className="text-[9px] text-gray-500 mt-1.5 truncate font-mono opacity-60">
                {scanProgress.folder}
              </p>
            </div>
          )}
          <div className="h-1 bg-xbox-green/30 w-full sticky top-0 z-50" />
          {children}
        </div>
      </main>
    </div>
  );
};
