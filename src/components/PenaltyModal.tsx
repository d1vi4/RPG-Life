import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  ShieldAlert,
  X,
  Layers,
  Globe,
  Plus,
} from 'lucide-react';
import { Category, Penalty } from '../types';

interface PenaltyModalProps {
  isOpen: boolean;
  onClose: () => void;
  penalties: Penalty[];
  categories: Category[];
  initialCategoryId?: string | null;
  onApplyPenalty: (penalty: Penalty, targetCategoryId?: string, scope?: 'category' | 'global') => void;
}

export const PenaltyModal: React.FC<PenaltyModalProps> = ({
  isOpen,
  onClose,
  penalties,
  categories,
  initialCategoryId,
  onApplyPenalty,
}) => {
  const [scope, setScope] = useState<'category' | 'global'>(
    initialCategoryId ? 'category' : 'category'
  );
  const [selectedPenaltyId, setSelectedPenaltyId] = useState<string>(
    penalties[0]?.id || ''
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    initialCategoryId || categories[0]?.id || ''
  );

  // Quick custom penalty values if none exist
  const [customName, setCustomName] = useState('');
  const [customXP, setCustomXP] = useState(100);
  const [customDesc, setCustomDesc] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);

  useEffect(() => {
    if (initialCategoryId) {
      setSelectedCategoryId(initialCategoryId);
      setScope('category');
    } else if (categories.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [initialCategoryId, categories]);

  useEffect(() => {
    const relevantPenalties = penalties.filter((p) => {
      if (scope === 'global') return p.scope === 'global';
      return p.scope !== 'global' && p.targetCategoryId === selectedCategoryId;
    });

    if (relevantPenalties.length > 0 && !relevantPenalties.find((p) => p.id === selectedPenaltyId)) {
      setSelectedPenaltyId(relevantPenalties[0].id);
    }
  }, [penalties, scope, selectedCategoryId, selectedPenaltyId]);

  if (!isOpen) return null;

  const relevantPenalties = penalties.filter((p) => {
    if (scope === 'global') return p.scope === 'global';
    return p.scope !== 'global' && p.targetCategoryId === selectedCategoryId;
  });

  const selectedPenalty = penalties.find((p) => p.id === selectedPenaltyId);
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  const handleApply = () => {
    if (isCustomMode) {
      if (!customName.trim() || customXP <= 0) return;
      const customPenaltyObj: Penalty = {
        id: `custom-pen-${Date.now()}`,
        name: customName.trim(),
        xpDeduction: Number(customXP),
        actionDescription: customDesc.trim() || 'Дисциплинарное списание',
        scope,
        targetCategoryId: scope === 'category' ? selectedCategoryId : null,
      };
      onApplyPenalty(customPenaltyObj, scope === 'category' ? selectedCategoryId : undefined, scope);
      onClose();
      return;
    }

    if (!selectedPenalty) return;
    onApplyPenalty(
      selectedPenalty,
      scope === 'category' ? selectedCategoryId || undefined : undefined,
      scope
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-[#0F172A] border border-red-500/40 rounded-2xl p-5 sm:p-6 shadow-[0_0_40px_rgba(239,68,68,0.2)] text-slate-100 relative max-h-[92vh] flex flex-col"
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-gamer font-bold text-base text-white">
                ПРИМЕНИТЬ ДИСЦИПЛИНАРНЫЙ ШТРАФ
              </h3>
              <p className="text-xs text-slate-400">
                Списывает очки и титульный рекорд за нарушение режима
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 my-4 text-xs flex-1 overflow-y-auto pr-1">
          {/* Scope Selector: Category XP vs Global UXP */}
          <div>
            <label className="block text-slate-300 font-gamer font-bold mb-1.5 uppercase">
              Тип штрафа:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setScope('category')}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 font-gamer text-xs font-bold transition-all cursor-pointer ${
                  scope === 'category'
                    ? 'border-amber-500/60 bg-amber-500/15 text-amber-300 shadow-sm'
                    : 'border-slate-800 bg-[#0B0F19] text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Штраф категории (XP)</span>
              </button>

              <button
                type="button"
                onClick={() => setScope('global')}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 font-gamer text-xs font-bold transition-all cursor-pointer ${
                  scope === 'global'
                    ? 'border-purple-500/60 bg-purple-500/15 text-purple-300 shadow-sm'
                    : 'border-slate-800 bg-[#0B0F19] text-slate-400 hover:text-slate-200'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Общий штраф (UXP)</span>
              </button>
            </div>
          </div>

          {/* Target Category Selector (if category scope) */}
          {scope === 'category' && (
            <div>
              <label className="block text-slate-300 font-gamer font-bold mb-1.5 uppercase">
                Категория списания XP:
              </label>
              {categories.length > 0 ? (
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-[#0B0F19] px-3.5 py-2.5 text-white font-gamer focus:border-red-400 focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Баланс: {c.categoryXP} XP | Титул: {c.highestCategoryXP || c.categoryXP} XP)
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-3 bg-[#0B0F19] rounded-xl border border-slate-800 text-slate-400">
                  Категории еще не созданы.
                </div>
              )}
            </div>
          )}

          {/* Penalty selection or custom mode toggle */}
          <div className="flex items-center justify-between">
            <label className="block text-slate-300 font-gamer font-bold uppercase">
              {isCustomMode ? 'Собственный разовый штраф:' : 'Шаблон нарушения:'}
            </label>
            <button
              type="button"
              onClick={() => setIsCustomMode((prev) => !prev)}
              className="text-[11px] font-gamer text-sky-400 hover:underline cursor-pointer"
            >
              {isCustomMode ? 'Выбрать из шаблонов' : '+ Ввести разовый штраф'}
            </button>
          </div>

          {isCustomMode ? (
            <div className="p-3.5 rounded-xl border border-red-500/30 bg-[#0B0F19] space-y-3">
              <div>
                <label className="block text-slate-400 mb-1">Причина нарушения:</label>
                <input
                  type="text"
                  placeholder="например, Пропуск занятия, лень, срыв дедлайна"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-[#0F172A] px-3 py-2 text-white focus:border-red-400 focus:outline-none text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">
                  Списать {scope === 'category' ? 'XP и Титульный XP' : 'UXP и Титульный UXP'}:
                </label>
                <input
                  type="number"
                  min={1}
                  value={customXP}
                  onChange={(e) => setCustomXP(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-800 bg-[#0F172A] px-3 py-2 text-red-400 font-mono-code font-bold focus:border-red-400 focus:outline-none text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Дисциплинарное последствие (необязательно):</label>
                <input
                  type="text"
                  placeholder="например, 50 отжиманий, 1 час без телефона"
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-[#0F172A] px-3 py-2 text-white focus:border-red-400 focus:outline-none text-xs"
                />
              </div>
            </div>
          ) : (
            <div>
              {relevantPenalties.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-800 text-slate-400 text-center space-y-2">
                  <p>Нет готовых шаблонов для выбранного типа.</p>
                  <button
                    type="button"
                    onClick={() => setIsCustomMode(true)}
                    className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 font-gamer text-xs"
                  >
                    Ввести разовый штраф вручную
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {relevantPenalties.map((p) => {
                    const isSelected = p.id === selectedPenaltyId;
                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedPenaltyId(p.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'border-red-500 bg-red-950/30 ring-1 ring-red-500/30'
                            : 'border-slate-800 bg-[#0B0F19] hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <span className="font-gamer font-bold text-white text-xs block">{p.name}</span>
                          <p className="text-[11px] text-slate-400 mt-0.5">{p.actionDescription}</p>
                        </div>

                        <span className="font-mono-code font-bold text-red-400 text-xs shrink-0 ml-2">
                          -{p.xpDeduction} {scope === 'global' ? 'UXP' : 'XP'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="bg-red-950/20 border border-red-500/30 p-3 rounded-xl space-y-1">
            <span className="text-[11px] font-gamer font-bold text-red-400 block uppercase">
              Внимание:
            </span>
            <p className="text-[11px] text-slate-300 font-gamer leading-relaxed">
              Штраф списывает как расходный баланс ({scope === 'global' ? 'UXP' : 'XP'}), так и{' '}
              <span className="text-red-300 font-bold">Титульный рекорд</span>{' '}
              {scope === 'global' ? 'общего аккаунта' : 'выбранной категории'}.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-800 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-800 text-slate-300 font-gamer text-xs cursor-pointer hover:bg-slate-900"
          >
            ОТМЕНА
          </button>
          <button
            type="button"
            disabled={!isCustomMode && !selectedPenalty}
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

