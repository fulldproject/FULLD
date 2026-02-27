import React, { useEffect } from 'react';
import { CheckIcon } from './Icons';

interface ToastProps {
  message: string;
  isOpen: boolean;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, isOpen, onClose, duration = 2000 }) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose, duration]);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[300] animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-[var(--text-primary)] text-[var(--bg-primary)] px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 border border-[var(--border)]">
        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
          <CheckIcon className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-xs font-black uppercase tracking-widest">{message}</span>
      </div>
    </div>
  );
};
