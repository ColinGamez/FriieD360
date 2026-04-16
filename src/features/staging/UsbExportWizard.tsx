import React, { useState, useMemo } from 'react';
import { X, ChevronRight, ChevronLeft, HardDrive, User, Package, ShieldCheck, AlertCircle, CheckCircle2, Play, ArrowRight, Folder, Save, Info } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { ContentItem } from '../../types';
import { motion, AnimatePresence } from 'motion/react';

interface UsbExportWizardProps {
  onClose: () => void;
}

type Step = 'review' | 'profiles' | 'target' | 'execute';

export const UsbExportWizard = ({ onClose }: UsbExportWizardProps) => {
  const { items, stagedIds, settings, updateSettings, clearStaging, addToast } = useStore();
  const [currentStep, setCurrentStep] = useState<Step>('review');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string>(settings.profileId || '0000000000000000');

  const stagedItems = useMemo(() => items.filter(i => stagedIds.includes(i.id)), [items, stagedIds]);
  const totalSize = useMemo(() => stagedItems.reduce((acc, i) => acc + i.size, 0), [stagedItems]);

  const profileIds = useMemo(() => {
    const ids = new Set(items.map(i => i.metadata.technical?.profileId).filter(id => id && id !== '0000000000000000'));
    return ['0000000000000000', ...Array.from(ids)];
  }, [items]);

  const formatSize = (bytes: number) => {
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleExecute = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/staging/copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          itemIds: stagedIds,
          targetProfileId: selectedProfileId
        })
      });
      const data = await res.json();
      setResults(data);
      const errorCount = data.filter((r: any) => r.status === 'error').length;
      if (errorCount === 0) {
        addToast('Export completed successfully', 'success');
        clearStaging();
      } else {
        addToast(`Export completed with ${errorCount} errors`, 'error');
      }
    } catch (err) {
      console.error("Export failed", err);
      addToast('Export operation failed', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const steps: { id: Step; label: string; icon: any }[] = [
    { id: 'review', label: 'Review Content', icon: Package },
    { id: 'profiles', label: 'Profile Assignment', icon: User },
    { id: 'target', label: 'Target & Space', icon: HardDrive },
    { id: 'execute', label: 'Execute Export', icon: Play },
  ];

  return (
    <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
      <div className="bg-surface-card border border-surface-border rounded-3xl w-full max-w-4xl h-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl shadow-xbox-green/10">
        {/* Wizard Header */}
        <div className="p-6 border-b border-surface-border bg-surface-panel/50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-xbox-green/20 flex items-center justify-center text-xbox-green">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="text-xl font-black text-white tracking-tight">USB Export Wizard</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Preparing content for Xbox 360 Hardware</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-8 py-6 bg-surface-panel/30 border-b border-surface-border">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-surface-border -translate-y-1/2 z-0" />
            {steps.map((step, idx) => {
              const isCompleted = steps.findIndex(s => s.id === currentStep) > idx;
              const isActive = step.id === currentStep;
              const Icon = step.icon;
              
              return (
                <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                    isActive ? 'bg-xbox-green border-xbox-green text-white scale-110 shadow-lg shadow-xbox-green/20' : 
                    isCompleted ? 'bg-surface-card border-xbox-green text-xbox-green' : 
                    'bg-surface-card border-surface-border text-gray-600'
                  }`}>
                    {isCompleted ? <CheckCircle2 size={20} /> : <Icon size={20} />}
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-widest ${isActive ? 'text-white' : 'text-gray-500'}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          <AnimatePresence mode="wait">
            {currentStep === 'review' && (
              <motion.div 
                key="review"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-bold">Review Staged Content</h4>
                  <span className="text-xs font-bold text-gray-500">{stagedItems.length} Items • {formatSize(totalSize)}</span>
                </div>
                <div className="space-y-2">
                  {stagedItems.map(item => (
                    <div key={item.id} className="p-4 bg-surface-panel border border-surface-border rounded-xl flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <Package size={20} className="text-gray-600 group-hover:text-xbox-green transition-colors" />
                        <div>
                          <p className="text-sm font-bold text-white">{item.name}</p>
                          <p className="text-[10px] text-gray-500 font-mono">{item.metadata.titleId} • {item.type.replace('_', ' ').toUpperCase()}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-gray-600">{formatSize(item.size)}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {currentStep === 'profiles' && (
              <motion.div 
                key="profiles"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-2">
                  <h4 className="text-lg font-bold">Profile Assignment</h4>
                  <p className="text-sm text-gray-400">Select the target profile for this export. This ensures content is placed in the correct directory structure.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profileIds.map(id => (
                    <button 
                      key={id}
                      onClick={() => setSelectedProfileId(id)}
                      className={`p-6 rounded-2xl border-2 transition-all text-left flex items-center gap-4 ${
                        selectedProfileId === id 
                        ? 'bg-xbox-green/10 border-xbox-green shadow-lg shadow-xbox-green/10' 
                        : 'bg-surface-panel border-surface-border hover:border-gray-600'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selectedProfileId === id ? 'bg-xbox-green text-white' : 'bg-surface-card text-gray-600'}`}>
                        <User size={24} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-white">{id === '0000000000000000' ? 'Global / All Profiles' : 'Xbox 360 Profile'}</p>
                        <p className="text-[10px] font-mono text-gray-500 mt-1">{id}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl flex gap-3">
                  <Info size={20} className="text-blue-400 shrink-0" />
                  <p className="text-xs text-blue-400/80 leading-relaxed">
                    Content like DLC and Themes will be placed under <span className="font-mono text-white">Content/{selectedProfileId}/</span>. 
                    If you are using a modified console, "Global" is usually sufficient for GOD/XBLA content.
                  </p>
                </div>
              </motion.div>
            )}

            {currentStep === 'target' && (
              <motion.div 
                key="target"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-2">
                  <h4 className="text-lg font-bold">Target & Space Verification</h4>
                  <p className="text-sm text-gray-400">Confirm the destination folder and ensure your USB drive has sufficient space.</p>
                </div>

                <div className="p-8 bg-surface-panel border border-surface-border rounded-3xl space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-surface-card border border-surface-border flex items-center justify-center text-xbox-green">
                        <HardDrive size={24} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Output Directory</p>
                        <p className="text-lg font-bold text-white">{settings.outputFolder || 'Not Configured'}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => addToast('Change output folder in Settings', 'info')}
                      className="text-xs font-bold text-xbox-green hover:underline"
                    >
                      Change Path
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                      <span className="text-gray-500">Storage Utilization</span>
                      <span className="text-white">{formatSize(totalSize)} / Available</span>
                    </div>
                    <div className="h-3 bg-surface-card rounded-full overflow-hidden border border-surface-border">
                      <div className="h-full bg-xbox-green w-[45%] shadow-[0_0_10px_rgba(16,124,16,0.5)]" />
                    </div>
                    <p className="text-[10px] text-gray-500 italic">Estimated time to copy: ~2 minutes (based on USB 2.0 speeds)</p>
                  </div>
                </div>

                {!settings.outputFolder && (
                  <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex gap-3 text-red-500">
                    <AlertCircle size={20} className="shrink-0" />
                    <p className="text-sm font-bold">You must configure an output folder in Settings before exporting.</p>
                  </div>
                )}
              </motion.div>
            )}

            {currentStep === 'execute' && (
              <motion.div 
                key="execute"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col items-center justify-center h-full space-y-8 text-center"
              >
                {results ? (
                  <div className="space-y-6 w-full">
                    <div className="w-20 h-20 bg-xbox-green/20 rounded-full flex items-center justify-center text-xbox-green mx-auto">
                      <CheckCircle2 size={48} />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-3xl font-black text-white">Export Complete!</h4>
                      <p className="text-gray-500">Successfully processed {results.length} items to your USB drive.</p>
                    </div>
                    <div className="max-h-48 overflow-y-auto custom-scrollbar bg-surface-panel border border-surface-border rounded-2xl p-4 text-left space-y-2">
                      {results.map((r, i) => (
                        <div key={i} className="flex items-center justify-between text-[10px] font-mono">
                          <span className="text-gray-400 truncate max-w-[70%]">{r.fileName}</span>
                          <span className={r.status === 'success' ? 'text-xbox-green' : 'text-red-500'}>{r.status.toUpperCase()}</span>
                        </div>
                      ))}
                    </div>
                    <button 
                      onClick={onClose}
                      className="px-12 py-3 bg-xbox-green hover:bg-xbox-hover text-white rounded-xl font-bold transition-all shadow-xl shadow-xbox-green/20"
                    >
                      Finish & Close
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <div className="w-32 h-32 bg-xbox-green/10 rounded-full flex items-center justify-center text-xbox-green animate-pulse">
                        <Play size={64} />
                      </div>
                      <div className="absolute inset-0 border-4 border-xbox-green/20 border-t-xbox-green rounded-full animate-spin" />
                    </div>
                    <div className="space-y-4 max-w-md">
                      <h4 className="text-2xl font-black text-white">Ready to Deploy</h4>
                      <p className="text-gray-400 text-sm">
                        We are about to copy <span className="text-white font-bold">{stagedItems.length} items</span> to 
                        <span className="text-white font-bold"> {settings.outputFolder}</span>. 
                        Do not remove your USB drive during this process.
                      </p>
                    </div>
                    <button 
                      onClick={handleExecute}
                      disabled={isProcessing}
                      className="px-12 py-4 bg-xbox-green hover:bg-xbox-hover text-white rounded-2xl font-black text-lg transition-all shadow-2xl shadow-xbox-green/30 flex items-center gap-3"
                    >
                      {isProcessing ? <RefreshCw className="animate-spin" /> : <Save />}
                      <span>{isProcessing ? 'Processing...' : 'Begin Export'}</span>
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Wizard Footer */}
        <div className="p-6 border-t border-surface-border bg-surface-panel/50 flex justify-between items-center">
          <button 
            onClick={() => {
              if (currentStep === 'profiles') setCurrentStep('review');
              if (currentStep === 'target') setCurrentStep('profiles');
              if (currentStep === 'execute') setCurrentStep('target');
            }}
            disabled={currentStep === 'review' || isProcessing || !!results}
            className="flex items-center gap-2 px-6 py-2 text-sm font-bold text-gray-500 hover:text-white disabled:opacity-0 transition-all"
          >
            <ChevronLeft size={20} />
            Back
          </button>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="px-6 py-2 text-sm font-bold text-gray-500 hover:text-white transition-colors"
            >
              Cancel
            </button>
            {currentStep !== 'execute' && (
              <button 
                onClick={() => {
                  if (currentStep === 'review') setCurrentStep('profiles');
                  else if (currentStep === 'profiles') setCurrentStep('target');
                  else if (currentStep === 'target') setCurrentStep('execute');
                }}
                disabled={currentStep === 'target' && !settings.outputFolder}
                className="flex items-center gap-2 px-8 py-2 bg-xbox-green hover:bg-xbox-hover text-white rounded-lg font-bold text-sm transition-all shadow-lg shadow-xbox-green/20"
              >
                Next Step
                <ChevronRight size={20} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const RefreshCw = ({ className }: { className?: string }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
    <path d="M16 16h5v5" />
  </svg>
);
