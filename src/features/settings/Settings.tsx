import React, { useState, useEffect } from 'react';
import { Folder, Plus, Trash2, HardDrive, RefreshCw, AlertTriangle, CheckCircle2, Usb, Wrench, Hash, Tag, Palette, Monitor, Zap, Moon, UserCircle } from 'lucide-react';
import { useStore, ThemeID } from '../../store/useStore';
import { Modal } from '../../components/ui/Modal';
import { getAvailableProfileIds, getProfileLabel } from '../../utils/profiles';
import { getErrorMessage, readJsonOrThrow } from '../../utils/api';
import type { PathValidationResult } from '../../types';

export const Settings = () => {
  const { settings, updateSettings, triggerScan, isScanning, fetchSettings, refreshInstalledStatus, theme, setTheme, items, collections, clearLibrary, addToast } = useStore();
  const [newPath, setNewPath] = useState('');
  const [isPathValid, setIsPathValid] = useState<boolean | null>(null);
  const [installedPath, setInstalledPath] = useState('');
  const [mappingId, setMappingId] = useState('');
  const [mappingName, setMappingName] = useState('');
  const [profileId, setProfileId] = useState('');
  const [profileName, setProfileName] = useState('');
  const [outputFolderDraft, setOutputFolderDraft] = useState(settings.outputFolder);
  const [showClearLibraryModal, setShowClearLibraryModal] = useState(false);
  const availableProfileIds = getAvailableProfileIds(settings, items);

  useEffect(() => { fetchSettings(); }, []);
  useEffect(() => { setOutputFolderDraft(settings.outputFolder); }, [settings.outputFolder]);

  const handleAddFolder = async () => {
    const trimmedPath = newPath.trim();
    if (!trimmedPath) {
      setIsPathValid(false);
      addToast('Enter a source folder path', 'error');
      return;
    }

    if (settings.sourceFolders.includes(trimmedPath)) {
      setIsPathValid(false);
      addToast('That source folder is already added', 'info');
      return;
    }

    try {
      const res = await fetch('/api/settings/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: trimmedPath })
      });
      const { exists } = await readJsonOrThrow<PathValidationResult>(res, 'Unable to validate source folder');

      if (!exists) {
        setIsPathValid(false);
        addToast('That path does not exist', 'error');
        return;
      }

      const updatedFolders = [...settings.sourceFolders, trimmedPath];
        await updateSettings({ sourceFolders: updatedFolders });
        if (!useStore.getState().settings.sourceFolders.includes(trimmedPath)) {
          return;
        }

        setNewPath('');
        setIsPathValid(null);
        addToast('Source folder added', 'success');
    } catch (error) {
      setIsPathValid(false);
      addToast(getErrorMessage(error, 'Unable to validate source folder'), 'error');
    }
  };

  const removeFolder = async (pathToRemove: string) => {
    const updatedFolders = settings.sourceFolders.filter(p => p !== pathToRemove);
    await updateSettings({ sourceFolders: updatedFolders });
    addToast('Source folder removed', 'success');
  };

  const handleCheckInstalled = async () => {
    if (installedPath) {
      const count = await refreshInstalledStatus(installedPath);
      addToast(`Installed-content scan matched ${count} packages`, 'success');
    }
  };

  const handleSaveOutputFolder = async () => {
    const trimmedOutputFolder = outputFolderDraft.trim();
    if (trimmedOutputFolder === settings.outputFolder) {
      setOutputFolderDraft(trimmedOutputFolder);
      return;
    }

    await updateSettings({ outputFolder: trimmedOutputFolder });

    const savedOutputFolder = useStore.getState().settings.outputFolder;
    setOutputFolderDraft(savedOutputFolder);
    if (savedOutputFolder === trimmedOutputFolder) {
      addToast('Staging output updated', 'success');
    }
  };

  return (
    <div className="p-8 max-w-4xl space-y-10 animate-in fade-in duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Settings</h2>
          <p className="text-gray-500 mt-1">Configure your local environment and staging paths.</p>
        </div>
        <button 
          onClick={() => triggerScan(false)}
          disabled={isScanning || settings.sourceFolders.length === 0}
          className="flex items-center space-x-2 px-6 py-3 bg-xbox-green hover:bg-xbox-hover disabled:bg-surface-card disabled:text-gray-600 rounded-xl font-bold transition-all shadow-lg shadow-xbox-green/10"
        >
          <RefreshCw size={20} className={isScanning ? 'animate-spin' : ''} />
          <span>{isScanning ? 'Scanning...' : 'Scan Now'}</span>
        </button>
      </header>

      <section className="bg-surface-card border border-surface-border rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-surface-border flex items-center space-x-3">
          <Folder className="text-xbox-green" size={24} />
          <h3 className="text-xl font-bold">Source Folders</h3>
        </div>
        
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-400 mb-4">The app will recursively scan these folders for Avatar Items and Themes.</p>
          
          <div className="space-y-2">
            {settings.sourceFolders.map((path, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-surface-panel border border-surface-border rounded-lg group">
                <span className="text-sm font-mono text-gray-300 truncate mr-4">{path}</span>
                <button 
                  onClick={() => removeFolder(path)}
                  className="text-gray-500 hover:text-red-500 transition-colors p-1"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex space-x-2 mt-6">
            <div className="relative flex-1">
                <input 
                    type="text" 
                    value={newPath}
                    onChange={(e) => { setNewPath(e.target.value); setIsPathValid(null); }}
                    placeholder="E.g. C:\Xbox360\Content\AvatarItems"
                    className={`w-full bg-surface-panel border ${isPathValid === false ? 'border-red-500/50' : 'border-surface-border'} rounded-lg px-4 py-2.5 outline-none focus:ring-1 focus:ring-xbox-green text-sm`}
                />
                {isPathValid === false && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-red-500 space-x-1">
                        <AlertTriangle size={14} />
                        <span className="text-[10px] font-bold">Invalid Path</span>
                    </div>
                )}
            </div>
            <button 
              onClick={handleAddFolder}
              className="px-4 py-2 bg-surface-border hover:bg-xbox-green text-white rounded-lg transition-all font-bold flex items-center space-x-2"
            >
              <Plus size={18} />
              <span>Add</span>
            </button>
          </div>
        </div>
      </section>

      <section className="bg-surface-card border border-surface-border rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-surface-border flex items-center space-x-3">
          <Palette className="text-xbox-green" size={24} />
          <h3 className="text-xl font-bold">Visual Theme</h3>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { id: 'carbon', name: 'Carbon', desc: 'Default dark studio', icon: Moon, color: '#107C10' },
              { id: 'blades', name: 'Blades', desc: 'Classic white & green', icon: Zap, color: '#107C10' },
              { id: 'metro', name: 'Metro', desc: 'Modern blue & gray', icon: Monitor, color: '#00a4ef' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id as ThemeID)}
                className={`p-4 rounded-xl border-2 text-left transition-all group relative overflow-hidden ${
                  theme === t.id 
                    ? 'border-xbox-green bg-xbox-green/5' 
                    : 'border-surface-border bg-surface-panel hover:border-xbox-green/50'
                }`}
              >
                <div className="absolute top-0 right-0 w-12 h-12 opacity-10 -mr-4 -mt-4 rotate-12">
                  <t.icon size={48} />
                </div>
                <t.icon size={24} className={`mb-3 ${theme === t.id ? 'text-xbox-green' : 'text-gray-500 group-hover:text-xbox-green'}`} />
                <p className="font-bold text-sm">{t.name}</p>
                <p className="text-[10px] text-gray-500 mt-1">{t.desc}</p>
                <div className="mt-3 flex gap-1">
                  <div className="w-4 h-1 rounded-full" style={{ backgroundColor: t.color }} />
                  <div className="w-2 h-1 rounded-full bg-gray-700" />
                  <div className="w-2 h-1 rounded-full bg-gray-800" />
                </div>
              </button>
            ))}
          </div>

          <div className="p-4 bg-surface-panel rounded-xl border border-dashed border-surface-border">
            <h4 className="text-[10px] font-black uppercase text-gray-500 mb-3 tracking-widest">Theme Preview</h4>
            <div className={`p-4 rounded-lg border border-surface-border bg-surface-back theme-${theme}`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-xbox-green" />
                <div>
                  <div className="h-2 w-24 bg-gray-500 rounded mb-1" />
                  <div className="h-1.5 w-16 bg-gray-700 rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-surface-card border border-surface-border rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-surface-border flex items-center space-x-3">
          <Monitor className="text-xbox-green" size={24} />
          <h3 className="text-xl font-bold">System Information</h3>
        </div>
        <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-surface-panel rounded-xl border border-surface-border">
            <p className="text-[9px] font-black uppercase text-gray-500 mb-1">App Version</p>
            <p className="text-sm font-bold">1.2.4-stable</p>
          </div>
          <div className="p-4 bg-surface-panel rounded-xl border border-surface-border">
            <p className="text-[9px] font-black uppercase text-gray-500 mb-1">Environment</p>
            <p className="text-sm font-bold">Production</p>
          </div>
          <div className="p-4 bg-surface-panel rounded-xl border border-surface-border">
            <p className="text-[9px] font-black uppercase text-gray-500 mb-1">Library Size</p>
            <p className="text-sm font-bold">{items.length} Items</p>
          </div>
          <div className="p-4 bg-surface-panel rounded-xl border border-surface-border">
            <p className="text-[9px] font-black uppercase text-gray-500 mb-1">Collections</p>
            <p className="text-sm font-bold">{collections.length} Groups</p>
          </div>
        </div>
      </section>

      <section className="bg-surface-card border border-surface-border rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-surface-border flex items-center space-x-3">
          <RefreshCw className="text-xbox-green" size={24} />
          <h3 className="text-xl font-bold">System Options</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between p-4 bg-surface-panel rounded-xl border border-surface-border">
            <div className="flex items-center space-x-3">
              <RefreshCw size={20} className="text-xbox-green" />
              <div>
                <p className="text-sm font-bold">Scan on Startup</p>
                <p className="text-[10px] text-gray-500">Automatically scan source folders when the app starts.</p>
              </div>
            </div>
            <button 
              onClick={() => updateSettings({ scanOnStartup: !settings.scanOnStartup })}
              className={`w-12 h-6 rounded-full transition-all relative ${settings.scanOnStartup ? 'bg-xbox-green' : 'bg-gray-700'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.scanOnStartup ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-surface-panel rounded-xl border border-surface-border">
            <div className="flex items-center space-x-3">
              <Wrench size={20} className="text-xbox-green" />
              <div>
                <p className="text-sm font-bold">Auto-Repair Extensions</p>
                <p className="text-[10px] text-gray-500">Automatically append .CON to extensionless files during scan.</p>
              </div>
            </div>
            <button 
              onClick={() => updateSettings({ autoRepair: !settings.autoRepair })}
              className={`w-12 h-6 rounded-full transition-all relative ${settings.autoRepair ? 'bg-xbox-green' : 'bg-gray-700'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.autoRepair ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        </div>
      </section>

      <section className="bg-surface-card border border-surface-border rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-surface-border flex items-center space-x-3">
          <HardDrive className="text-xbox-green" size={24} />
          <h3 className="text-xl font-bold">Staging Output</h3>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-400 mb-4">When you "Stage" items, they will be copied to this clean directory.</p>
          <div className="flex gap-3">
            <input 
              type="text" 
              value={outputFolderDraft}
              onChange={(e) => setOutputFolderDraft(e.target.value)}
              onBlur={handleSaveOutputFolder}
              placeholder="E.g. D:\Clean_Xbox_USB"
              className="flex-1 bg-surface-panel border border-surface-border rounded-lg px-4 py-2.5 outline-none focus:ring-1 focus:ring-xbox-green text-sm font-mono"
            />
            <button
              onClick={handleSaveOutputFolder}
              disabled={outputFolderDraft === settings.outputFolder}
              className="px-4 py-2 bg-xbox-green hover:bg-xbox-hover disabled:bg-surface-panel disabled:text-gray-600 text-white rounded-lg transition-all font-bold"
            >
              Save
            </button>
          </div>

          <div className="mt-6 p-4 bg-surface-panel rounded-xl border border-surface-border space-y-3">
            <div>
              <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Default Content Owner</p>
              <p className="text-xs text-gray-500 mt-1">Used by quick stage copy and one-click USB export for profile-scoped content.</p>
            </div>
            <select
              value={settings.profileId || '0000000000000000'}
              onChange={(e) => updateSettings({ profileId: e.target.value })}
              className="w-full bg-surface-back border border-surface-border rounded-lg px-4 py-2.5 outline-none focus:ring-1 focus:ring-xbox-green text-sm font-mono"
            >
              {availableProfileIds.map((id) => (
                <option key={id} value={id}>
                  {getProfileLabel(id, settings.profileMappings)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="bg-surface-card border border-surface-border rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-surface-border flex items-center space-x-3">
          <UserCircle className="text-xbox-green" size={24} />
          <h3 className="text-xl font-bold">Profile Mappings</h3>
        </div>
        <div className="p-6 space-y-6">
          <p className="text-sm text-gray-400">Map 16-character Profile IDs to friendly names (e.g. "Main Profile").</p>
          
          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
            {Object.entries(settings.profileMappings || {}).map(([id, name]) => (
              <div key={id} className="flex items-center justify-between p-3 bg-surface-panel border border-surface-border rounded-lg group">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-mono text-xbox-green font-bold">{id}</span>
                  <span className="text-sm text-gray-300">{name}</span>
                </div>
                <button 
                  onClick={() => {
                    const updated = { ...settings.profileMappings };
                    delete updated[id];
                    updateSettings({ profileMappings: updated });
                  }}
                  className="text-gray-500 hover:text-red-500 transition-colors p-1"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            {Object.keys(settings.profileMappings || {}).length === 0 && (
              <p className="text-xs text-gray-600 italic text-center py-4">No profile mappings defined.</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input 
              type="text" 
              value={profileId}
              onChange={(e) => setProfileId(e.target.value.toUpperCase())}
              placeholder="Profile ID (16 hex)"
              maxLength={16}
              className="bg-surface-panel border border-surface-border rounded-lg px-4 py-2.5 outline-none focus:ring-1 focus:ring-xbox-green text-sm font-mono"
            />
            <input 
              type="text" 
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="Friendly Name"
              className="bg-surface-panel border border-surface-border rounded-lg px-4 py-2.5 outline-none focus:ring-1 focus:ring-xbox-green text-sm"
            />
            <button 
              onClick={() => {
                if (!/^[0-9A-F]{16}$/.test(profileId) || !profileName.trim()) {
                  addToast('Enter a valid 16-character Profile ID and name', 'error');
                  return;
                }
                updateSettings({ profileMappings: { ...settings.profileMappings, [profileId]: profileName.trim() } });
                  setProfileId('');
                  setProfileName('');
                  addToast('Profile mapping added', 'success');
              }}
              className="px-4 py-2 bg-xbox-green hover:bg-xbox-hover text-white rounded-lg transition-all font-bold flex items-center justify-center space-x-2"
            >
              <Plus size={18} />
              <span>Add Profile</span>
            </button>
          </div>
        </div>
      </section>

      <section className="bg-surface-card border border-surface-border rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-surface-border flex items-center space-x-3">
          <Tag className="text-xbox-green" size={24} />
          <h3 className="text-xl font-bold">Custom Title ID Mappings</h3>
        </div>
        <div className="p-6 space-y-6">
          <p className="text-sm text-gray-400">Define custom game names for Title IDs that aren't recognized automatically.</p>
          
          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
            {Object.entries(settings.customMappings || {}).map(([id, name]) => (
              <div key={id} className="flex items-center justify-between p-3 bg-surface-panel border border-surface-border rounded-lg group">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-mono text-xbox-green font-bold">{id}</span>
                  <span className="text-sm text-gray-300">{name}</span>
                </div>
                <button 
                  onClick={() => {
                    const updated = { ...settings.customMappings };
                    delete updated[id];
                    updateSettings({ customMappings: updated });
                  }}
                  className="text-gray-500 hover:text-red-500 transition-colors p-1"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            {Object.keys(settings.customMappings || {}).length === 0 && (
              <p className="text-xs text-gray-600 italic text-center py-4">No custom mappings defined.</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input 
              type="text" 
              value={mappingId}
              onChange={(e) => setMappingId(e.target.value.toUpperCase())}
              placeholder="Title ID (8 hex)"
              maxLength={8}
              className="bg-surface-panel border border-surface-border rounded-lg px-4 py-2.5 outline-none focus:ring-1 focus:ring-xbox-green text-sm font-mono"
            />
            <input 
              type="text" 
              value={mappingName}
              onChange={(e) => setMappingName(e.target.value)}
              placeholder="Game Name"
              className="bg-surface-panel border border-surface-border rounded-lg px-4 py-2.5 outline-none focus:ring-1 focus:ring-xbox-green text-sm"
            />
            <button 
              onClick={() => {
                if (!/^[0-9A-F]{8}$/.test(mappingId) || !mappingName.trim()) {
                  addToast('Enter a valid 8-character Title ID and game name', 'error');
                  return;
                }
                updateSettings({ customMappings: { ...settings.customMappings, [mappingId]: mappingName.trim() } });
                  setMappingId('');
                  setMappingName('');
                  addToast('Custom Title ID mapping added', 'success');
              }}
              className="px-4 py-2 bg-xbox-green hover:bg-xbox-hover text-white rounded-lg transition-all font-bold flex items-center justify-center space-x-2"
            >
              <Plus size={18} />
              <span>Add Mapping</span>
            </button>
          </div>
        </div>
      </section>

      <section className="bg-surface-card border border-surface-border rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-surface-border flex items-center space-x-3">
          <Usb className="text-xbox-green" size={24} />
          <h3 className="text-xl font-bold">Installed Content Detection</h3>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-400">Point to your Xbox HDD or USB root to check which items are already installed.</p>
          <div className="flex space-x-2">
            <input 
              type="text" 
              value={installedPath}
              onChange={(e) => setInstalledPath(e.target.value)}
              placeholder="E.g. F:\"
              className="flex-1 bg-surface-panel border border-surface-border rounded-lg px-4 py-2.5 outline-none focus:ring-1 focus:ring-xbox-green text-sm font-mono"
            />
            <button 
              onClick={handleCheckInstalled}
              className="px-4 py-2 bg-surface-border hover:bg-blue-600 text-white rounded-lg transition-all font-bold flex items-center space-x-2"
            >
              <RefreshCw size={18} />
              <span>Check Drive</span>
            </button>
          </div>
          <div className="flex items-center space-x-2 text-blue-400 opacity-70">
            <CheckCircle2 size={14} />
            <span className="text-xs">This will mark items in your library as "Installed" based on file name and size.</span>
          </div>

          <div className="pt-8 border-t border-surface-border">
            <button 
              onClick={() => setShowClearLibraryModal(true)}
              className="text-xs text-red-500 hover:text-red-400 font-bold flex items-center gap-2 transition-colors"
            >
              <Trash2 size={14} /> Clear Library Database
            </button>
          </div>
        </div>
      </section>

      <footer className="text-center pt-10 text-gray-600 text-[10px] uppercase tracking-[0.2em] font-black">
        FriieD360 Studio • Build 1.0.0
      </footer>

      <Modal
        isOpen={showClearLibraryModal}
        onClose={() => setShowClearLibraryModal(false)}
        title="Clear Library Database"
        type="warning"
        footer={
          <>
            <button onClick={() => setShowClearLibraryModal(false)} className="px-4 py-2 text-gray-400 hover:text-white font-bold">Cancel</button>
            <button
              onClick={async () => {
                await clearLibrary();
                setShowClearLibraryModal(false);
              }}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-600/20"
            >
              Clear Library
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-300">
            This will remove all indexed items from FriieD360 Studio, clear the staging queue, and empty collection memberships.
          </p>
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex gap-3">
            <AlertTriangle className="text-yellow-500 shrink-0" size={20} />
            <p className="text-xs text-yellow-500/80 leading-relaxed">
              Your actual files on disk will remain untouched. You can re-scan later to rebuild the library.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};
