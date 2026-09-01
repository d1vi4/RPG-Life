import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertTriangle, Info, Sparkles, X } from 'lucide-react';

export interface ToastNotification {
  id: string;
  type: 'success' | 'penalty' | 'info' | 'levelup';
  title: string;
  message: string;
  duration?: number;
  createdAt?: number;
}

interface ToastProps {
  toasts: ToastNotification[];
  onDismiss: (id: string) => void;
}

interface ToastItemProps {
  toast: ToastNotification;
  onDismiss: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  const duration = toast.duration || 5000;
  const createdAt = toast.createdAt || Date.now();
  const [progress, setProgress] = useState<number>(100);

  useEffect(() => {
    let animationFrameId: number;

    const updateProgress = () => {
      const elapsed = Date.now() - createdAt;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);

      if (elapsed >= duration) {
        onDismiss(toast.id);
      } else {
        animationFrameId = requestAnimationFrame(updateProgress);
      }
    };

    animationFrameId = requestAnimationFrame(updateProgress);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [toast.id, duration, createdAt, onDismiss]);

  const isSuccess = toast.type === 'success';
  const isPenalty = toast.type === 'penalty';
  const isLevelUp = toast.type === 'levelup';

  let borderClass = 'border-blue-500/40 bg-[#0d1527]/95 text-blue-200';
  let barClass = 'bg-blue-400';
  let icon = <Info className="w-5 h-5 text-blue-400 shrink-0" />;

  if (isSuccess) {
    borderClass = 'border-green-500/50 bg-[#0c1a14]/95 text-green-200 shadow-[0_0_15px_rgba(74,222,128,0.25)]';
    barClass = 'bg-gradient-to-r from-emerald-500 to-green-400';
    icon = <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />;
  } else if (isPenalty) {
    borderClass = 'border-red-500/60 bg-[#200d12]/95 text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.25)]';
    barClass = 'bg-gradient-to-r from-rose-500 to-red-400';
    icon = <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />;
  } else if (isLevelUp) {
    borderClass = 'border-amber-500/60 bg-[#1c1508]/95 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.25)]';
    barClass = 'bg-gradient-to-r from-yellow-500 to-amber-400';
    icon = <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />;
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      transition={{ type: 'spring', damping: 25, stiffness: 350 }}
      className={`pointer-events-auto p-4 rounded-xl border backdrop-blur-xl shadow-2xl flex flex-col relative overflow-hidden ${borderClass}`}
    >
      <div className="flex items-start gap-3 w-full pb-1.5">
        {icon}
        <div className="flex-1 pr-4">
          <h4 className="font-gamer font-bold text-sm tracking-wide text-white">
            {toast.title}
          </h4>
          <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{toast.message}</p>
        </div>
        <button
          onClick={() => onDismiss(toast.id)}
          className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Shrinking Millisecond Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40 overflow-hidden">
        <div
          className={`h-full ${barClass} transition-none`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </motion.div>
  );
};

export const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
};
