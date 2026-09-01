import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Plus,
  Calendar as CalendarIcon,
  ShoppingBag,
  Award,
  Coins,
  ChevronLeft,
  ChevronRight,
  Check,
  Lock,
  MessageSquare,
  AlertCircle,
  Clock,
  Sparkles,
  Edit2,
  Trash2,
  X,
  FileText,
  CalendarCheck,
  CalendarX,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';
import { Category, CategoryShopItem, Task, TaskDifficulty, TaskRecurrence } from '../types';
import { DynamicIcon } from './DynamicIcon';
import { FloatingReward, FloatingRewardItem } from './FloatingReward';
import { getTodayDateString, getDayOfWeek } from '../data/initialData';
import { triggerPurchaseConfetti } from '../utils/confetti';
import { soundFX } from '../utils/sound';
import { calculateCategoryProgression } from '../utils/progression';

interface CategoryViewProps {
  category: Category;
  tasks: Task[];
  dayReasons: Record<string, string>;
  onBack: () => void;
  onToggleTask: (taskId: string, date: string, note?: string, event?: React.MouseEvent) => void;
  onAddTask: (task: Omit<Task, 'id'>) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onDeleteTaskInstance: (taskId: string, dateStr: string) => void;
  onSetDayReason: (categoryId: string, date: string, reason: string) => void;
  onBuyCategoryShopItem: (categoryId: string, item: CategoryShopItem) => void;
  onOpenCategorySettings: () => void;
}

export const CategoryView: React.FC<CategoryViewProps> = ({
  category,
  tasks,
  dayReasons,
  onBack,
  onToggleTask,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onDeleteTaskInstance,
  onSetDayReason,
  onBuyCategoryShopItem,
  onOpenCategorySettings,
}) => {
  const todayStr = getTodayDateString();
  const [activeTab, setActiveTab] = useState<'calendar' | 'shop' | 'levels'>('calendar');

  // Selected Day Modal State
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);

  // Recurring task delete modal state
  const [taskToDelete, setTaskToDelete] = useState<{ task: Task; dateStr: string } | null>(null);

  // Month navigation for Calendar Grid
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth()); // 0-indexed

  // Task creation state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [xpReward, setXpReward] = useState<number>(100);
  const [uxpReward, setUxpReward] = useState<number>(15);
  const [recurrence, setRecurrence] = useState<TaskRecurrence>('none');
  const [repeatDays, setRepeatDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri default
  const [taskDate, setTaskDate] = useState<string>(todayStr);
  const [difficulty, setDifficulty] = useState<TaskDifficulty>('Medium');
  const [notes, setNotes] = useState('');

  // Editing Task state
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Completion note prompt modal state
  const [completingTaskInfo, setCompletingTaskInfo] = useState<{
    task: Task;
    date: string;
    note: string;
  } | null>(null);

  // Skip reason input modal state for past red days
  const [skipReasonModalDate, setSkipReasonModalDate] = useState<string | null>(null);
  const [skipReasonText, setSkipReasonText] = useState('');

  // Floating rewards queue
  const [floatingRewards, setFloatingRewards] = useState<FloatingRewardItem[]>([]);

  // Category progression
  const prog = calculateCategoryProgression(
    category.categoryXP || 0,
    category.highestCategoryXP || 0,
    category.levels || []
  );

  // Filter tasks strictly belonging to this category
  const categoryTasks = useMemo(() => {
    return tasks.filter((t) => t.categoryId === category.id);
  }, [tasks, category.id]);

  /**
   * Helper: Get all active tasks for a specific date (single date + recurring, excluding deleted instances)
   */
  const getTasksForDate = (dateStr: string): Task[] => {
    const dayOfWeek = getDayOfWeek(dateStr);
    return categoryTasks.filter((t) => {
      if (t.excludedDates && t.excludedDates.includes(dateStr)) return false;
      if (t.recurrence === 'daily') return true;
      if (t.recurrence === 'weekly') {
        return (t.repeatDays || []).includes(dayOfWeek);
      }
      return t.date === dateStr;
    });
  };

  /**
   * Helper: Check if a task is completed on a given date
   */
  const isTaskCompletedOnDate = (task: Task, dateStr: string): boolean => {
    if (task.recurrence === 'none') {
      return !!task.isCompleted;
    }
    return (task.completedDates || []).includes(dateStr);
  };

  /**
   * Helper: Get completion note for a task on a given date
   */
  const getTaskNoteOnDate = (task: Task, dateStr: string): string | undefined => {
    if (task.recurrence === 'none') {
      return task.completionNote;
    }
    return task.completionNotesByDate?.[dateStr] || task.completionNote;
  };

  /**
   * Calculate Day Status for Calendar Cell:
   * Returns:
   * - status: 'green' | 'red' | 'gray' | 'neutral'
   * - isPast: boolean
   * - isToday: boolean
   * - totalTasks: number
   * - completedCount: number
   * - reason?: string
   */
  const getDayStatus = (dateStr: string) => {
    const isToday = dateStr === todayStr;
    const isPast = dateStr < todayStr;
    const dayTasks = getTasksForDate(dateStr);
    const totalTasks = dayTasks.length;
    const completedCount = dayTasks.filter((t) => isTaskCompletedOnDate(t, dateStr)).length;
    const isAllCompleted = totalTasks > 0 && completedCount === totalTasks;

    const reasonKey = `${category.id}_${dateStr}`;
    const reason = dayReasons[reasonKey];

    let status: 'green' | 'red' | 'gray' | 'neutral' = 'neutral';

    if (totalTasks > 0) {
      if (isAllCompleted) {
        status = 'green';
      } else if (isPast) {
        if (reason && reason.trim().length > 0) {
          status = 'gray'; // Reason provided
        } else {
          status = 'red'; // Uncompleted past day locked at 00:00
        }
      } else if (isToday) {
        status = completedCount > 0 ? 'neutral' : 'neutral';
      }
    } else if (isPast && reason) {
      status = 'gray';
    }

    return {
      status,
      isPast,
      isToday,
      totalTasks,
      completedCount,
      isAllCompleted,
      reason,
    };
  };

  // Calendar month days calculation
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

    // Days in current month
    const numDays = lastDayOfMonth.getDate();

    // Day of week of the 1st of this month (1 = Monday, 7 = Sunday)
    let startDayOfWeek = firstDayOfMonth.getDay();
    startDayOfWeek = startDayOfWeek === 0 ? 7 : startDayOfWeek;

    // Previous month padding
    const prevMonthDays: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startDayOfWeek - 1; i > 0; i--) {
      const d = prevMonthLastDay - i + 1;
      const prevDate = new Date(currentYear, currentMonth - 1, d);
      const y = prevDate.getFullYear();
      const m = String(prevDate.getMonth() + 1).padStart(2, '0');
      const day = String(d).padStart(2, '0');
      prevMonthDays.push({
        dateStr: `${y}-${m}-${day}`,
        dayNum: d,
        isCurrentMonth: false,
      });
    }

    // Current month days
    const currentMonthDays: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];
    for (let d = 1; d <= numDays; d++) {
      const y = currentYear;
      const m = String(currentMonth + 1).padStart(2, '0');
      const day = String(d).padStart(2, '0');
      currentMonthDays.push({
        dateStr: `${y}-${m}-${day}`,
        dayNum: d,
        isCurrentMonth: true,
      });
    }

    // Next month padding to fill a complete 7-col grid (up to 35 or 42 cells)
    const totalCurrentCells = prevMonthDays.length + currentMonthDays.length;
    const remaining = (7 - (totalCurrentCells % 7)) % 7;
    const nextMonthDays: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(currentYear, currentMonth + 1, d);
      const y = nextDate.getFullYear();
      const m = String(nextDate.getMonth() + 1).padStart(2, '0');
      const day = String(d).padStart(2, '0');
      nextMonthDays.push({
        dateStr: `${y}-${m}-${day}`,
        dayNum: d,
        isCurrentMonth: false,
      });
    }

    return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
  }, [currentYear, currentMonth]);

  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleTodayMonth = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    setSelectedDate(todayStr);
  };

  // Click on a calendar day
  const handleDayClick = (dateStr: string) => {
    setSelectedDate(dateStr);
    setIsDayModalOpen(true);
  };

  // Open task creation form
  const handleOpenAddModal = (initialDate?: string) => {
    setTaskDate(initialDate || selectedDate || todayStr);
    setTitle('');
    setNotes('');
    setXpReward(100);
    setUxpReward(15);
    setRecurrence('none');
    setRepeatDays([1, 2, 3, 4, 5]);
    setIsAddModalOpen(true);
  };

  // Submit task creation
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddTask({
      categoryId: category.id,
      title: title.trim(),
      xpReward: Number(xpReward) || 0,
      uxpReward: Number(uxpReward) || 0,
      date: taskDate || todayStr,
      recurrence,
      repeatDays: recurrence === 'weekly' ? repeatDays : undefined,
      difficulty,
      notes: notes.trim() || undefined,
      isCompleted: false,
      completedDates: [],
    });

    setIsAddModalOpen(false);
  };

  // Toggle repeat day in weekly selection
  const handleToggleRepeatDay = (day: number) => {
    setRepeatDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  // Trigger task checkbox toggle
  const handleTaskCheckboxClick = (task: Task, dateStr: string, event: React.MouseEvent) => {
    const isPast = dateStr < todayStr;
    if (isPast) {
      // Past days are locked in 00:00!
      return;
    }

    const isCompleted = isTaskCompletedOnDate(task, dateStr);

    if (!isCompleted) {
      // Prompt for optional completion note
      const currentNote = getTaskNoteOnDate(task, dateStr) || '';
      setCompletingTaskInfo({
        task,
        date: dateStr,
        note: currentNote,
      });

      // Also trigger particle rewards
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top;

      setFloatingRewards((prev) => [
        ...prev,
        {
          id: `reward-${Date.now()}-${Math.random()}`,
          xp: task.xpReward,
          uxp: task.uxpReward,
          x,
          y,
        },
      ]);
    } else {
      // Uncompleting task
      onToggleTask(task.id, dateStr, undefined, event);
    }
  };

  // Confirm completion with note
  const handleConfirmCompletionNote = () => {
    if (!completingTaskInfo) return;
    onToggleTask(
      completingTaskInfo.task.id,
      completingTaskInfo.date,
      completingTaskInfo.note.trim() || undefined
    );
    setCompletingTaskInfo(null);
  };

  // Skip note and just complete
  const handleQuickComplete = () => {
    if (!completingTaskInfo) return;
    onToggleTask(completingTaskInfo.task.id, completingTaskInfo.date, undefined);
    setCompletingTaskInfo(null);
  };

  // Save reason for red skipped day
  const handleSaveSkipReason = (e: React.FormEvent) => {
    e.preventDefault();
    if (!skipReasonModalDate) return;
    onSetDayReason(category.id, skipReasonModalDate, skipReasonText.trim());
    setSkipReasonModalDate(null);
    setSkipReasonText('');
  };

  const handleOpenSkipReasonModal = (dateStr: string) => {
    const reasonKey = `${category.id}_${dateStr}`;
    setSkipReasonText(dayReasons[reasonKey] || '');
    setSkipReasonModalDate(dateStr);
  };

  // Edit task save
  const handleSaveEditTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !editingTask.title.trim()) return;

    onUpdateTask({
      ...editingTask,
      title: editingTask.title.trim(),
      xpReward: Number(editingTask.xpReward) || 0,
      uxpReward: Number(editingTask.uxpReward) || 0,
    });

    setEditingTask(null);
  };

  const handlePurchaseShopItem = (item: CategoryShopItem) => {
    if (category.categoryXP < item.costXP) return;
    soundFX.playPurchase();
    triggerPurchaseConfetti();
    onBuyCategoryShopItem(category.id, item);
  };

  // Selected date status
  const selectedDayInfo = getDayStatus(selectedDate);
  const selectedDayTasks = getTasksForDate(selectedDate);

  const WEEK_DAYS = [
    { num: 1, label: 'Пн' },
    { num: 2, label: 'Вт' },
    { num: 3, label: 'Ср' },
    { num: 4, label: 'Чт' },
    { num: 5, label: 'Пт' },
    { num: 6, label: 'Сб' },
    { num: 7, label: 'Вс' },
  ];

  return (
    <div className="space-y-6">
      {/* Floating particles */}
      <FloatingReward
        rewards={floatingRewards}
        onComplete={(id) => setFloatingRewards((prev) => prev.filter((r) => r.id !== id))}
      />

      {/* Top Banner with Back Button & Category Details */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0F172A] p-5 rounded-2xl border border-slate-800 relative overflow-hidden">
        <div
          className="absolute -top-24 -right-24 w-72 h-72 rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ backgroundColor: category.color }}
        />

        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Назад ко всем направлениям"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center border shadow-lg shrink-0"
              style={{
                backgroundColor: `${category.color}20`,
                borderColor: `${category.color}50`,
                color: category.color,
              }}
            >
              <DynamicIcon name={category.icon} className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-gamer font-bold text-xl text-white">{category.name}</h2>
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-mono-code font-bold border"
                  style={{
                    backgroundColor: `${category.color}15`,
                    borderColor: `${category.color}40`,
                    color: category.color,
                  }}
                >
                  {prog.currentLevel ? prog.currentLevel.name : 'Без звания'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {category.description || 'Изолированное направление с интерактивным календарем'}
              </p>
            </div>
          </div>
        </div>

        {/* Category Stats: Balance & Level Progress */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Spendable balance */}
          <div className="flex items-center gap-2 bg-[#0B0F19] px-3.5 py-2 rounded-xl border border-emerald-500/30">
            <Coins className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="text-[9px] font-gamer text-slate-400 block uppercase">Баланс покупок</span>
              <span className="text-xs font-mono-code font-bold text-emerald-400">
                {category.categoryXP.toLocaleString()} XP
              </span>
            </div>
          </div>

          {/* Historical Record Title XP */}
          <div className="flex items-center gap-2 bg-[#0B0F19] px-3.5 py-2 rounded-xl border border-indigo-500/30">
            <Award className="w-4 h-4 text-indigo-400 shrink-0" />
            <div>
              <span className="text-[9px] font-gamer text-indigo-300 block uppercase flex items-center gap-1">
                <span>Титульный XP (Рекорд)</span>
              </span>
              <span className="text-xs font-mono-code font-bold text-indigo-300">
                {(category.highestCategoryXP || category.categoryXP).toLocaleString()} XP
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* View Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-gamer font-bold cursor-pointer transition-colors ${
            activeTab === 'calendar'
              ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800/80'
          }`}
        >
          <CalendarIcon className="w-4 h-4" />
          <span>КАЛЕНДАРЬ И ЗАДАЧИ МЕСЯЦА</span>
        </button>

        <button
          onClick={() => setActiveTab('shop')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-gamer font-bold cursor-pointer transition-colors ${
            activeTab === 'shop'
              ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800/80'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>МАГАЗИН КАТЕГОРИИ (XP) ({(category.shopItems || []).length})</span>
        </button>

        <button
          onClick={() => setActiveTab('levels')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-gamer font-bold cursor-pointer transition-colors ${
            activeTab === 'levels'
              ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800/80'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>ЗВАНИЯ КАТЕГОРИИ (XP)</span>
        </button>
      </div>

      {/* TAB 1: CALENDAR & TASKS */}
      {activeTab === 'calendar' && (
        <div className="space-y-6">
          {/* Calendar Header Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0F172A] p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrevMonth}
                  className="p-2 rounded-xl bg-slate-800/80 border border-slate-700 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Предыдущий месяц"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-2 rounded-xl bg-slate-800/80 border border-slate-700 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Следующий месяц"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div>
                <h3 className="font-gamer font-bold text-lg text-white">
                  {monthNames[currentMonth]} {currentYear}
                </h3>
              </div>

              <button
                onClick={handleTodayMonth}
                className="px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700 text-xs font-gamer text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer"
              >
                Сегодня
              </button>
            </div>

            {/* Legend & Action Button */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Status Legend */}
              <div className="flex items-center gap-3 text-[11px] font-mono-code text-slate-400 bg-[#0B0F19] px-3 py-1.5 rounded-xl border border-slate-800">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                  <span>100% Завершено</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                  <span>Пропуск (00:00)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block" />
                  <span>Уваж. причина</span>
                </div>
              </div>

              <button
                onClick={() => handleOpenAddModal(todayStr)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-gamer font-bold text-xs shadow-md cursor-pointer transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>ДОБАВИТЬ ЗАДАЧУ</span>
              </button>
            </div>
          </div>

          {/* Month Calendar Grid */}
          <div className="bg-[#0F172A] p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-2 overflow-x-auto">
            {/* Weekday headers (Mon-Sun) */}
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-gamer font-bold text-slate-400 pb-2 border-b border-slate-800 min-w-[560px]">
              <span className="text-slate-300">ПН</span>
              <span className="text-slate-300">ВТ</span>
              <span className="text-slate-300">СР</span>
              <span className="text-slate-300">ЧТ</span>
              <span className="text-slate-300">ПТ</span>
              <span className="text-sky-400">СБ</span>
              <span className="text-sky-400">ВС</span>
            </div>

            {/* Calendar Day Cells */}
            <div className="grid grid-cols-7 gap-2 min-w-[560px]">
              {calendarDays.map((cell, idx) => {
                const dayStatus = getDayStatus(cell.dateStr);
                const isSelected = selectedDate === cell.dateStr;

                let borderStyle = 'border-slate-800/80 hover:border-slate-700 bg-[#0B0F19]/80';
                let indicatorBadge = null;

                if (dayStatus.status === 'green') {
                  borderStyle = 'border-emerald-500/40 bg-emerald-950/20 hover:border-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.15)]';
                  indicatorBadge = (
                    <span className="text-[10px] font-mono-code font-bold text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/30">
                      ✓ {dayStatus.completedCount}/{dayStatus.totalTasks}
                    </span>
                  );
                } else if (dayStatus.status === 'red') {
                  borderStyle = 'border-rose-500/50 bg-rose-950/25 hover:border-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.15)]';
                  indicatorBadge = (
                    <span className="text-[10px] font-mono-code font-bold text-rose-400 bg-rose-500/20 px-1.5 py-0.5 rounded border border-rose-500/30">
                      ✗ {dayStatus.completedCount}/{dayStatus.totalTasks}
                    </span>
                  );
                } else if (dayStatus.status === 'gray') {
                  borderStyle = 'border-slate-600/40 bg-slate-900/50 hover:border-slate-500';
                  indicatorBadge = (
                    <span className="text-[10px] font-mono-code font-bold text-slate-300 bg-slate-700/40 px-1.5 py-0.5 rounded border border-slate-600/40 truncate max-w-[90%]">
                      ⚪ Причина
                    </span>
                  );
                } else if (dayStatus.totalTasks > 0) {
                  borderStyle = 'border-sky-500/30 bg-[#0B0F19] hover:border-sky-400';
                  indicatorBadge = (
                    <span className="text-[10px] font-mono-code font-bold text-sky-300 bg-sky-500/10 px-1.5 py-0.5 rounded">
                      {dayStatus.completedCount}/{dayStatus.totalTasks}
                    </span>
                  );
                }

                if (dayStatus.isToday) {
                  borderStyle += ' ring-2 ring-sky-400/80';
                }

                return (
                  <motion.div
                    key={`${cell.dateStr}-${idx}`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleDayClick(cell.dateStr)}
                    className={`min-h-[85px] p-2 rounded-xl border flex flex-col justify-between transition-all cursor-pointer select-none ${borderStyle} ${
                      !cell.isCurrentMonth ? 'opacity-35' : 'opacity-100'
                    } ${isSelected ? 'ring-2 ring-sky-400' : ''}`}
                  >
                    {/* Cell Top: Day number + Today Tag */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-mono-code font-bold ${
                          dayStatus.isToday
                            ? 'text-sky-300 bg-sky-500/20 px-1.5 py-0.5 rounded'
                            : 'text-white'
                        }`}
                      >
                        {cell.dayNum}
                      </span>

                      {dayStatus.isPast && (
                        <span title="Прошедший день (зафиксирован в 00:00)">
                          <Lock className="w-3 h-3 text-slate-500" />
                        </span>
                      )}
                    </div>

                    {/* Cell Body: Indicator or Reason */}
                    <div className="mt-1 space-y-1">
                      {indicatorBadge}

                      {dayStatus.reason && (
                        <p className="text-[10px] text-slate-300 font-sans italic line-clamp-1 bg-black/40 px-1 py-0.5 rounded">
                          "{dayStatus.reason}"
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Quick Notice about 00:00 check */}
          <div className="bg-[#0F172A] p-4 rounded-xl border border-slate-800 flex items-start gap-3 text-xs text-slate-400">
            <Clock className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-slate-200">Механика фиксации в 00:00:</strong> В течение текущего дня задачи можно свободно выполнять и снимать. Как только наступают следующие сутки (00:00), день становится прошедшим и окончательно получает статус (🟢 Выполнен или 🔴 Пропущен), а редактирование задач за прошлый день блокируется. Для красного дня можно указать уважительную причину, чтобы сделать его серым ⚪.
            </p>
          </div>
        </div>
      )}

      {/* TAB 2: ISOLATED CATEGORY SHOP (XP) */}
      {activeTab === 'shop' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-[#0F172A] p-4 rounded-xl border border-slate-800">
            <div>
              <h3 className="font-gamer font-bold text-sm text-white">
                МАГАЗИН НАПРАВЛЕНИЯ: {category.name.toUpperCase()}
              </h3>
              <p className="text-xs text-slate-400">
                Товары приобретаются исключительно за XP, заработанные в этой категории
              </p>
            </div>

            <div className="flex items-center gap-2 bg-[#0B0F19] px-3 py-1.5 rounded-lg border border-emerald-500/30 font-mono-code font-bold text-emerald-400 text-sm">
              <Coins className="w-4 h-4" />
              <span>{category.categoryXP.toLocaleString()} XP</span>
            </div>
          </div>

          {(category.shopItems || []).length === 0 ? (
            <div className="p-10 text-center bg-[#0F172A] rounded-2xl border border-dashed border-slate-800 text-slate-400">
              <ShoppingBag className="h-8 w-8 mx-auto text-slate-500 mb-2" />
              <p className="font-gamer font-bold text-sm text-slate-300">
                В магазине этой категории пока нет товаров
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Вы можете настроить персональные награды за XP для этой категории в Настройках системы.
              </p>
              <button
                onClick={onOpenCategorySettings}
                className="mt-3 px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-gamer font-bold text-xs cursor-pointer shadow-md"
              >
                НАСТРОИТЬ МАГАЗИН КАТЕГОРИИ
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(category.shopItems || []).map((item) => {
                const canAfford = category.categoryXP >= item.costXP;
                const missing = item.costXP - category.categoryXP;

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-slate-800 bg-[#0F172A] flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                          <DynamicIcon name={item.icon || 'Gift'} className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-mono-code font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg">
                          {item.costXP.toLocaleString()} XP
                        </span>
                      </div>

                      <h4 className="font-gamer font-bold text-sm text-white mt-3">{item.name}</h4>
                      {item.description && (
                        <p className="text-xs text-slate-400 mt-1">{item.description}</p>
                      )}
                    </div>

                    <button
                      disabled={!canAfford}
                      onClick={() => handlePurchaseShopItem(item)}
                      className={`w-full mt-4 py-2 rounded-xl text-xs font-gamer font-bold transition-all cursor-pointer ${
                        canAfford
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-md'
                          : 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {canAfford ? 'КУПИТЬ ЗА XP' : `Не хватает ${missing} XP`}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CATEGORY TITLES (XP) */}
      {activeTab === 'levels' && (
        <div className="space-y-6">
          <div className="bg-[#0F172A] p-5 rounded-2xl border border-slate-800">
            <h3 className="font-gamer font-bold text-base text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-sky-400" />
              <span>ЗВАНИЯ КАТЕГОРИИ (XP ИЕРАРХИЯ)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 mb-4">
              Ранг категории рассчитывается по историческому рекорду XP ({category.highestCategoryXP} XP) и является несгораемым.
            </p>

            {(category.levels || []).length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs">
                Для этой категории еще не настроены уровни. Добавьте их в Настройках системы.
              </div>
            ) : (
              <div className="space-y-2.5">
                {(category.levels || []).map((lvl) => {
                  const isAchieved = category.highestCategoryXP >= lvl.requiredXP;
                  const isCurrent = prog.currentLevel?.id === lvl.id;

                  return (
                    <div
                      key={lvl.id}
                      className={`p-3.5 rounded-xl border flex items-center justify-between ${
                        isCurrent
                          ? 'border-sky-400 bg-sky-500/10 shadow-[0_0_12px_rgba(14,165,233,0.2)]'
                          : isAchieved
                          ? 'border-slate-800 bg-[#0B0F19]'
                          : 'border-slate-800/40 bg-[#0B0F19]/40 opacity-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-sky-400">
                          <DynamicIcon name={lvl.icon || 'Award'} className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-gamer font-bold text-sm text-white">{lvl.name}</span>
                            {isCurrent && (
                              <span className="text-[10px] font-mono-code font-bold bg-sky-500 text-white px-2 py-0.5 rounded-full">
                                ТЕКУЩИЙ РАНГ
                              </span>
                            )}
                          </div>
                          {lvl.rewardDescription && (
                            <p className="text-xs text-slate-400">{lvl.rewardDescription}</p>
                          )}
                        </div>
                      </div>

                      <span className="font-mono-code font-bold text-xs text-emerald-400">
                        {lvl.requiredXP.toLocaleString()} XP
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: DAY TASKS SCREEN (Opens when clicking any calendar day) */}
      {isDayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto space-y-5"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="font-gamer font-bold text-lg text-white">
                    ЗАДАЧИ НА ДЕНЬ: <span className="text-sky-400 font-mono-code">{selectedDate}</span>
                  </h3>
                  {selectedDayInfo.isToday && (
                    <span className="text-[10px] font-mono-code font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded-full">
                      СЕГОДНЯ
                    </span>
                  )}
                  {selectedDayInfo.isPast && (
                    <span className="text-[10px] font-mono-code font-bold bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Прошедший день (00:00)
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Направление: <strong className="text-white">{category.name}</strong> • Выполнено: {selectedDayInfo.completedCount} из {selectedDayInfo.totalTasks}
                </p>
              </div>

              <button
                onClick={() => setIsDayModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status Banner */}
            {selectedDayInfo.status === 'green' && (
              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <strong className="font-gamer text-white block">🟢 100% ВЫПОЛНЕНИЕ</strong>
                  <span>Все задачи этого дня успешно завершены!</span>
                </div>
              </div>
            )}

            {selectedDayInfo.status === 'red' && (
              <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/40 text-xs text-rose-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  <div>
                    <strong className="font-gamer text-white block">🔴 ПРОПУСК ЗАДАЧ</strong>
                    <span>День зафиксирован в 00:00 с невыполненными задачами.</span>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenSkipReasonModal(selectedDate)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-gamer font-bold text-xs border border-slate-700 cursor-pointer shrink-0 transition-colors"
                >
                  УКАЗАТЬ ПРИЧИНУ ПРОПУСКА
                </button>
              </div>
            )}

            {selectedDayInfo.status === 'gray' && (
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-700 text-xs text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-5 h-5 text-slate-400 shrink-0" />
                  <div>
                    <strong className="font-gamer text-white block">⚪ ПРОПУСК С УВАЖИТЕЛЬНОЙ ПРИЧИНОЙ</strong>
                    <span className="italic">"{selectedDayInfo.reason}"</span>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenSkipReasonModal(selectedDate)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-gamer border border-slate-700 cursor-pointer shrink-0"
                >
                  Изменить причину
                </button>
              </div>
            )}

            {/* Action to Add Task for this day (available if not locked past or anytime) */}
            {!selectedDayInfo.isPast && (
              <div className="flex justify-end">
                <button
                  onClick={() => handleOpenAddModal(selectedDate)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-gamer font-bold text-xs cursor-pointer shadow-sm transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>ДОБАВИТЬ ЗАДАЧУ НА ЭТОТ ДЕНЬ</span>
                </button>
              </div>
            )}

            {/* Tasks List */}
            {selectedDayTasks.length === 0 ? (
              <div className="p-8 text-center bg-[#0B0F19] rounded-xl border border-dashed border-slate-800 text-slate-400">
                <CalendarIcon className="w-7 h-7 mx-auto text-slate-500 mb-2" />
                <p className="font-gamer font-bold text-sm text-slate-300">На эту дату нет задач</p>
                {!selectedDayInfo.isPast && (
                  <button
                    onClick={() => handleOpenAddModal(selectedDate)}
                    className="mt-3 px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-gamer font-bold text-xs cursor-pointer"
                  >
                    Запланировать задачу
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDayTasks.map((task) => {
                  const isCompleted = isTaskCompletedOnDate(task, selectedDate);
                  const completionNote = getTaskNoteOnDate(task, selectedDate);
                  const isLocked = selectedDayInfo.isPast;

                  return (
                    <div
                      key={task.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isCompleted
                          ? 'border-emerald-500/30 bg-emerald-950/15'
                          : isLocked
                          ? 'border-rose-500/20 bg-rose-950/10 opacity-75'
                          : 'border-slate-800 bg-[#0B0F19] hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <button
                            disabled={isLocked}
                            onClick={(e) => handleTaskCheckboxClick(task, selectedDate, e)}
                            className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition-all ${
                              isCompleted
                                ? 'border-emerald-400 bg-emerald-400 text-slate-950 shadow-[0_0_8px_rgba(52,211,153,0.4)]'
                                : isLocked
                                ? 'border-slate-800 bg-slate-900 text-slate-600 cursor-not-allowed'
                                : 'border-slate-700 bg-slate-900 text-transparent hover:border-sky-400 hover:text-sky-400/40 cursor-pointer'
                            }`}
                            title={isLocked ? 'День заблокирован в 00:00' : 'Отметить выполнение'}
                          >
                            <Check className="h-4 w-4 stroke-[3]" />
                          </button>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4
                                className={`font-gamer font-bold text-sm transition-all ${
                                  isCompleted ? 'text-slate-400 line-through' : 'text-white'
                                }`}
                              >
                                {task.title}
                              </h4>

                              {task.recurrence === 'daily' && (
                                <span className="text-[10px] font-mono-code px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/20">
                                  Каждый день
                                </span>
                              )}

                              {task.recurrence === 'weekly' && (
                                <span className="text-[10px] font-mono-code px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                                  По дням недели
                                </span>
                              )}

                              {task.difficulty && (
                                <span className="text-[10px] font-mono-code px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                                  {task.difficulty}
                                </span>
                              )}
                            </div>

                            {task.notes && (
                              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                                {task.notes}
                              </p>
                            )}

                            {/* Display Completion Note if exists */}
                            {completionNote && (
                              <div className="mt-2 text-xs bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-lg text-emerald-300 flex items-start gap-1.5">
                                <MessageSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                <div>
                                  <strong className="text-[10px] uppercase font-gamer block text-emerald-400">
                                    Заметка к выполнению:
                                  </strong>
                                  <span>{completionNote}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Rewards & Edit Controls */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-mono-code font-bold text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg">
                            +{task.xpReward} XP
                          </span>
                          <span className="font-mono-code font-bold text-xs text-sky-300 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-lg">
                            +{task.uxpReward} UXP
                          </span>

                          {!isLocked && (
                            <div className="flex items-center gap-1 ml-1">
                              <button
                                onClick={() => setEditingTask(task)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer hover:bg-slate-800"
                                title="Редактировать"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (task.recurrence !== 'none') {
                                    setTaskToDelete({ task, dateStr: selectedDate });
                                  } else {
                                    onDeleteTask(task.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 cursor-pointer hover:bg-slate-800"
                                title="Удалить"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsDayModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-gamer text-xs cursor-pointer"
              >
                ЗАКРЫТЬ
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* MODAL 2: TASK CREATION MODAL (Rich Recurrence, Notes & Rewards) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-gamer font-bold text-lg text-white">СОЗДАТЬ ЗАДАЧУ</h3>
                <p className="text-xs text-slate-400">Направление: {category.name}</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block text-slate-300 font-gamer font-bold mb-1">Название задачи *</label>
                <input
                  type="text"
                  required
                  placeholder="например, Решить 3 задачи по бинарному поиску"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-[#0B0F19] px-3.5 py-2.5 text-white focus:border-sky-400 focus:outline-none text-xs"
                />
              </div>

              {/* Recurrence Mode Selector */}
              <div>
                <label className="block text-slate-300 font-gamer font-bold mb-1.5 uppercase">
                  Режим повторения задачи:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRecurrence('none')}
                    className={`py-2 px-3 rounded-xl font-gamer font-bold text-xs border transition-all cursor-pointer ${
                      recurrence === 'none'
                        ? 'border-sky-400 bg-sky-500/20 text-sky-300'
                        : 'border-slate-800 bg-[#0B0F19] text-slate-400 hover:text-white'
                    }`}
                  >
                    Разово
                  </button>

                  <button
                    type="button"
                    onClick={() => setRecurrence('daily')}
                    className={`py-2 px-3 rounded-xl font-gamer font-bold text-xs border transition-all cursor-pointer ${
                      recurrence === 'daily'
                        ? 'border-sky-400 bg-sky-500/20 text-sky-300'
                        : 'border-slate-800 bg-[#0B0F19] text-slate-400 hover:text-white'
                    }`}
                  >
                    Каждый день
                  </button>

                  <button
                    type="button"
                    onClick={() => setRecurrence('weekly')}
                    className={`py-2 px-3 rounded-xl font-gamer font-bold text-xs border transition-all cursor-pointer ${
                      recurrence === 'weekly'
                        ? 'border-indigo-400 bg-indigo-500/20 text-indigo-300'
                        : 'border-slate-800 bg-[#0B0F19] text-slate-400 hover:text-white'
                    }`}
                  >
                    По дням недели
                  </button>
                </div>
              </div>

              {/* If weekly recurrence: Day Checkboxes */}
              {recurrence === 'weekly' && (
                <div className="bg-[#0B0F19] p-3 rounded-xl border border-slate-800 space-y-2">
                  <label className="block text-slate-300 font-gamer font-bold text-[11px] uppercase">
                    Выберите дни недели для повторения:
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {WEEK_DAYS.map((wd) => {
                      const isSelected = repeatDays.includes(wd.num);
                      return (
                        <button
                          key={wd.num}
                          type="button"
                          onClick={() => handleToggleRepeatDay(wd.num)}
                          className={`w-9 h-9 rounded-xl font-mono-code font-bold text-xs border transition-all cursor-pointer ${
                            isSelected
                              ? 'border-indigo-400 bg-indigo-500/30 text-indigo-200'
                              : 'border-slate-800 bg-[#0F172A] text-slate-400 hover:text-white'
                          }`}
                        >
                          {wd.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* If single recurrence: Specific Date picker */}
              {recurrence === 'none' && (
                <div>
                  <label className="block text-slate-300 font-gamer font-bold mb-1">Дата выполнения</label>
                  <input
                    type="date"
                    value={taskDate}
                    onChange={(e) => setTaskDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-[#0B0F19] px-3.5 py-2 text-white font-mono-code focus:border-sky-400 focus:outline-none text-xs"
                  />
                </div>
              )}

              {/* Rewards & Difficulty */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-gamer font-bold mb-1">Награда XP (в категорию)</label>
                  <input
                    type="number"
                    min={0}
                    value={xpReward}
                    onChange={(e) => setXpReward(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-700 bg-[#0B0F19] px-3.5 py-2 text-emerald-400 font-mono-code font-bold focus:border-sky-400 focus:outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-gamer font-bold mb-1">Награда UXP (общий)</label>
                  <input
                    type="number"
                    min={0}
                    value={uxpReward}
                    onChange={(e) => setUxpReward(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-700 bg-[#0B0F19] px-3.5 py-2 text-sky-300 font-mono-code font-bold focus:border-sky-400 focus:outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-gamer font-bold mb-1">Сложность</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as TaskDifficulty)}
                    className="w-full rounded-xl border border-slate-700 bg-[#0B0F19] px-3 py-2 text-white focus:border-sky-400 focus:outline-none text-xs"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                    <option value="Olympiad">Olympiad</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-gamer font-bold mb-1">Заметки / Условия / Ссылки</label>
                <textarea
                  rows={2}
                  placeholder="Дополнительные подробности задачи..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-[#0B0F19] px-3.5 py-2 text-white focus:border-sky-400 focus:outline-none text-xs"
                />
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
                  СОЗДАТЬ ЗАДАЧУ
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL 3: COMPLETION NOTE PROMPT MODAL */}
      {completingTaskInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100 space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-gamer font-bold text-base text-white">ЗАДАЧА ВЫПОЛНЕНА!</h3>
                <p className="text-xs text-slate-400 truncate max-w-[240px]">
                  {completingTaskInfo.task.title}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-gamer font-bold text-xs mb-1.5">
                Оставить заметку к выполненной задаче:
              </label>
              <textarea
                rows={3}
                placeholder="Что получилось? Какие выводы или ссылки стоит сохранить..."
                value={completingTaskInfo.note}
                onChange={(e) =>
                  setCompletingTaskInfo({ ...completingTaskInfo, note: e.target.value })
                }
                className="w-full rounded-xl border border-slate-700 bg-[#0B0F19] p-3 text-white text-xs focus:border-sky-400 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800 text-xs">
              <button
                type="button"
                onClick={handleQuickComplete}
                className="px-3 py-2 rounded-xl border border-slate-700 text-slate-300 font-gamer hover:text-white cursor-pointer hover:bg-slate-800"
              >
                БЕЗ ЗАМЕТКИ
              </button>
              <button
                type="button"
                onClick={handleConfirmCompletionNote}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-gamer font-bold cursor-pointer shadow-md"
              >
                СОХРАНИТЬ И ЗАВЕРШИТЬ
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* MODAL 4: SKIP REASON INPUT MODAL (Turns red day into gray) */}
      {skipReasonModalDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-[#0F172A] border border-slate-700 rounded-2xl p-6 shadow-2xl text-slate-100 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-gamer font-bold text-base text-white">
                    ПРИЧИНА ПРОПУСКА ДНЯ
                  </h3>
                  <p className="text-xs text-slate-400 font-mono-code">{skipReasonModalDate}</p>
                </div>
              </div>

              <button
                onClick={() => setSkipReasonModalDate(null)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSkipReason} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-gamer font-bold mb-1.5">
                  Укажите уважительную причину пропуска:
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="например, Болезнь, форс-мажор, олимпиадный выезд или семейные обстоятельства..."
                  value={skipReasonText}
                  onChange={(e) => setSkipReasonText(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-[#0B0F19] p-3 text-white text-xs focus:border-sky-400 focus:outline-none"
                />
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                ℹ️ После сохранения причина будет отображаться в календаре, а блок этого дня станет серым цветом (⚪).
              </p>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSkipReasonModalDate(null)}
                  className="px-3.5 py-2 rounded-xl border border-slate-700 text-slate-300 font-gamer cursor-pointer hover:bg-slate-800"
                >
                  ОТМЕНА
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-white text-slate-950 font-gamer font-bold shadow-md cursor-pointer"
                >
                  СОХРАНИТЬ ПРИЧИНУ
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL 5: EDIT TASK MODAL */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100"
          >
            <h3 className="font-gamer font-bold text-base text-white pb-3 border-b border-slate-800">
              РЕДАКТИРОВАТЬ ЗАДАЧУ
            </h3>

            <form onSubmit={handleSaveEditTask} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block text-slate-300 font-gamer font-bold mb-1">Название *</label>
                <input
                  type="text"
                  required
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-[#0B0F19] px-3.5 py-2 text-white focus:border-sky-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-gamer font-bold mb-1">XP (категория)</label>
                  <input
                    type="number"
                    min={0}
                    value={editingTask.xpReward}
                    onChange={(e) =>
                      setEditingTask({ ...editingTask, xpReward: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-slate-700 bg-[#0B0F19] px-3.5 py-2 text-emerald-400 font-mono-code font-bold focus:border-sky-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-gamer font-bold mb-1">UXP (общий)</label>
                  <input
                    type="number"
                    min={0}
                    value={editingTask.uxpReward}
                    onChange={(e) =>
                      setEditingTask({ ...editingTask, uxpReward: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-slate-700 bg-[#0B0F19] px-3.5 py-2 text-sky-300 font-mono-code font-bold focus:border-sky-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-gamer font-bold mb-1">Заметки / Ссылки</label>
                <input
                  type="text"
                  value={editingTask.notes || ''}
                  onChange={(e) => setEditingTask({ ...editingTask, notes: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-[#0B0F19] px-3.5 py-2 text-white focus:border-sky-400 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-3.5 py-2 rounded-xl border border-slate-700 text-slate-300 font-gamer text-xs cursor-pointer hover:bg-slate-800"
                >
                  ОТМЕНА
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-gamer font-bold text-xs cursor-pointer"
                >
                  СОХРАНИТЬ
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL 6: RECURRING TASK DELETE OPTIONS (Single date instance vs all dates) */}
      {taskToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-[#0F172A] border border-slate-700 rounded-2xl p-6 shadow-2xl text-slate-100 space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-gamer font-bold text-base text-white">
                  УДАЛЕНИЕ ПОВТОРЯЮЩЕЙСЯ ЗАДАЧИ
                </h3>
                <p className="text-xs text-slate-400 truncate max-w-[260px]">
                  «{taskToDelete.task.title}» ({taskToDelete.task.recurrence === 'daily' ? 'Каждый день' : 'По дням недели'})
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Эта задача является регулярной. Как вы хотите её удалить?
            </p>

            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  onDeleteTaskInstance(taskToDelete.task.id, taskToDelete.dateStr);
                  setTaskToDelete(null);
                }}
                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 hover:border-sky-400 text-left cursor-pointer transition-all flex items-center justify-between group"
              >
                <div>
                  <span className="font-gamer font-bold text-xs text-white block group-hover:text-sky-300">
                    1. Удалить только для даты {taskToDelete.dateStr}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Задача исчезнет только из этого дня, но останется в остальных днях
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onDeleteTask(taskToDelete.task.id);
                  setTaskToDelete(null);
                }}
                className="w-full p-3 rounded-xl bg-rose-950/20 border border-rose-500/30 hover:border-rose-500 text-left cursor-pointer transition-all flex items-center justify-between group"
              >
                <div>
                  <span className="font-gamer font-bold text-xs text-rose-300 block group-hover:text-rose-200">
                    2. Удалить задачу из ВСЕХ дней (навсегда)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Полностью удалить эту регулярную задачу из всей системы
                  </span>
                </div>
              </button>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setTaskToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-400 hover:text-white font-gamer text-xs cursor-pointer"
              >
                ОТМЕНА
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
