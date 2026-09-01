import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  ArrowRight,
  Clock,
  X,
  ShoppingBag,
  Award,
  Coins,
  Sparkles,
  Trash2,
  AlertTriangle,
  ShieldAlert,
} from 'lucide-react';
import { Category, Task } from '../types';
import { DynamicIcon, AVAILABLE_ICONS } from './DynamicIcon';
import { getTodayDateString, getDayOfWeek } from '../data/initialData';
import { calculateCategoryProgression } from '../utils/progression';

interface CategoryGridProps {
  categories: Category[];
  tasks: Task[];
  onSelectCategory: (categoryId: string) => void;
  onAddCategory: (category: Omit<Category, 'id' | 'categoryXP' | 'highestCategoryXP' | 'levels' | 'shopItems'>) => void;
  onDeleteCategory: (categoryId: string) => void;
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({
  categories,
  tasks,
  onSelectCategory,
  onAddCategory,
  onDeleteCategory,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#10b981');
  const [icon, setIcon] = useState('Code2');
  const [description, setDescription] = useState('');

  // 2-step deletion state for accidental deletion protection
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [deleteConfirmStep, setDeleteConfirmStep] = useState<1 | 2>(1);

  const todayStr = getTodayDateString();
  const todayDayOfWeek = getDayOfWeek(todayStr);

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddCategory({
      name: name.trim(),
      color,
      icon,
      description: description.trim() || undefined,
    });

    setName('');
    setDescription('');
    setIsAddModalOpen(false);
  };

  const handleStartDelete = (cat: Category, e: React.MouseEvent) => {
    e.stopPropagation();
    setCategoryToDelete(cat);
    setDeleteConfirmStep(1);
  };

  const handleConfirmFinalDelete = () => {
    if (!categoryToDelete) return;
    onDeleteCategory(categoryToDelete.id);
    setCategoryToDelete(null);
    setDeleteConfirmStep(1);
  };

  const PRESET_COLORS = [
    '#10b981', // Emerald
    '#06b6d4', // Cyan
    '#3b82f6', // Blue
    '#a855f7', // Purple
    '#ec4899', // Pink
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#8b5cf6', // Violet
  ];

  return (
    <div className="space-y-6">
      {/* Header section with Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold font-gamer tracking-wide text-white flex items-center gap-2">
            <span>НАПРАВЛЕНИЯ & КАТЕГОРИИ</span>
            <span className="text-xs font-mono-code bg-sky-500/15 text-sky-400 border border-sky-500/30 px-2.5 py-0.5 rounded-full">
              {categories.length} категорий
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Изолированные направления с персональным балансом XP, званиями, магазином и календарем задач
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-gamer font-bold text-xs sm:text-sm shadow-[0_0_15px_rgba(14,165,233,0.3)] cursor-pointer transition-all shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>СОЗДАТЬ КАТЕГОРИЮ</span>
        </motion.button>
      </div>

      {/* Grid of Category Cards */}
      {categories.length === 0 ? (
        <div className="p-12 text-center bg-[#0F172A] rounded-2xl border border-dashed border-slate-800 text-slate-400">
          <Award className="h-10 w-10 mx-auto text-slate-500 mb-3" />
          <p className="font-gamer font-bold text-base text-slate-200">Категории пока не созданы</p>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Нажмите кнопку «Создать категорию» выше, чтобы добавить ваше первое направление (например: Программирование, Спорт, Математика, Английский).
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-gamer font-bold text-xs cursor-pointer transition-colors shadow-lg"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>ДОБАВИТЬ ПЕРВУЮ КАТЕГОРИЮ</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map((category) => {
            const prog = calculateCategoryProgression(
              category.categoryXP || 0,
              category.highestCategoryXP || 0,
              category.levels || []
            );

            // Filter today's tasks including recurring tasks
            const categoryTasksToday = tasks.filter((t) => {
              if (t.categoryId !== category.id) return false;
              if (t.recurrence === 'daily') return true;
              if (t.recurrence === 'weekly') {
                return (t.repeatDays || []).includes(todayDayOfWeek);
              }
              return t.date === todayStr;
            });

            const completedTasksToday = categoryTasksToday.filter((t) => {
              if (t.recurrence === 'none') return t.isCompleted;
              return (t.completedDates || []).includes(todayStr);
            });

            const isAllCompletedToday =
              categoryTasksToday.length > 0 &&
              completedTasksToday.length === categoryTasksToday.length;

            return (
              <motion.div
                key={category.id}
                whileHover={{ y: -4, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectCategory(category.id)}
                className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-[#0F172A] p-5 shadow-lg backdrop-blur-xl transition-all duration-300 hover:border-sky-500/50 hover:shadow-[0_0_20px_rgba(14,165,233,0.15)] cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Category Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-2xl border shadow-lg transition-transform group-hover:scale-105"
                        style={{
                          backgroundColor: `${category.color}15`,
                          borderColor: `${category.color}40`,
                          color: category.color,
                        }}
                      >
                        <DynamicIcon name={category.icon} className="h-6 w-6" />
                      </div>

                      <div>
                        <h3 className="font-gamer font-bold text-base text-white group-hover:text-sky-400 transition-colors line-clamp-1">
                          {category.name}
                        </h3>
                        <div
                          className="text-[11px] font-mono-code font-bold uppercase tracking-wider mt-0.5 flex items-center gap-1.5"
                          style={{ color: category.color }}
                        >
                          <span>{prog.currentLevel ? prog.currentLevel.name : 'Без звания'}</span>
                        </div>
                      </div>
                    </div>

                    {/* XP & Title Badges + Delete Action */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-mono-code font-bold border border-emerald-500/20 bg-emerald-500/10 text-emerald-400" title="Доступно для покупок в магазине">
                          <Coins className="w-3 h-3" />
                          <span>{category.categoryXP.toLocaleString()} XP</span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => handleStartDelete(category, e)}
                          className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/15 transition-colors cursor-pointer"
                          title="Удалить категорию (с подтверждением)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-mono-code font-bold border border-indigo-500/20 bg-indigo-500/10 text-indigo-300" title="Максимальный титульный рекорд XP за все время">
                        <Award className="w-3 h-3 text-indigo-400" />
                        <span>{(category.highestCategoryXP || category.categoryXP).toLocaleString()} XP</span>
                      </div>
                    </div>
                  </div>

                  {category.description && (
                    <p className="mt-3 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {category.description}
                    </p>
                  )}

                  {/* Level & XP Balance Bar */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80">
                    <div className="flex justify-between items-center text-xs font-mono-code mb-1.5">
                      <span className="text-slate-400 font-gamer font-bold flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                        <span>Звание</span>
                      </span>
                      <span className="text-slate-500 text-[11px]">
                        {prog.nextLevel ? `до ${prog.nextLevel.name}: ${prog.nextLevel.requiredXP} XP` : 'MAX ЗВАНИЕ'}
                      </span>
                    </div>

                    {/* Mini progress bar */}
                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${prog.progressPercent}%`,
                          backgroundColor: category.color || '#38BDF8',
                        }}
                      />
                    </div>
                  </div>

                  {/* Today's Tasks Indicator */}
                  <div className="mt-3 flex items-center justify-between text-xs font-mono-code bg-[#0B0F19] px-3 py-2 rounded-xl border border-slate-800">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>Задачи на сегодня:</span>
                    </span>
                    <span
                      className={`font-bold ${
                        categoryTasksToday.length === 0
                          ? 'text-slate-500'
                          : isAllCompletedToday
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {completedTasksToday.length} / {categoryTasksToday.length}
                    </span>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] font-gamer text-slate-500 flex items-center gap-1">
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Товаров: {(category.shopItems || []).length}</span>
                  </span>

                  <span className="inline-flex items-center gap-1 text-xs font-gamer font-bold text-sky-400 group-hover:translate-x-0.5 transition-transform">
                    <span>ОТКРЫТЬ КАЛЕНДАРЬ</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add Category Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100 relative"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-gamer font-bold text-lg text-white">СОЗДАТЬ КАТЕГОРИЮ</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block text-slate-300 font-gamer font-bold mb-1">Название категории *</label>
                <input
                  type="text"
                  required
                  placeholder="например, Программирование, Математика, Спорт"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-[#0B0F19] px-3.5 py-2.5 text-white focus:border-sky-400 focus:outline-none text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-gamer font-bold mb-1">Описание (необязательно)</label>
                <textarea
                  rows={2}
                  placeholder="Цели, фокус тренировок или специфика..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-[#0B0F19] px-3.5 py-2 text-white focus:border-sky-400 focus:outline-none text-xs"
                />
              </div>

              {/* Color selection */}
              <div>
                <label className="block text-slate-300 font-gamer font-bold mb-1">Цветовой акцент</label>
                <div className="flex items-center gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer ${
                        color === c ? 'scale-110 border-white' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Icon selection */}
              <div>
                <label className="block text-slate-300 font-gamer font-bold mb-1">Иконка</label>
                <div className="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto p-2 bg-[#0B0F19] rounded-xl border border-slate-800">
                  {AVAILABLE_ICONS.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setIcon(ic)}
                      className={`p-2 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
                        icon === ic
                          ? 'border-sky-400 bg-sky-500/20 text-sky-300'
                          : 'border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <DynamicIcon name={ic} className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 font-gamer cursor-pointer hover:bg-slate-800"
                >
                  ОТМЕНА
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-gamer font-bold shadow-md cursor-pointer"
                >
                  СОЗДАТЬ
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      {/* 2-STEP CONFIRMATION MODAL FOR DELETING CATEGORY */}
      <AnimatePresence>
        {categoryToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#0F172A] border border-red-500/40 rounded-2xl p-6 shadow-[0_0_30px_rgba(239,68,68,0.25)] text-slate-100 relative"
            >
              {deleteConfirmStep === 1 ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-gamer font-bold text-base text-white">ШАГ 1 ИЗ 2: УДАЛЕНИЕ КАТЕГОРИИ</h3>
                      <p className="text-xs text-slate-400">Требуется подтверждение действия</p>
                    </div>
                  </div>

                  <div className="bg-[#0B0F19] p-3.5 rounded-xl border border-slate-800 space-y-2">
                    <p className="text-xs text-slate-200">
                      Вы действительно хотите удалить направление{' '}
                      <span className="font-bold text-white underline decoration-amber-400">
                        «{categoryToDelete.name}»
                      </span>
                      ?
                    </p>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      При удалении будут стёрты все привязанные задачи, звания, история выполнения и локальный прогресс.
                    </p>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setCategoryToDelete(null)}
                      className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 font-gamer text-xs cursor-pointer hover:bg-slate-800"
                    >
                      ОТМЕНА
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmStep(2)}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-gamer font-bold text-xs shadow-md cursor-pointer transition-colors flex items-center gap-1.5"
                    >
                      <span>ПРОДОЛЖИТЬ</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b border-red-500/20">
                    <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-gamer font-bold text-base text-red-400">ШАГ 2 ИЗ 2: ОКОНЧАТЕЛЬНОЕ УДАЛЕНИЕ</h3>
                      <p className="text-xs text-slate-400">Это действие невозможно отменить!</p>
                    </div>
                  </div>

                  <div className="bg-red-500/10 p-3.5 rounded-xl border border-red-500/30 text-xs text-red-200 leading-relaxed">
                    <p className="font-bold text-red-300 mb-1">Вы уверены на 100%?</p>
                    Категория «{categoryToDelete.name}» будет немедленно удалена из облака и вашего аккаунта навсегда.
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCategoryToDelete(null);
                        setDeleteConfirmStep(1);
                      }}
                      className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 font-gamer text-xs cursor-pointer hover:bg-slate-800"
                    >
                      ОТМЕНА
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmFinalDelete}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-gamer font-bold text-xs shadow-[0_0_15px_rgba(239,68,68,0.4)] cursor-pointer transition-all flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>ДА, УДАЛИТЬ НАВСЕГДА</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
