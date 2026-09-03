import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Sparkles,
  CheckCircle2,
  Circle,
  Coins,
  AlertCircle,
  Layers,
  RotateCcw,
} from 'lucide-react';
import { Task, TaskOption, Category } from '../types';

interface MultiTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  category?: Category;
  dateStr: string;
  isLocked: boolean; // Past day lock
  onSelectOption: (taskId: string, dateStr: string, optionId: string | null) => void;
}

export const MultiTaskModal: React.FC<MultiTaskModalProps> = ({
  isOpen,
  onClose,
  task,
  category,
  dateStr,
  isLocked,
  onSelectOption,
}) => {
  if (!isOpen || !task) return null;

  const options: TaskOption[] = task.options || [];

  // Determine currently selected option for this date
  const currentSelectedOptionId =
    task.recurrence === 'none'
      ? task.selectedOptionId
      : task.selectedOptionByDate?.[dateStr];

  const [hoveredOptionId, setHoveredOptionId] = useState<string | null>(null);

  const handleChooseOption = (optionId: string) => {
    if (isLocked) return;
    onSelectOption(task.id, dateStr, optionId);
    onClose();
  };

  const handleCancelSelection = () => {
    if (isLocked) return;
    onSelectOption(task.id, dateStr, null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="w-full max-w-lg bg-[#0F172A] border border-sky-500/40 rounded-2xl p-5 sm:p-6 shadow-[0_0_40px_rgba(14,165,233,0.25)] text-slate-100 relative flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center border shrink-0"
              style={{
                backgroundColor: category ? `${category.color}20` : '#0ea5e920',
                borderColor: category ? `${category.color}50` : '#0ea5e950',
                color: category?.color || '#0ea5e9',
              }}
            >
              <Layers className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-gamer font-bold px-2 py-0.5 rounded bg-sky-500/15 text-sky-400 border border-sky-500/30 uppercase">
                  Мульти-задача
                </span>
                <span className="text-xs text-slate-400 font-mono-code">{dateStr}</span>
              </div>
              <h3 className="font-gamer font-bold text-base sm:text-lg text-white mt-1 truncate">
                {task.title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informational description */}
        <div className="mt-3 text-xs text-slate-400 flex items-center justify-between">
          <span>Выберите один из вариантов выполнения на сегодня:</span>
          {isLocked && (
            <span className="text-amber-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              День заблокирован (00:00)
            </span>
          )}
        </div>

        {/* Options list */}
        <div className="my-4 space-y-2.5 overflow-y-auto pr-1 flex-1">
          {options.length === 0 ? (
            <div className="p-6 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
              У этой мульти-задачи еще нет настроенных вариантов.
            </div>
          ) : (
            options.map((opt, idx) => {
              const isSelected = opt.id === currentSelectedOptionId;

              return (
                <div
                  key={opt.id}
                  onMouseEnter={() => setHoveredOptionId(opt.id)}
                  onMouseLeave={() => setHoveredOptionId(null)}
                  onClick={() => !isLocked && handleChooseOption(opt.id)}
                  className={`group relative p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-emerald-500/70 bg-emerald-950/30 shadow-[0_0_15px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/40'
                      : isLocked
                      ? 'border-slate-800 bg-[#0B0F19]/40 opacity-60 cursor-not-allowed'
                      : 'border-slate-800 bg-[#0B0F19] hover:border-sky-500/50 hover:bg-slate-900/80'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="shrink-0">
                      {isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
                          <CheckCircle2 className="w-5 h-5 fill-emerald-500 text-slate-950" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border border-slate-600 flex items-center justify-center text-slate-500 font-mono-code text-xs group-hover:border-sky-400 group-hover:text-sky-300">
                          {idx + 1}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4
                        className={`font-gamer font-bold text-sm truncate ${
                          isSelected ? 'text-emerald-300' : 'text-slate-100 group-hover:text-sky-300'
                        }`}
                      >
                        {opt.title}
                      </h4>
                      {isSelected && (
                        <span className="text-[10px] font-mono-code text-emerald-400 font-bold block mt-0.5">
                          ✓ Выбрано на сегодня
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Rewards badges */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1 font-mono-code text-xs font-bold px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-400">
                      <Coins className="w-3.5 h-3.5" />
                      <span>+{opt.xpReward} XP</span>
                    </div>

                    {opt.uxpReward && opt.uxpReward > 0 ? (
                      <div className="flex items-center gap-1 font-mono-code text-xs font-bold px-2 py-1 rounded-lg bg-sky-500/10 border border-sky-500/25 text-sky-400">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>+{opt.uxpReward} UXP</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer actions */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
          {currentSelectedOptionId && !isLocked ? (
            <button
              type="button"
              onClick={handleCancelSelection}
              className="px-3.5 py-2 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-gamer font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>ОТМЕНИТЬ ВЫБОР (СБРОСИТЬ НАГРАДУ)</span>
            </button>
          ) : (
            <span className="text-[11px] text-slate-500 font-mono-code">
              {currentSelectedOptionId ? 'Выбор зафиксирован' : 'Вариант не выбран'}
            </span>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-gamer font-bold text-xs cursor-pointer transition-colors"
          >
            ЗАКРЫТЬ
          </button>
        </div>
      </motion.div>
    </div>
  );
};
