import React from 'react';
import { 
  LayoutDashboard, UserCircle, Layout as LayoutIcon, 
  PackageCheck, History, Settings, ChevronRight, HardDrive, Wrench, FolderHeart, Usb
} from 'lucide-react';
import { ViewID } from '../../types';

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
  return (
    <div className="flex h-screen bg-surface-back text-gray-100 overflow-hidden">
      <aside className="w-64 bg-surface-panel border-r border-surface-border p-6 flex flex-col">
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
          <SidebarItem icon={UserCircle} label="Avatar Items" active={activeTab === 'avatar'} onClick={() => setActiveTab('avatar')} />
          <SidebarItem icon={LayoutIcon} label="Themes" active={activeTab === 'themes'} onClick={() => setActiveTab('themes')} />
          <SidebarItem icon={FolderHeart} label="Collections" active={activeTab === 'collections'} onClick={() => setActiveTab('collections')} />
          <SidebarItem icon={PackageCheck} label="Staging Area" active={activeTab === 'staging'} onClick={() => setActiveTab('staging')} />
          <SidebarItem icon={Usb} label="USB Export" active={activeTab === 'usb_export'} onClick={() => setActiveTab('usb_export')} />
          <SidebarItem icon={Wrench} label="Repair Tool" active={activeTab === 'repair'} onClick={() => setActiveTab('repair')} />
        </nav>

        <div className="mt-auto pt-6 border-t border-surface-border space-y-1">
          <SidebarItem icon={History} label="Activity" active={activeTab === 'activity'} onClick={() => setActiveTab('activity')} />
          <SidebarItem icon={Settings} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto relative custom-scrollbar">
        <div className="h-1 bg-xbox-green/30 w-full sticky top-0 z-50" />
        {children}
      </main>
    </div>
  );
};
