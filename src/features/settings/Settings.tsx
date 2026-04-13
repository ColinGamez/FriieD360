import React, { useState, useEffect } from 'react';
import { Folder, Plus, Trash2, HardDrive, RefreshCw, AlertTriangle, CheckCircle2, Usb } from 'lucide-react';
import { useStore } from '../../store/useStore';

export const Settings = () => {
  const { settings, updateSettings, triggerScan, isScanning, fetchSettings, refreshInstalledStatus } = useStore();
  const [newPath, setNewPath] = useState('');
  const [isPathValid, setIsPathValid] = useState<boolean | null>(null);
  const [installedPath, setInstalledPath] = useState('');

  useEffect(() => { fetchSettings(); }, []);

  const handleAddFolder = async () => {
    if (!newPath) return;
    
    const res = await fetch('/api/settings/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: newPath })
    });
    const { exists } = await res.json();

    if (exists) {
        const updatedFolders = [...settings.sourceFolders, newPath];
        await updateSettings({ sourceFolders: updatedFolders });
        setNewPath('');
        setIsPathValid(null);
    } else {
        setIsPathValid(false);
    }
  };

  const removeFolder = async (pathToRemove: string) => {
    const updatedFolders = settings.sourceFolders.filter(p => p !== pathToRemove);
    await updateSettings({ sourceFolders: updatedFolders });
  };

  const handleCheckInstalled = () => {
    if (installedPath) {
      refreshInstalledStatus(installedPath);
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
          onClick={triggerScan}
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
          <HardDrive className="text-xbox-green" size={24} />
          <h3 className="text-xl font-bold">Staging Output</h3>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-400 mb-4">When you "Stage" items, they will be copied to this clean directory.</p>
          <input 
            type="text" 
            value={settings.outputFolder}
            onChange={(e) => updateSettings({ outputFolder: e.target.value })}
            placeholder="E.g. D:\Clean_Xbox_USB"
            className="w-full bg-surface-panel border border-surface-border rounded-lg px-4 py-2.5 outline-none focus:ring-1 focus:ring-xbox-green text-sm font-mono"
          />
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
        </div>
      </section>

      <footer className="text-center pt-10 text-gray-600 text-[10px] uppercase tracking-[0.2em] font-black">
        FriieD360 Studio • Build 1.0.0
      </footer>
    </div>
  );
};
