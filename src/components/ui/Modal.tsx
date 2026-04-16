import React from 'react';
import { X, AlertTriangle, Info, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  type?: 'info' | 'warning' | 'error' | 'success';
  footer?: React.ReactNode;
  maxWidth?: string;
}

export const Modal = ({ isOpen, onClose, title, children, type = 'info', footer, maxWidth = 'max-w-lg' }: ModalProps) => {
  const icons = {
    info: <Info className="text-blue-400" size={24} />,
    warning: <AlertTriangle className="text-yellow-500" size={24} />,
    error: <AlertCircle className="text-red-500" size={24} />,
    success: <CheckCircle2 className="text-xbox-green" size={24} />,
  };

  const colors = {
    info: 'border-blue-500/30 bg-blue-500/5',
    warning: 'border-yellow-500/30 bg-yellow-500/5',
    error: 'border-red-500/30 bg-red-500/5',
    success: 'border-xbox-green/30 bg-xbox-green/5',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200]"
          />
          <div className="fixed inset-0 flex items-center justify-center z-[210] p-4 pointer-events-none">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`w-full ${maxWidth} bg-surface-card border border-surface-border rounded-3xl shadow-2xl overflow-hidden pointer-events-auto`}
            >
              <div className={`p-6 border-b border-surface-border flex items-center justify-between ${colors[type]}`}>
                <div className="flex items-center gap-4">
                  {icons[type]}
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">{title}</h3>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-gray-500 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-8">
                {children}
              </div>

              {footer && (
                <div className="p-6 bg-surface-panel/50 border-t border-surface-border flex justify-end gap-3">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
