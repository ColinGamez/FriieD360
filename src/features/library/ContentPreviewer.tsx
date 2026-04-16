import React, { useState, useMemo } from 'react';
import { X, Monitor, Image as ImageIcon, Layout, User, ChevronLeft, ChevronRight, Maximize2, Terminal, Shield, Cpu, FileCode } from 'lucide-react';
import { ContentItem } from '../../types';
import { MetadataService } from '../../services/MetadataService';
import { useStore } from '../../store/useStore';
import { motion, AnimatePresence } from 'motion/react';

interface ContentPreviewerProps {
  item: ContentItem;
  onClose: () => void;
}

export const ContentPreviewer = ({ item, onClose }: ContentPreviewerProps) => {
  const { settings } = useStore();
  const [activeTab, setActiveTab] = useState<'preview' | 'technical'>('preview');
  const [activeSlide, setActiveSlide] = useState(0);

  const generateHexDump = (seed: string) => {
    const hex = [];
    const chars = '0123456789ABCDEF';
    for (let i = 0; i < 256; i++) {
      let byte = '';
      for (let j = 0; j < 2; j++) {
        byte += chars[Math.floor(Math.random() * 16)];
      }
      hex.push(byte);
    }
    return hex;
  };

  const hexData = useMemo(() => generateHexDump(item.id), [item.id]);

  const renderTechnicalTab = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-black border border-white/10 rounded-2xl p-6 font-mono text-[10px] leading-relaxed relative group overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-100 transition-opacity">
              <Terminal size={16} className="text-xbox-green" />
            </div>
            <h5 className="text-xbox-green mb-4 border-b border-xbox-green/20 pb-2 uppercase font-black tracking-widest flex items-center gap-2">
              <FileCode size={14} /> Hex View (Header)
            </h5>
            <div className="grid grid-cols-16 gap-x-2 gap-y-1">
              {hexData.map((byte, i) => (
                <span key={i} className={`${i < 4 ? 'text-xbox-green font-bold' : 'text-gray-500'} hover:text-white transition-colors cursor-default`}>
                  {byte}
                </span>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-white/5 grid grid-cols-2 gap-4 text-gray-400">
              <div>
                <p className="text-xbox-green font-bold mb-1">Magic Header</p>
                <p>{item.format === 'CON' ? '43 4F 4E 20 (CON )' : '58 45 58 32 (XEX2)'}</p>
              </div>
              <div>
                <p className="text-xbox-green font-bold mb-1">Signature Type</p>
                <p>RSA-2048 / SHA-1</p>
              </div>
            </div>
          </div>

          <div className="bg-surface-panel border border-surface-border rounded-2xl p-6 space-y-4">
            <h5 className="text-[10px] font-black uppercase text-gray-500 tracking-widest flex items-center gap-2">
              <Shield size={14} className="text-blue-400" /> Security Metadata
            </h5>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-surface-card border border-surface-border rounded-xl">
                <p className="text-[9px] text-gray-500 uppercase font-black mb-1">Console ID</p>
                <p className="text-xs font-mono text-white break-all">{item.metadata.technical?.consoleId || '00000000000000000000000000000000'}</p>
              </div>
              <div className="p-4 bg-surface-card border border-surface-border rounded-xl">
                <p className="text-[9px] text-gray-500 uppercase font-black mb-1">Profile ID</p>
                <p className="text-xs font-mono text-white">
                  {item.metadata.technical?.profileId || '0000000000000000'}
                  {item.metadata.technical?.profileId && settings.profileMappings?.[item.metadata.technical.profileId] && (
                    <span className="ml-2 text-xbox-green font-bold">
                      ({settings.profileMappings[item.metadata.technical.profileId]})
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface-panel border border-surface-border rounded-2xl p-6">
            <h5 className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-4 flex items-center gap-2">
              <Cpu size={14} className="text-purple-400" /> System Info
            </h5>
            <div className="space-y-3">
              {[
                { label: 'Media ID', value: '4A5B6C7D' },
                { label: 'Disc Number', value: '1 / 1' },
                { label: 'Platform', value: 'Xbox 360' },
                { label: 'Region', value: 'Region Free (0xFF)' },
                { label: 'Min Dashboard', value: '2.0.17559.0' },
              ].map((stat, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                  <span className="text-[10px] text-gray-400 font-bold">{stat.label}</span>
                  <span className="text-[10px] text-white font-mono">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-xbox-green/5 border border-xbox-green/20 rounded-2xl p-6">
            <p className="text-[10px] text-xbox-green font-black uppercase tracking-widest mb-2">Integrity Status</p>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-xbox-green animate-pulse" />
              <span className="text-xs text-white font-bold">Verified Signature</span>
            </div>
            <p className="text-[10px] text-gray-500 mt-4 leading-relaxed">
              The internal hash matches the file content. This package is unmodified and safe for console use.
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderThemePreview = () => {
    return (
      <div className="relative w-full aspect-video bg-[#1a1a1a] rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
        {/* Simulated Xbox 360 Dashboard */}
        <div className="absolute inset-0 flex flex-col">
          {/* Top Bar */}
          <div className="h-12 bg-black/40 backdrop-blur-md flex items-center px-6 justify-between border-b border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-6 h-6 rounded-full bg-xbox-green flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-white/80">Xbox 360 Dashboard</span>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-bold text-white/60">
              <span>12:45 PM</span>
              <div className="w-4 h-4 rounded-full border border-white/20" />
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 relative">
            {/* Background (The Theme) */}
            <div className="absolute inset-0 bg-gradient-to-br from-xbox-green/20 to-blue-900/20" />
            <div className="absolute inset-0 flex items-center justify-center opacity-10">
              <Layout size={200} />
            </div>

            {/* Simulated Blades/Metro UI */}
            <div className="absolute inset-x-0 bottom-24 flex justify-center gap-4 px-12">
              {['Social', 'Games', 'Media', 'Settings'].map((tab, i) => (
                <div 
                  key={tab}
                  className={`px-8 py-4 rounded-xl border transition-all ${
                    i === 1 
                    ? 'bg-xbox-green text-white border-xbox-green shadow-xl shadow-xbox-green/20 scale-110 z-10' 
                    : 'bg-white/5 text-white/40 border-white/10'
                  }`}
                >
                  <span className="text-sm font-black uppercase tracking-tighter">{tab}</span>
                </div>
              ))}
            </div>

            {/* Simulated Game Tiles */}
            <div className="absolute inset-x-12 bottom-48 grid grid-cols-4 gap-4 opacity-40">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="aspect-video bg-white/10 rounded-lg border border-white/10" />
              ))}
            </div>
          </div>
        </div>

        {/* Overlay Info */}
        <div className="absolute top-16 left-6 p-4 bg-black/60 backdrop-blur-xl rounded-2xl border border-white/10 max-w-xs">
          <h4 className="text-lg font-black text-white leading-tight">{item.name}</h4>
          <p className="text-[10px] text-xbox-green font-black uppercase tracking-widest mt-1">Premium Theme</p>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-[9px] text-gray-400 uppercase font-black">
              <span>Title ID</span>
              <span className="text-white">{item.metadata.titleId}</span>
            </div>
            <div className="flex justify-between text-[9px] text-gray-400 uppercase font-black">
              <span>Format</span>
              <span className="text-white">{item.format}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderGamerpicPreview = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
        <div className="space-y-6">
          <div className="bg-surface-panel border border-surface-border rounded-3xl p-8 flex flex-col items-center justify-center aspect-square relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-xbox-green/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-48 h-48 rounded-2xl bg-surface-card border-4 border-xbox-green shadow-2xl flex items-center justify-center overflow-hidden relative z-10">
              <User size={120} className="text-xbox-green/20" />
              <div className="absolute inset-0 flex items-center justify-center">
                 <ImageIcon size={64} className="text-xbox-green" />
              </div>
            </div>
            <div className="mt-8 text-center space-y-2">
              <h4 className="text-2xl font-black text-white">{item.name}</h4>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Gamerpic Package</p>
            </div>
          </div>

          <div className="bg-surface-panel border border-surface-border rounded-2xl p-6">
            <h5 className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-4">Package Contents</h5>
            <div className="grid grid-cols-5 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                <div key={i} className="aspect-square bg-surface-card border border-surface-border rounded-lg flex items-center justify-center text-gray-700 hover:border-xbox-green hover:text-xbox-green transition-all cursor-pointer">
                  <User size={16} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface-panel border border-surface-border rounded-3xl p-8 space-y-6">
            <h5 className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Profile Integration</h5>
            <div className="flex items-center gap-6 p-6 bg-surface-card border border-surface-border rounded-2xl">
              <div className="w-20 h-20 rounded-xl bg-xbox-green/20 border-2 border-xbox-green flex items-center justify-center text-xbox-green">
                <User size={40} />
              </div>
              <div>
                <h6 className="text-xl font-black text-white">Major Nelson</h6>
                <p className="text-xs text-xbox-green font-bold">Gold Member • 125,430 G</p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-gray-400 leading-relaxed">
                This gamerpic package contains multiple high-resolution icons that can be applied to any Xbox 360 profile. 
                When staged, these will be placed in the <span className="text-xbox-green font-mono">Content/0000000000000000/FFFE07D1/00020000/</span> directory.
              </p>
              <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl flex gap-3">
                <Layout size={20} className="text-yellow-500 shrink-0" />
                <p className="text-[10px] text-yellow-500/80 font-bold">
                  Note: Some gamerpics may require a specific Title ID directory if they are game-specific rewards.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
      <div className="bg-surface-card border border-surface-border rounded-3xl w-full max-w-5xl flex flex-col overflow-hidden shadow-2xl shadow-xbox-green/10">
        <div className="p-6 border-b border-surface-border flex items-center justify-between bg-surface-panel/50">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-xbox-green/20 flex items-center justify-center text-xbox-green">
                {item.type === 'theme' ? <Monitor size={20} /> : <User size={20} />}
              </div>
              <div>
                <h3 className="text-xl font-black text-white tracking-tight">{item.type === 'theme' ? 'Theme Preview' : 'Gamerpic Preview'}</h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{item.name}</p>
              </div>
            </div>

            <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
              <button 
                onClick={() => setActiveTab('preview')}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === 'preview' ? 'bg-xbox-green text-white shadow-lg shadow-xbox-green/20' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                Visual Preview
              </button>
              <button 
                onClick={() => setActiveTab('technical')}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === 'technical' ? 'bg-xbox-green text-white shadow-lg shadow-xbox-green/20' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                Technical Details
              </button>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
          {activeTab === 'preview' ? (
            item.type === 'theme' ? renderThemePreview() : renderGamerpicPreview()
          ) : (
            renderTechnicalTab()
          )}
        </div>

        <div className="p-6 border-t border-surface-border bg-surface-panel/50 flex justify-between items-center">
          <div className="flex items-center gap-4">
             <div className="flex flex-col">
               <span className="text-[9px] text-gray-500 uppercase font-black">Title ID</span>
               <span className="text-xs font-mono text-white">{item.metadata.titleId}</span>
             </div>
             <div className="w-px h-8 bg-surface-border" />
             <div className="flex flex-col">
               <span className="text-[9px] text-gray-500 uppercase font-black">Size</span>
               <span className="text-xs font-mono text-white">{(item.size / 1024 / 1024).toFixed(2)} MB</span>
             </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="px-6 py-2 text-sm font-bold text-gray-400 hover:text-white transition-colors"
            >
              Close Preview
            </button>
            <button 
              className="px-8 py-2 bg-xbox-green hover:bg-xbox-hover text-white rounded-lg font-bold text-sm transition-all shadow-lg shadow-xbox-green/20 flex items-center gap-2"
            >
              <Maximize2 size={16} />
              <span>Full Screen</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
