import React, { Suspense, lazy, useEffect } from 'react';
import { AppLayout } from './components/common/Layout';
import { useStore } from './store/useStore';

const Dashboard = lazy(() => import('./features/dashboard/Dashboard').then((module) => ({ default: module.Dashboard })));
const LibraryView = lazy(() => import('./features/library/LibraryView').then((module) => ({ default: module.LibraryView })));
const Settings = lazy(() => import('./features/settings/Settings').then((module) => ({ default: module.Settings })));
const ExtensionRepair = lazy(() => import('./features/repair/ExtensionRepair').then((module) => ({ default: module.ExtensionRepair })));
const StagingArea = lazy(() => import('./features/staging/StagingArea').then((module) => ({ default: module.StagingArea })));
const ActivityLog = lazy(() => import('./features/activity/ActivityLog').then((module) => ({ default: module.ActivityLog })));
const CollectionsView = lazy(() => import('./features/collections/CollectionsView').then((module) => ({ default: module.CollectionsView })));
const UsbExport = lazy(() => import('./features/staging/UsbExport').then((module) => ({ default: module.UsbExport })));
const ProfileExplorer = lazy(() => import('./features/profiles/ProfileExplorer').then((module) => ({ default: module.ProfileExplorer })));

const AppSectionLoader = () => (
  <div className="p-10 flex items-center justify-center">
    <div className="text-center space-y-3">
      <div className="w-12 h-12 rounded-full border-2 border-xbox-green/20 border-t-xbox-green animate-spin mx-auto" />
      <p className="text-xs font-black uppercase tracking-[0.3em] text-gray-500">Loading Module</p>
    </div>
  </div>
);

export default function App() {
  const { activeTab, setActiveTab, fetchSettings, fetchItems, fetchCollections } = useStore();

  useEffect(() => {
    fetchSettings();
    fetchItems();
    fetchCollections();
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'avatar': return <LibraryView title="Avatar Items" types={['avatar_item']} />;
      case 'themes': return <LibraryView title="Themes" types={['theme']} />;
      case 'dlc': return <LibraryView title="DLC & Content" types={['dlc', 'demo', 'title_update']} />;
      case 'gamerpics': return <LibraryView title="Gamerpics" types={['gamerpic']} />;
      case 'games': return <LibraryView title="Games" types={['xbla', 'god']} />;
      case 'library': return <LibraryView title="Library" types={['avatar_item', 'theme', 'dlc', 'gamerpic', 'xbla', 'god', 'demo', 'title_update']} />;
      case 'collections': return <CollectionsView />;
      case 'profiles': return <ProfileExplorer />;
      case 'staging': return <StagingArea />;
      case 'usb_export': return <UsbExport />;
      case 'repair': return <ExtensionRepair />;
      case 'activity': return <ActivityLog />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  return (
    <AppLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      <Suspense fallback={<AppSectionLoader />}>
        {renderContent()}
      </Suspense>
    </AppLayout>
  );
}
