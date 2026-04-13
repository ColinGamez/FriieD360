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
        <div className="mb-10 px-2 flex items-center space-x-2">
          <div className="w-8 h-8 bg-xbox-green rounded-md flex items-center justify-center shadow-lg shadow-xbox-green/30">
            <HardDrive size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-none tracking-tight">FriieD 360</h1>
            <p className="text-[10px] text-xbox-green font-black uppercase tracking-widest mt-1">Studio</p>
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
