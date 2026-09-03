import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Plus,
  Trash2,
  Sparkles,
  Coins,
  Calendar,
  Layers,
  Check,
  AlertCircle,
  Clock,
  HelpCircle,
} from 'lucide-react';
import {
  Task,
  TaskType,
  TaskOption,
  TaskRecurrence,
  TaskDifficulty,
  Category,
} from '../types';
import { getTodayDateString } from '../data/initialData';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: Category;
  categoryId?: string;
  selectedDate?: string;
  initialDate?: string;
  taskToEdit?: Task | null;
  onSaveTask?: (taskData: Omit<Task, 'id' | 'isCompleted'> & { id?: string }) => void;
  onSave?: (taskData: Omit<Task, 'id' | 'isCompleted'> & { id?: string }) => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  category,
  categoryId,
  selectedDate,
  initialDate,
  taskToEdit,
  onSaveTask,
  onSave,
}) => {
  const effectiveCategoryName = category?.name || 'Направление';
  const effectiveCategoryColor = category?.color || '#3b82f6';
  const effectiveCategoryId = category?.id || categoryId || '';
  const effectiveDate = initialDate || selectedDate || getTodayDateString();
  const effectiveOnSave = onSave || onSaveTask;
  const [taskType, setTaskType] = useState<TaskType>('standard');
  const [title, setTitle] = useState('');
  const [xpReward, setXpReward] = useState<number>(100);
  const [uxpReward, setUxpReward] = useState<number>(0);
  const [difficulty, setDifficulty] = useState<TaskDifficulty>('Easy');
  const [recurrence, setRecurrence] = useState<TaskRecurrence>('none');
  const [repeatDays, setRepeatDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Multi-task options state (at least 2 options)
  const [options, setOptions] = useState<TaskOption[]>([
    { id: `opt-${Date.now()}-1`, title: 'Легкий вариант (15 мин)', xpReward: 100, uxpReward: 0 },
    { id: `opt-${Date.now()}-2`, title: 'Полный вариант (45 мин)', xpReward: 300, uxpReward: 5 },
  ]);

  useEffect(() => {
    if (taskToEdit) {
      setTaskType(taskToEdit.type || 'standard');
      setTitle(taskToEdit.title);
      setXpReward(taskToEdit.xpReward || 100);
      setUxpReward(taskToEdit.uxpReward || 0);
      setDifficulty(taskToEdit.difficulty || 'Easy');
      setRecurrence(taskToEdit.recurrence || 'none');
      setRepeatDays(taskToEdit.repeatDays || [1, 2, 3, 4, 5]);
      setNotes(taskToEdit.notes || '');

      if (taskToEdit.options && taskToEdit.options.length >= 2) {
        setOptions(taskToEdit.options);
      } else {
        setOptions([
          { id: `opt-${Date.now()}-1`, title: 'Вариант 1', xpReward: 100, uxpReward: 0 },
          { id: `opt-${Date.now()}-2`, title: 'Вариант 2', xpReward: 250, uxpReward: 0 },
        ]);
      }
    } else {
      setTaskType('standard');
      setTitle('');
      setXpReward(100);
      setUxpReward(0);
      setDifficulty('Easy');
      setRecurrence('none');
      setRepeatDays([1, 2, 3, 4, 5]);
      setNotes('');
      setOptions([
        { id: `opt-${Date.now()}-1`, title: 'Базовый объем', xpReward: 100, uxpReward: 0 },
        { id: `opt-${Date.now()}-2`, title: 'Усиленный объем', xpReward: 300, uxpReward: 5 },
      ]);
    }
    setErrorMsg('');
  }, [taskToEdit, isOpen]);

  if (!isOpen) return null;

  const handleAddOption = () => {
    const newId = `opt-${Date.now()}-${options.length + 1}`;
    setOptions((prev) => [
      ...prev,
      {
        id: newId,
        title: `Вариант ${prev.length + 1}`,
        xpReward: 200,
        uxpReward: 0,
      },
    ]);
  };

  const handleRemoveOption = (idToRemove: string) => {
    if (options.length <= 2) {
      setErrorMsg('Мульти-задача должна содержать минимум 2 варианта выполнения!');
      return;
    }
    setErrorMsg('');
    setOptions((prev) => prev.filter((o) => o.id !== idToRemove));
  };

  const handleOptionChange = (
    id: string,
    field: 'title' | 'xpReward' | 'uxpReward',
    value: string | number
  ) => {
    setOptions((prev) =>
      prev.map((opt) => (opt.id === id ? { ...opt, [field]: value } : opt))
    );
  };

  const toggleDay = (dayNum: number) => {
    setRepeatDays((prev) =>
      prev.includes(dayNum) ? prev.filter((d) => d !== dayNum) : [...prev, dayNum].sort()
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Укажите название задачи!');
      return;
    }

    if (taskType === 'multi') {
      if (options.length < 2) {
        setErrorMsg('Мульти-задача должна содержать минимум 2 варианта!');
        return;
      }
      for (const opt of options) {
        if (!opt.title.trim()) {
          setErrorMsg('Заполните название для всех вариантов мульти-задачи!');
          return;
        }
        if (opt.xpReward < 0) {
          setErrorMsg('XP награда вариантов не может быть отрицательной!');
          return;
        }
      }
    }

    const todayStr = getTodayDateString();

    const taskPayload = {
      ...(taskToEdit ? { id: taskToEdit.id } : {}),
      categoryId: effectiveCategoryId,
      date: taskToEdit?.date || effectiveDate,
      title: title.trim(),
      type: taskType,
      xpReward: taskType === 'multi' ? (options[0]?.xpReward || 0) : Number(xpReward),
      uxpReward: taskType === 'multi' ? (options[0]?.uxpReward || 0) : Number(uxpReward),
      difficulty,
      recurrence,
      repeatDays: recurrence === 'weekly' ? repeatDays : undefined,
      notes: notes.trim() || undefined,
      options: taskType === 'multi' ? options : undefined,
      createdAt: taskToEdit?.createdAt || todayStr,
    };

    if (effectiveOnSave) {
      effectiveOnSave(taskPayload);
    }
    onClose();
  };

  const weekDayLabels = [
    { num: 1, label: 'Пн' },
    { num: 2, label: 'Вт' },
    { num: 3, label: 'Ср' },
    { num: 4, label: 'Чт' },
    { num: 5, label: 'Пт' },
    { num: 6, label: 'Сб' },
    { num: 7, label: 'Вс' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="w-full max-w-xl bg-[#0F172A] border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-[0_0_50px_rgba(0,0,0,0.8)] text-slate-100 relative flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center border shrink-0"
              style={{
                backgroundColor: `${effectiveCategoryColor}15`,
                borderColor: `${effectiveCategoryColor}40`,
                color: effectiveCategoryColor,
              }}
            >
              {taskType === 'multi' ? <Layers className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-gamer font-bold text-base sm:text-lg text-white">
                {taskToEdit ? 'РЕДАКТИРОВАТЬ ЗАДАЧУ' : 'НОВАЯ ЗАДАЧА'}
              </h3>
              <p className="text-xs text-slate-400">
                Направление: <span style={{ color: effectiveCategoryColor }}>{effectiveCategoryName}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mt-3 p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 my-3 text-xs overflow-y-auto pr-1 flex-1">
          {/* Task Type Switcher (Standard vs Multi-task) */}
          <div>
            <label className="block text-slate-300 font-gamer font-bold mb-1.5 uppercase">
              Тип задачи:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTaskType('standard')}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 font-gamer text-xs font-bold transition-all cursor-pointer ${
                  taskType === 'standard'
                    ? 'border-sky-500 bg-sky-500/15 text-sky-400 shadow-[0_0_12px_rgba(14,165,233,0.2)]'
                    : 'border-slate-800 bg-[#0B0F19] text-slate-400 hover:text-slate-200'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>Обычная задача</span>
              </button>

              <button
                type="button"
                onClick={() => setTaskType('multi')}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 font-gamer text-xs font-bold transition-all cursor-pointer ${
                  taskType === 'multi'
                    ? 'border-purple-500 bg-purple-500/15 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.2)]'
                    : 'border-slate-800 bg-[#0B0F19] text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Мульти-задача (Варианты)</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {taskType === 'standard'
                ? 'Одиночная задача с фиксированной наградой XP.'
                : 'Позволяет добавить несколько вариантов выполнения, из которых в день выбирается ровно один.'}
            </p>
          </div>

          {/* Title */}
          <div>
            <label className="block text-slate-300 font-gamer font-bold mb-1">
              Название задачи: *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={taskType === 'multi' ? 'Например: Тренировка дня' : 'Например: Решить 3 задачи на LeetCode'}
              className="w-full bg-[#0B0F19] border border-slate-800 focus:border-sky-500 rounded-xl px-3.5 py-2.5 text-white outline-none text-xs font-medium"
            />
          </div>

          {/* Standard Task Rewards */}
          {taskType === 'standard' ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-gamer font-bold mb-1 flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  <span>Награда XP (Категория):</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={xpReward}
                  onChange={(e) => setXpReward(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-[#0B0F19] border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2 text-white outline-none text-xs font-mono-code"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-gamer font-bold mb-1 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                  <span>Бонус UXP (Глобальный):</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={uxpReward}
                  onChange={(e) => setUxpReward(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-[#0B0F19] border border-slate-800 focus:border-sky-500 rounded-xl px-3.5 py-2 text-white outline-none text-xs font-mono-code"
                />
              </div>
            </div>
          ) : (
            /* Multi-Task Options Management */
            <div className="space-y-3 pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between">
                <label className="text-slate-200 font-gamer font-bold flex items-center gap-1.5 uppercase">
                  <Layers className="w-4 h-4 text-purple-400" />
                  <span>Варианты выполнения (Минимум 2):</span>
                </label>

                <button
                  type="button"
                  onClick={handleAddOption}
                  className="px-2.5 py-1 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-300 hover:bg-purple-500/25 font-gamer font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>ДОБАВИТЬ ВАРИАНТ</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {options.map((opt, idx) => (
                  <div
                    key={opt.id}
                    className="p-3 rounded-xl border border-slate-800 bg-[#0B0F19] space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono-code font-bold text-[11px] text-purple-400 shrink-0">
                        Вариант #{idx + 1}:
                      </span>
                      {options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(opt.id)}
                          className="text-slate-500 hover:text-red-400 p-1 rounded transition-colors cursor-pointer"
                          title="Удалить вариант"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      required
                      value={opt.title}
                      onChange={(e) => handleOptionChange(opt.id, 'title', e.target.value)}
                      placeholder="Название варианта (например: Сделать за 15 минут)"
                      className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-lg px-3 py-1.5 text-white outline-none text-xs"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">Награда XP:</span>
                        <input
                          type="number"
                          min="0"
                          required
                          value={opt.xpReward}
                          onChange={(e) =>
                            handleOptionChange(opt.id, 'xpReward', Math.max(0, parseInt(e.target.value) || 0))
                          }
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-amber-400 font-mono-code text-xs outline-none"
                        />
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">Бонус UXP (опц.):</span>
                        <input
                          type="number"
                          min="0"
                          value={opt.uxpReward || 0}
                          onChange={(e) =>
                            handleOptionChange(opt.id, 'uxpReward', Math.max(0, parseInt(e.target.value) || 0))
                          }
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-sky-400 font-mono-code text-xs outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recurrence Selection */}
          <div className="pt-2 border-t border-slate-800/80">
            <label className="block text-slate-300 font-gamer font-bold mb-1.5 uppercase">
              Периодичность повторения:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRecurrence('none')}
                className={`py-2 px-2 rounded-xl border text-center font-gamer text-xs font-bold transition-all cursor-pointer ${
                  recurrence === 'none'
                    ? 'border-sky-500 bg-sky-500/15 text-sky-400'
                    : 'border-slate-800 bg-[#0B0F19] text-slate-400'
                }`}
              >
                Однократно
              </button>

              <button
                type="button"
                onClick={() => setRecurrence('daily')}
                className={`py-2 px-2 rounded-xl border text-center font-gamer text-xs font-bold transition-all cursor-pointer ${
                  recurrence === 'daily'
                    ? 'border-sky-500 bg-sky-500/15 text-sky-400'
                    : 'border-slate-800 bg-[#0B0F19] text-slate-400'
                }`}
              >
                Каждый день
              </button>

              <button
                type="button"
                onClick={() => setRecurrence('weekly')}
                className={`py-2 px-2 rounded-xl border text-center font-gamer text-xs font-bold transition-all cursor-pointer ${
                  recurrence === 'weekly'
                    ? 'border-sky-500 bg-sky-500/15 text-sky-400'
                    : 'border-slate-800 bg-[#0B0F19] text-slate-400'
                }`}
              >
                По дням недели
              </button>
            </div>
          </div>

          {/* Repeat days for weekly recurrence */}
          {recurrence === 'weekly' && (
            <div className="p-3 bg-[#0B0F19] rounded-xl border border-slate-800">
              <span className="text-slate-400 text-xs block mb-2 font-gamer">Дни повторения:</span>
              <div className="flex items-center justify-between gap-1">
                {weekDayLabels.map((day) => {
                  const isSelected = repeatDays.includes(day.num);
                  return (
                    <button
                      key={day.num}
                      type="button"
                      onClick={() => toggleDay(day.num)}
                      className={`w-9 h-9 rounded-lg font-gamer font-bold text-xs flex items-center justify-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-sky-500 text-white shadow-md'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notes / Description */}
          <div>
            <label className="block text-slate-400 mb-1">Заметки / Подсказка к задаче (опционально):</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Дополнительные детали или условия..."
              className="w-full bg-[#0B0F19] border border-slate-800 focus:border-sky-500 rounded-xl p-3 text-white outline-none resize-none text-xs font-sans"
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-gamer font-bold text-xs cursor-pointer transition-colors"
            >
              ОТМЕНА
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-gamer font-bold text-xs shadow-[0_0_15px_rgba(14,165,233,0.3)] cursor-pointer transition-all"
            >
              {taskToEdit ? 'СОХРАНИТЬ ИЗМЕНЕНИЯ' : 'СОЗДАТЬ ЗАДАЧУ'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
