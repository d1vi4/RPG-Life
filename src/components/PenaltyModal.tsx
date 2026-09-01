import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  ShieldAlert,
  X,
  Coins,
} from 'lucide-react';
import { Category, Penalty } from '../types';

interface PenaltyModalProps {
  isOpen: boolean;
  onClose: () => void;
  penalties: Penalty[];
  categories: Category[];
  onApplyPenalty: (penalty: Penalty, targetCategoryId?: string) => void;
}

export const PenaltyModal: React.FC<PenaltyModalProps> = ({
  isOpen,
  onClose,
  penalties,
  categories,
  onApplyPenalty,
}) => {
  const [selectedPenaltyId, setSelectedPenaltyId] = useState<string>(
    penalties[0]?.id || ''
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    categories[0]?.id || ''
  );

  useEffect(() => {
    if (penalties.length > 0 && !selectedPenaltyId) {
      setSelectedPenaltyId(penalties[0].id);
    }
  }, [penalties, selectedPenaltyId]);

  useEffect(() => {
    if (categories.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories, selectedCategoryId]);

  if (!isOpen) return null;

  const selectedPenalty = penalties.find((p) => p.id === selectedPenaltyId);
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  const handleApply = () => {
    if (!selectedPenalty) return;
    onApplyPenalty(selectedPenalty, selectedCategoryId || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100 relative"
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-gamer font-bold text-base text-white">
                ПРИМЕНИТЬ ДИСЦИПЛИНАРНЫЙ ШТРАФ
              </h3>
              <p className="text-xs text-slate-400">
                Списание очков за нарушение режима для стимуляции дисциплины
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 my-4 text-xs">
          {/* Target Category Selector */}
          {categories.length > 0 ? (
            <div>
              <label className="block text-slate-300 font-gamer font-bold mb-1.5 uppercase">
                Категория списания XP:
              </label>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-[#0B0F19] px-3.5 py-2.5 text-white font-gamer focus:border-red-400 focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (Баланс: {c.categoryXP} XP)
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="p-3 bg-[#0B0F19] rounded-xl border border-slate-800 text-slate-400">
              Категории еще не созданы. Штраф будет зафиксирован в журнале.
            </div>
          )}

          {/* Penalty Type */}
          <div>
            <label className="block text-slate-300 font-gamer font-bold mb-1.5 uppercase">
              Тип нарушения:
            </label>
            {penalties.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-slate-800 text-slate-400 text-center">
                Список штрафов пуст. Вы можете добавить шаблоны штрафов во вкладке «Настройки системы».
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {penalties.map((p) => {
                  const isSelected = p.id === selectedPenaltyId;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPenaltyId(p.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-red-500 bg-red-950/30'
                          : 'border-slate-800 bg-[#0B0F19] hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <span className="font-gamer font-bold text-white text-xs block">{p.name}</span>
                        <p className="text-[11px] text-slate-400 mt-0.5">{p.actionDescription}</p>
                      </div>

                      <span className="font-mono-code font-bold text-red-400 text-xs shrink-0 ml-2">
                        -{p.xpDeduction} XP
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {selectedPenalty && (
            <div className="bg-red-950/20 border border-red-500/30 p-3 rounded-xl space-y-1">
              <span className="text-[11px] font-gamer font-bold text-red-400 block uppercase">
                Последствие для дисциплины:
              </span>
              <p className="text-xs text-slate-300 font-gamer leading-relaxed">
                {selectedPenalty.actionDescription}
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-800 text-slate-300 font-gamer text-xs cursor-pointer hover:bg-slate-900"
          >
            ОТМЕНА
          </button>
          <button
            type="button"
            disabled={!selectedPenalty}
            onClick={handleApply}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white font-gamer font-bold text-xs cursor-pointer shadow-md disabled:opacity-50"
          >
            ПРИМЕНИТЬ ШТРАФ
          </button>
        </div>
      </motion.div>
    </div>
  );
};
