import React from 'react';
import { motion } from 'motion/react';
import {
  History,
  CheckCircle2,
  ShieldAlert,
  ShoppingBag,
  Sparkles,
  Zap,
  Trash2,
} from 'lucide-react';
import { ActivityLog } from '../types';

interface ActivityLogViewProps {
  logs: ActivityLog[];
  onClearLogs: () => void;
}

export const ActivityLogView: React.FC<ActivityLogViewProps> = ({ logs, onClearLogs }) => {
  const getLogIcon = (type: ActivityLog['type']) => {
    switch (type) {
      case 'task_complete':
        return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'task_uncomplete':
        return <Zap className="w-4 h-4 text-gray-400" />;
      case 'penalty':
        return <ShieldAlert className="w-4 h-4 text-red-400" />;
      case 'purchase':
        return <ShoppingBag className="w-4 h-4 text-purple-400" />;
      case 'levelup':
        return <Sparkles className="w-4 h-4 text-amber-400" />;
      default:
        return <History className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatTime = (timestamp: number) => {
    const d = new Date(timestamp);
    return (
      d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
      ' ' +
      d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-extrabold font-gamer tracking-wide text-white flex items-center gap-2">
            <span>ЖУРНАЛ АКТИВНОСТИ И НАГРАД</span>
            <span className="text-xs font-mono-code bg-sky-500/15 text-sky-400 border border-sky-500/30 px-2.5 py-0.5 rounded-full">
              {logs.length} записей
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Хронология выполнения задач, покупок в магазине, повышений званий и штрафов
          </p>
        </div>

        {logs.length > 0 && (
          <button
            onClick={onClearLogs}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-800 text-xs font-gamer text-slate-400 hover:text-red-400 hover:bg-red-950/20 transition-colors cursor-pointer shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Очистить журнал</span>
          </button>
        )}
      </div>

      {logs.length === 0 ? (
        <div className="p-12 text-center bg-[#0F172A] rounded-2xl border border-dashed border-slate-800 text-slate-400">
          <History className="h-8 w-8 mx-auto text-slate-500 mb-2" />
          <p className="font-gamer font-bold text-sm text-slate-300">Журнал событий пуст</p>
          <p className="text-xs text-slate-500 mt-1">
            Выполняйте задачи, получайте звания и совершайте покупки в магазине!
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
          {logs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-start justify-between gap-4 p-3.5 rounded-2xl border border-slate-800 bg-[#0F172A] backdrop-blur-md hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#0B0F19] border border-slate-800 mt-0.5">
                  {getLogIcon(log.type)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-gamer font-bold text-sm text-white truncate">
                      {log.title}
                    </h4>
                    <span className="text-[10px] font-mono-code text-slate-500 shrink-0">
                      {formatTime(log.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    {log.details}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {log.xpChange !== undefined && log.xpChange !== 0 && (
                  <span
                    className={`font-mono-code font-bold text-xs px-2 py-0.5 rounded-lg border ${
                      log.xpChange > 0
                        ? 'text-sky-400 bg-sky-500/10 border-sky-500/20'
                        : 'text-red-400 bg-red-500/10 border-red-500/20'
                    }`}
                  >
                    {log.xpChange > 0 ? `+${log.xpChange}` : log.xpChange} XP
                  </span>
                )}

                {log.uxpChange !== undefined && log.uxpChange !== 0 && (
                  <span
                    className={`font-mono-code font-bold text-xs px-2 py-0.5 rounded-lg border ${
                      log.uxpChange > 0
                        ? 'text-indigo-300 bg-indigo-500/10 border-indigo-500/20'
                        : 'text-red-400 bg-red-500/10 border-red-500/20'
                    }`}
                  >
                    {log.uxpChange > 0 ? `+${log.uxpChange}` : log.uxpChange} UXP
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
