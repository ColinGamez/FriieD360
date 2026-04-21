/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { AppLayout } from './components/common/Layout';
import { Dashboard } from './features/dashboard/Dashboard';
import { LibraryView } from './features/library/LibraryView';
import { Settings } from './features/settings/Settings';
import { ExtensionRepair } from './features/repair/ExtensionRepair';
import { StagingArea } from './features/staging/StagingArea';
import { ActivityLog } from './features/activity/ActivityLog';
import { CollectionsView } from './features/collections/CollectionsView';
import { UsbExport } from './features/staging/UsbExport';
import { ProfileExplorer } from './features/profiles/ProfileExplorer';
import { useStore } from './store/useStore';

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
      {renderContent()}
    </AppLayout>
  );
}
