import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
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
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  GripVertical,
  Flame,
  Layers,
} from 'lucide-react';
import { Category, CategoryShopItem, Task } from '../types';
import { DynamicIcon } from './DynamicIcon';
import { TitleBadge } from './TitleBadge';
import { TaskModal } from './TaskModal';
import { MultiTaskModal } from './MultiTaskModal';
import { FloatingReward, FloatingRewardItem } from './FloatingReward';
import { getTodayDateString, getDayOfWeek } from '../data/initialData';
import { triggerPurchaseConfetti } from '../utils/confetti';
import { soundFX } from '../utils/sound';
import { calculateCategoryProgression } from '../utils/progression';

interface CategoryViewProps {
  category: Category;
  tasks: Task[];
  dayReasons: Record<string, string>;
  initialSelectedDate?: string;
  onBack: () => void;
  onToggleTask: (taskId: string, date: string, note?: string, event?: React.MouseEvent) => void;
  onAddTask: (task: Omit<Task, 'id'>) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onDeleteTaskInstance: (taskId: string, dateStr: string) => void;
  onDeleteCategory: (categoryId: string) => void;
  onSetDayReason: (categoryId: string, date: string, reason: string) => void;
  onBuyCategoryShopItem: (categoryId: string, item: CategoryShopItem) => void;
  onOpenCategorySettings: () => void;
  onOpenPenaltyModal?: (categoryId?: string) => void;
  onReorderTasks?: (tasks: Task[]) => void;
  onSelectMultiTaskOption?: (taskId: string, date: string, optionId: string | null) => void;
}

export const CategoryView: React.FC<CategoryViewProps> = ({
  category,
  tasks,
  dayReasons,
  initialSelectedDate,
  onBack,
  onToggleTask,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onDeleteTaskInstance,
  onDeleteCategory,
  onSetDayReason,
  onBuyCategoryShopItem,
  onOpenCategorySettings,
  onOpenPenaltyModal,
  onReorderTasks,
  onSelectMultiTaskOption,
}) => {
  const todayStr = getTodayDateString();
  const [activeTab, setActiveTab] = useState<'calendar' | 'shop' | 'levels'>('calendar');

  // Subtab navigation order for swipes and on-screen arrows
  const CATEGORY_TABS: Array<{ id: 'calendar' | 'shop' | 'levels'; label: string; icon: any }> = [
    { id: 'calendar', label: 'КАЛЕНДАРЬ И ЗАДАЧИ', icon: CalendarIcon },
    { id: 'shop', label: `МАГАЗИН (${(category.shopItems || []).length})`, icon: ShoppingBag },
    { id: 'levels', label: 'ЗВАНИЯ КАТЕГОРИИ', icon: Award },
  ];

  const currentTabIndex = CATEGORY_TABS.findIndex((t) => t.id === activeTab);

  const handlePrevSubTab = () => {
    if (currentTabIndex > 0) {
      setActiveTab(CATEGORY_TABS[currentTabIndex - 1].id);
    }
  };

  const handleNextSubTab = () => {
    if (currentTabIndex < CATEGORY_TABS.length - 1) {
      setActiveTab(CATEGORY_TABS[currentTabIndex + 1].id);
    }
  };

  // Touch swipe support for Category Subtabs (Calendar ↔ Shop ↔ Levels)
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || touchStartY === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const diffX = touchStartX - touchEndX;
    const diffY = touchStartY - touchEndY;

    // Must be predominantly horizontal swipe > 60px with minimal vertical drift
    if (Math.abs(diffX) > 60 && Math.abs(diffY) < 70) {
      if (diffX > 0) {
        // Swiped Left -> Next Subtab (Calendar -> Shop -> Levels)
        handleNextSubTab();
      } else {
        // Swiped Right -> Prev Subtab (Levels -> Shop -> Calendar)
        handlePrevSubTab();
      }
    }
    setTouchStartX(null);
    setTouchStartY(null);
  };

  // Category deletion double confirmation state
  const [isDeleteCategoryOpen, setIsDeleteCategoryOpen] = useState(false);
  const [deleteCategoryStep, setDeleteCategoryStep] = useState<1 | 2>(1);

  // Selected Day Modal State
  const [selectedDate, setSelectedDate] = useState<string>(initialSelectedDate || todayStr);
  const [isDayModalOpen, setIsDayModalOpen] = useState(Boolean(initialSelectedDate && initialSelectedDate !== todayStr));

  useEffect(() => {
    if (initialSelectedDate) {
      setSelectedDate(initialSelectedDate);
      const [y, m] = initialSelectedDate.split('-').map(Number);
      if (!isNaN(y) && !isNaN(m)) {
        setCurrentYear(y);
        setCurrentMonth(m - 1);
      }
    }
  }, [initialSelectedDate]);

  // Recurring task delete modal state
  const [taskToDelete, setTaskToDelete] = useState<{ task: Task; dateStr: string } | null>(null);

  // Month navigation for Calendar Grid
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth()); // 0-indexed

  // Unified Task Creation & Edit Modal
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [taskModalInitialDate, setTaskModalInitialDate] = useState<string>(todayStr);

  // Multi-Task Options Modal
  const [activeMultiTask, setActiveMultiTask] = useState<Task | null>(null);

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
   * Helper: Get all active tasks for a specific date
   * STRICT FIX: Task is NOT displayed or counted on dates BEFORE its createdAt!
   */
  const getTasksForDate = (dateStr: string): Task[] => {
    const dayOfWeek = getDayOfWeek(dateStr);
    return categoryTasks.filter((t) => {
      // Protection against retrospective penalties & display:
      const taskCreatedDate = t.createdAt ? t.createdAt.slice(0, 10) : (t.date || todayStr);
      if (dateStr < taskCreatedDate) return false;

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
   * Calculate Day Status for Calendar Cell
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
        status = 'neutral';
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
      reason,
    };
  };

  /**
   * Build calendar days for the current displayed month
   */
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

    const totalDays = lastDayOfMonth.getDate();
    let startDayOfWeek = firstDayOfMonth.getDay();
    startDayOfWeek = startDayOfWeek === 0 ? 7 : startDayOfWeek;

    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();

    const days: Array<{
      dateStr: string;
      dayNum: number;
      isCurrentMonth: boolean;
    }> = [];

    // Preceding days from previous month
    for (let i = startDayOfWeek - 1; i > 0; i--) {
      const d = prevMonthLastDay - i + 1;
      const prevM = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevY = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${prevY}-${String(prevM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: true,
      });
    }

    // Subsequent days to complete grid rows
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let d = 1; d <= remaining; d++) {
        const nextM = currentMonth === 11 ? 0 : currentMonth + 1;
        const nextY = currentMonth === 11 ? currentYear + 1 : currentYear;
        const dateStr = `${nextY}-${String(nextM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        days.push({
          dateStr,
          dayNum: d,
          isCurrentMonth: false,
        });
      }
    }

    return days;
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

  const handleDayClick = (dateStr: string) => {
    setSelectedDate(dateStr);
    setIsDayModalOpen(true);
  };

  // Open modal to add task for specific date
  const handleOpenAddTaskModal = (dateStr?: string) => {
    setTaskToEdit(null);
    setTaskModalInitialDate(dateStr || selectedDate || todayStr);
    setIsTaskModalOpen(true);
  };

  const handleOpenEditTaskModal = (task: Task) => {
    setTaskToEdit(task);
    setTaskModalInitialDate(task.date || selectedDate || todayStr);
    setIsTaskModalOpen(true);
  };

  const handleSaveTaskFromModal = (taskData: Omit<Task, 'id'>) => {
    if (taskToEdit) {
      onUpdateTask({
        ...taskToEdit,
        ...taskData,
        id: taskToEdit.id,
      });
    } else {
      onAddTask(taskData);
    }
  };

  // Instant task toggle for standard tasks
  const handleTaskCheckboxClick = (task: Task, dateStr: string, event: React.MouseEvent) => {
    const isPast = dateStr < todayStr;
    if (isPast) {
      return;
    }

    if (task.type === 'multi') {
      setActiveMultiTask(task);
      return;
    }

    const isCompleted = isTaskCompletedOnDate(task, dateStr);

    if (!isCompleted) {
      // Trigger floating particle rewards
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
    }

    onToggleTask(task.id, dateStr, undefined, event);
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

  const handlePurchaseShopItem = (item: CategoryShopItem) => {
    if (category.categoryXP < item.costXP) return;
    soundFX.playPurchase();
    triggerPurchaseConfetti();
    onBuyCategoryShopItem(category.id, item);
  };

  // Selected date status & tasks
  const selectedDayInfo = getDayStatus(selectedDate);
  const selectedDayTasks = getTasksForDate(selectedDate);

  const handleReorderSelectedDayTasks = (reordered: Task[]) => {
    if (!onReorderTasks) return;
    const reorderedIds = new Set(reordered.map((t) => t.id));
    const nonDayTasks = tasks.filter((t) => !reorderedIds.has(t.id));
    onReorderTasks([...reordered, ...nonDayTasks]);
  };

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
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="space-y-5 select-text"
    >
      {/* Floating particles */}
      <FloatingReward
        rewards={floatingRewards}
        onComplete={(id) => setFloatingRewards((prev) => prev.filter((r) => r.id !== id))}
      />

      {/* Top Banner with Back Button, Category Details & Expressive Title Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0F172A] p-4 sm:p-5 rounded-2xl border border-slate-800 relative overflow-hidden shadow-lg">
        <div
          className="absolute -top-24 -right-24 w-72 h-72 rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ backgroundColor: category.color }}
        />

        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
            title="Назад ко всем направлениям"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 min-w-0 flex-1">
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

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-gamer font-bold text-lg sm:text-xl text-white truncate">{category.name}</h2>
                {/* Expressive, Juicy Category Title Badge */}
                <TitleBadge
                  title={prog.currentLevel ? prog.currentLevel.name : 'Без звания'}
                  icon={prog.currentLevel?.icon || category.icon}
                  color={prog.currentLevel?.color || category.color}
                  effect={prog.currentLevel?.effect || 'none'}
                  size="sm"
                />
              </div>
              <p className="text-xs text-slate-400 mt-0.5 truncate">
                {category.description || 'Изолированное направление с интерактивным календарем и званиями'}
              </p>
            </div>
          </div>
        </div>

        {/* Category Stats & Actions */}
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
              <span className="text-[9px] font-gamer text-indigo-300 block uppercase">
                Титульный XP
              </span>
              <span className="text-xs font-mono-code font-bold text-indigo-300">
                {(category.highestCategoryXP || category.categoryXP).toLocaleString()} XP
              </span>
            </div>
          </div>

          {/* Category Penalty Button */}
          {onOpenPenaltyModal && (
            <button
              type="button"
              onClick={() => onOpenPenaltyModal(category.id)}
              className="p-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 hover:border-rose-500/50 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-gamer"
              title="Наложить штраф на это направление (XP и Титул)"
            >
              <Flame className="w-4 h-4 text-rose-400" />
              <span>ШТРАФ</span>
            </button>
          )}

          {/* Delete Category Button */}
          <button
            type="button"
            onClick={() => {
              setIsDeleteCategoryOpen(true);
              setDeleteCategoryStep(1);
            }}
            className="p-2.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:border-red-500/40 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-gamer"
            title="Удалить категорию"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">УДАЛИТЬ</span>
          </button>
        </div>
      </div>

      {/* View Tabs Navigation with On-Screen Desktop Arrows */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
        {/* On-screen Left Arrow for PC / Desktop */}
        <button
          type="button"
          onClick={handlePrevSubTab}
          disabled={currentTabIndex === 0}
          title={currentTabIndex > 0 ? `Перейти к: ${CATEGORY_TABS[currentTabIndex - 1].label}` : 'Первая вкладка'}
          className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-gamer font-bold transition-all shrink-0 ${
            currentTabIndex === 0
              ? 'opacity-30 border border-slate-800 bg-slate-900/40 text-slate-600 cursor-not-allowed'
              : 'border border-slate-700 bg-slate-800/90 text-sky-400 hover:bg-slate-700 hover:text-white cursor-pointer shadow-sm hover:scale-105 active:scale-95'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline text-[11px]">Назад</span>
        </button>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto justify-center flex-1 py-0.5">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-gamer font-bold cursor-pointer transition-all shrink-0 ${
              activeTab === 'calendar'
                ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md scale-102'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800/80 hover:border-slate-700'
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            <span>КАЛЕНДАРЬ И ЗАДАЧИ</span>
          </button>

          <button
            onClick={() => setActiveTab('shop')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-gamer font-bold cursor-pointer transition-all shrink-0 ${
              activeTab === 'shop'
                ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md scale-102'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800/80 hover:border-slate-700'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>МАГАЗИН КАТЕГОРИИ (XP) ({(category.shopItems || []).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('levels')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-gamer font-bold cursor-pointer transition-all shrink-0 ${
              activeTab === 'levels'
                ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md scale-102'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800/80 hover:border-slate-700'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>ЗВАНИЯ КАТЕГОРИИ (XP)</span>
          </button>
        </div>

        {/* On-screen Right Arrow for PC / Desktop */}
        <button
          type="button"
          onClick={handleNextSubTab}
          disabled={currentTabIndex === CATEGORY_TABS.length - 1}
          title={currentTabIndex < CATEGORY_TABS.length - 1 ? `Перейти к: ${CATEGORY_TABS[currentTabIndex + 1].label}` : 'Последняя вкладка'}
          className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-gamer font-bold transition-all shrink-0 ${
            currentTabIndex === CATEGORY_TABS.length - 1
              ? 'opacity-30 border border-slate-800 bg-slate-900/40 text-slate-600 cursor-not-allowed'
              : 'border border-slate-700 bg-slate-800/90 text-sky-400 hover:bg-slate-700 hover:text-white cursor-pointer shadow-sm hover:scale-105 active:scale-95'
          }`}
        >
          <span className="hidden sm:inline text-[11px]">Вперед</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* TAB 1: CALENDAR & TASKS */}
      {activeTab === 'calendar' && (
        <div className="space-y-5">
          {/* Calendar Header Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0F172A] p-3.5 sm:p-4 rounded-2xl border border-slate-800 shadow-md">
            <div className="flex items-center gap-2.5">
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

              <h3 className="font-gamer font-bold text-base sm:text-lg text-white">
                {monthNames[currentMonth]} {currentYear}
              </h3>

              <button
                onClick={handleTodayMonth}
                className="px-2.5 py-1 rounded-xl bg-slate-800/80 border border-slate-700 text-[11px] font-gamer text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer"
              >
                Сегодня
              </button>
            </div>

            {/* Legend & Action Button */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Status Legend */}
              <div className="flex items-center gap-2.5 text-[11px] font-mono-code text-slate-400 bg-[#0B0F19] px-3 py-1.5 rounded-xl border border-slate-800">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                  <span>100%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                  <span>00:00 Пропуск</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block" />
                  <span>Причина</span>
                </div>
              </div>

              <button
                onClick={() => handleOpenAddTaskModal(todayStr)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-gamer font-bold text-xs shadow-md cursor-pointer transition-all shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>СОЗДАТЬ ЗАДАЧУ</span>
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="bg-[#0F172A] p-4 rounded-2xl border border-slate-800 shadow-md space-y-2.5">
            {/* Weekday labels */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center">
              {WEEK_DAYS.map((w, idx) => (
                <div
                  key={w.num}
                  className={`text-[11px] font-gamer font-bold py-1 ${
                    idx >= 5 ? 'text-rose-400/80' : 'text-slate-400'
                  }`}
                >
                  {w.label}
                </div>
              ))}
            </div>

            {/* Month Day Cells */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {calendarDays.map((cell, idx) => {
                const dayStatus = getDayStatus(cell.dateStr);
                const isSelected = cell.dateStr === selectedDate;

                let borderStyle = 'border-slate-800/80 bg-[#0B0F19]/60 hover:border-slate-700';
                let indicatorBadge: React.ReactNode = null;

                if (dayStatus.status === 'green') {
                  borderStyle = 'border-emerald-500/40 bg-emerald-950/20 hover:border-emerald-400';
                  indicatorBadge = (
                    <span className="text-[10px] font-mono-code font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
                      🟢 100%
                    </span>
                  );
                } else if (dayStatus.status === 'red') {
                  borderStyle = 'border-rose-500/40 bg-rose-950/20 hover:border-rose-400';
                  indicatorBadge = (
                    <span className="text-[10px] font-mono-code font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/30">
                      🔴 00:00
                    </span>
                  );
                } else if (dayStatus.status === 'gray') {
                  borderStyle = 'border-slate-600/40 bg-slate-900/40 hover:border-slate-500';
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
                    className={`min-h-[78px] sm:min-h-[85px] p-2 rounded-xl border flex flex-col justify-between transition-all cursor-pointer select-none ${borderStyle} ${
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
        </div>
      )}

      {/* TAB 2: ISOLATED CATEGORY SHOP (XP) */}
      {activeTab === 'shop' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0F172A] p-4 rounded-xl border border-slate-800">
            <div>
              <h3 className="font-gamer font-bold text-sm text-white">
                МАГАЗИН НАПРАВЛЕНИЯ: {category.name.toUpperCase()}
              </h3>
              <p className="text-xs text-slate-400">
                Товары приобретаются исключительно за XP, заработанные в этой категории
              </p>
            </div>

            <div className="flex items-center gap-2 bg-[#0B0F19] px-3 py-1.5 rounded-lg border border-emerald-500/30 font-mono-code font-bold text-emerald-400 text-sm shrink-0">
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
        <div className="space-y-5">
          <div className="bg-[#0F172A] p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-md">
            <h3 className="font-gamer font-bold text-base text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-sky-400" />
              <span>ЗВАНИЯ КАТЕГОРИИ (XP ИЕРАРХИЯ)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 mb-4">
              Ранг категории рассчитывается по историческому рекорду XP ({(category.highestCategoryXP || category.categoryXP).toLocaleString()} XP).
            </p>

            {(category.levels || []).length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs">
                Для этой категории еще не настроены звания. Добавьте их в Настройках системы.
              </div>
            ) : (
              <div className="space-y-2.5">
                {(category.levels || []).map((lvl) => {
                  const isAchieved = (category.highestCategoryXP || 0) >= lvl.requiredXP;
                  const isCurrent = prog.currentLevel?.id === lvl.id;

                  return (
                    <div
                      key={lvl.id}
                      className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                        isCurrent
                          ? 'border-sky-400 bg-sky-500/10 shadow-[0_0_12px_rgba(14,165,233,0.2)]'
                          : isAchieved
                          ? 'border-slate-800 bg-[#0B0F19]'
                          : 'border-slate-800/40 bg-[#0B0F19]/40 opacity-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <TitleBadge
                          title={lvl.name}
                          icon={lvl.icon || 'Award'}
                          color={lvl.color || category.color}
                          effect={lvl.effect || 'none'}
                          size="sm"
                        />
                        {lvl.rewardDescription && (
                          <p className="text-xs text-slate-400 truncate hidden sm:block">
                            {lvl.rewardDescription}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isCurrent && (
                          <span className="text-[10px] font-mono-code font-bold bg-sky-500 text-white px-2 py-0.5 rounded-full">
                            ТЕКУЩИЙ РАНГ
                          </span>
                        )}
                        <span className="font-mono-code font-bold text-xs text-emerald-400">
                          {lvl.requiredXP.toLocaleString()} XP
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: DAY TASKS POPUP (Opens when clicking any calendar day) */}
      {isDayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl bg-[#0F172A] border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto space-y-4"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-gamer font-bold text-base sm:text-lg text-white">
                    ЗАДАЧИ НА ДЕНЬ: <span className="text-sky-400 font-mono-code">{selectedDate}</span>
                  </h3>
                  {selectedDayInfo.isToday && (
                    <span className="text-[10px] font-mono-code font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded-full">
                      СЕГОДНЯ
                    </span>
                  )}
                  {selectedDayInfo.isPast && (
                    <span className="text-[10px] font-mono-code font-bold bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Lock className="w-3 h-3" /> 00:00
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Направление: <strong className="text-white">{category.name}</strong> • Выполнено: {selectedDayInfo.completedCount} из {selectedDayInfo.totalTasks}
                </p>
              </div>

              <button
                onClick={() => setIsDayModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status Banner */}
            {selectedDayInfo.status === 'green' && (
              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <strong className="font-gamer text-white block">🟢 100% ВЫПОЛНЕНИЕ</strong>
                  <span>Все задачи этого дня успешно завершены!</span>
                </div>
              </div>
            )}

            {selectedDayInfo.status === 'red' && (
              <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/40 text-xs text-rose-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  <div>
                    <strong className="font-gamer text-white block">🔴 ПРОПУСК ЗАДАЧ</strong>
                    <span>День зафиксирован в 00:00 с невыполненными задачами.</span>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenSkipReasonModal(selectedDate)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-gamer font-bold text-xs border border-slate-700 cursor-pointer shrink-0 transition-colors"
                >
                  УКАЗАТЬ ПРИЧИНУ
                </button>
              </div>
            )}

            {selectedDayInfo.status === 'gray' && (
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700 text-xs text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-5 h-5 text-slate-400 shrink-0" />
                  <div>
                    <strong className="font-gamer text-white block">⚪ ПРОПУСК С УВАЖИТЕЛЬНОЙ ПРИЧИНОЙ</strong>
                    <span className="italic">"{selectedDayInfo.reason}"</span>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenSkipReasonModal(selectedDate)}
                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-gamer border border-slate-700 cursor-pointer shrink-0"
                >
                  Изменить
                </button>
              </div>
            )}

            {/* Action to Add Task for this day (available if not locked past) */}
            {!selectedDayInfo.isPast && (
              <div className="flex justify-end">
                <button
                  onClick={() => handleOpenAddTaskModal(selectedDate)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-gamer font-bold text-xs cursor-pointer shadow-sm transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>ДОБАВИТЬ ЗАДАЧУ НА ЭТОТ ДЕНЬ</span>
                </button>
              </div>
            )}

            {/* Tasks List with Drag & Drop Reordering and Mobile Optimized Layout */}
            {selectedDayTasks.length === 0 ? (
              <div className="p-8 text-center bg-[#0B0F19] rounded-xl border border-dashed border-slate-800 text-slate-400">
                <CalendarIcon className="w-7 h-7 mx-auto text-slate-500 mb-2" />
                <p className="font-gamer font-bold text-sm text-slate-300">На эту дату нет задач</p>
                {!selectedDayInfo.isPast && (
                  <button
                    onClick={() => handleOpenAddTaskModal(selectedDate)}
                    className="mt-3 px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-gamer font-bold text-xs cursor-pointer"
                  >
                    Запланировать задачу
                  </button>
                )}
              </div>
            ) : (
              <Reorder.Group
                axis="y"
                values={selectedDayTasks}
                onReorder={handleReorderSelectedDayTasks}
                className="space-y-2.5"
              >
                {selectedDayTasks.map((task) => {
                  const isCompleted = isTaskCompletedOnDate(task, selectedDate);
                  const completionNote = getTaskNoteOnDate(task, selectedDate);
                  const isLocked = selectedDayInfo.isPast;

                  // For multi-tasks: which option is currently selected on this date
                  const selectedOptId =
                    task.recurrence === 'none'
                      ? task.selectedOptionId
                      : task.selectedOptionByDate?.[selectedDate];
                  const selectedOption =
                    task.type === 'multi' && task.options
                      ? task.options.find((o) => o.id === selectedOptId)
                      : null;

                  const displayXP = selectedOption ? selectedOption.xpReward : task.xpReward;
                  const displayUXP = selectedOption
                    ? (selectedOption.uxpReward ?? task.uxpReward)
                    : task.uxpReward;

                  return (
                    <Reorder.Item
                      key={task.id}
                      value={task}
                      whileDrag={{ scale: 1.02, zIndex: 30, boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                      className="list-none"
                    >
                      <div
                        className={`p-3 sm:p-3.5 rounded-xl border transition-all ${
                          isCompleted
                            ? 'border-emerald-500/30 bg-emerald-950/15'
                            : isLocked
                            ? 'border-rose-500/20 bg-rose-950/10 opacity-75'
                            : 'border-slate-800 bg-[#0B0F19] hover:border-slate-700'
                        }`}
                      >
                        {/* Task Card Header: strictly robust for mobile with flex-shrink-0 for controls */}
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="flex items-start gap-2.5 min-w-0 flex-1 overflow-hidden">
                            {!isLocked && (
                              <div
                                className="cursor-grab active:cursor-grabbing text-slate-600 hover:text-slate-400 pt-1 shrink-0 flex-shrink-0"
                                title="Перетащите для изменения порядка"
                              >
                                <GripVertical className="w-4 h-4" />
                              </div>
                            )}

                            {/* Checkbox */}
                            <button
                              disabled={isLocked}
                              onClick={(e) => {
                                if (task.type === 'multi') {
                                  setActiveMultiTask(task);
                                } else {
                                  handleTaskCheckboxClick(task, selectedDate, e);
                                }
                              }}
                              className={`mt-0.5 flex h-6 w-6 shrink-0 flex-shrink-0 items-center justify-center rounded-lg border transition-all ${
                                isCompleted
                                  ? 'border-emerald-400 bg-emerald-400 text-slate-950 shadow-[0_0_8px_rgba(52,211,153,0.4)]'
                                  : isLocked
                                  ? 'border-slate-800 bg-slate-900 text-slate-600 cursor-not-allowed'
                                  : 'border-slate-700 bg-slate-900 text-transparent hover:border-sky-400 hover:text-sky-400/40 cursor-pointer'
                              }`}
                              title={
                                isLocked
                                  ? 'День заблокирован в 00:00'
                                  : task.type === 'multi'
                                  ? 'Выбрать вариант выполнения'
                                  : 'Отметить выполнение'
                              }
                            >
                              <Check className="h-4 w-4 stroke-[3]" />
                            </button>

                            {/* Task Title & Details */}
                            <div className="min-w-0 flex-1 overflow-hidden">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <h4
                                  onClick={() => {
                                    if (task.type === 'multi') {
                                      setActiveMultiTask(task);
                                    }
                                  }}
                                  className={`font-gamer font-bold text-xs sm:text-sm min-w-0 flex-1 truncate ${
                                    task.type === 'multi' ? 'cursor-pointer hover:text-sky-300' : ''
                                  } ${isCompleted ? 'text-slate-400 line-through' : 'text-white'}`}
                                  title={task.title}
                                >
                                  {task.title}
                                </h4>

                                {task.type === 'multi' && (
                                  <span
                                    onClick={() => setActiveMultiTask(task)}
                                    className="text-[9px] font-gamer font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 shrink-0 flex-shrink-0 cursor-pointer hover:bg-purple-500/30"
                                  >
                                    МУЛЬТИ
                                  </span>
                                )}
                              </div>

                              {/* Badges / Recurrence info */}
                              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                {task.type === 'multi' && selectedOption && (
                                  <span className="text-[10px] font-mono-code font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 truncate max-w-full">
                                    ✓ Вариант: {selectedOption.title} (+{selectedOption.xpReward} XP)
                                  </span>
                                )}

                                {task.type === 'multi' && !selectedOption && !isLocked && (
                                  <button
                                    type="button"
                                    onClick={() => setActiveMultiTask(task)}
                                    className="text-[10px] font-gamer text-sky-400 hover:text-sky-300 underline cursor-pointer"
                                  >
                                    Выбрать вариант ({task.options?.length || 0})
                                  </button>
                                )}

                                {task.recurrence === 'daily' && (
                                  <span className="text-[9px] font-mono-code px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20">
                                    Ежедневно
                                  </span>
                                )}

                                {task.recurrence === 'weekly' && (
                                  <span className="text-[9px] font-mono-code px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                                    По дням недели
                                  </span>
                                )}

                                {task.difficulty && (
                                  <span className="text-[9px] font-mono-code px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                    {task.difficulty}
                                  </span>
                                )}
                              </div>

                              {task.notes && (
                                <p className="mt-1 text-xs text-slate-400 line-clamp-2">
                                  {task.notes}
                                </p>
                              )}

                              {/* Completion Note */}
                              {completionNote && (
                                <div className="mt-1.5 text-xs bg-emerald-500/10 border border-emerald-500/20 p-1.5 rounded-lg text-emerald-300 flex items-start gap-1.5">
                                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                  <span className="text-[11px] truncate">{completionNote}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Right Controls: Rewards + Edit/Delete */}
                          <div className="flex items-center gap-1.5 shrink-0 flex-shrink-0 ml-1">
                            <span className="font-mono-code font-bold text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg shrink-0 flex-shrink-0">
                              +{displayXP} XP
                            </span>
                            {displayUXP > 0 && (
                              <span className="font-mono-code font-bold text-[11px] text-sky-300 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-lg shrink-0 flex-shrink-0">
                                +{displayUXP} UXP
                              </span>
                            )}

                            {!isLocked && (
                              <div className="flex items-center gap-0.5 shrink-0 flex-shrink-0">
                                <button
                                  onClick={() => handleOpenEditTaskModal(task)}
                                  className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer hover:bg-slate-800"
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
                                  className="p-1 rounded-lg text-slate-400 hover:text-rose-400 cursor-pointer hover:bg-slate-800"
                                  title="Удалить"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Reorder.Item>
                  );
                })}
              </Reorder.Group>
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

      {/* UNIFIED TASK CREATION & EDIT MODAL (POP-UP) */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTaskFromModal}
        onSaveTask={handleSaveTaskFromModal}
        category={category}
        categoryId={category.id}
        initialDate={taskModalInitialDate}
        selectedDate={taskModalInitialDate}
        taskToEdit={taskToEdit}
      />

      {/* MULTI-TASK OPTIONS SELECTOR MODAL (POP-UP) */}
      <MultiTaskModal
        task={activeMultiTask}
        dateStr={selectedDate}
        isOpen={!!activeMultiTask}
        onClose={() => setActiveMultiTask(null)}
        onSelectOption={(taskId, date, optionId) => {
          if (onSelectMultiTaskOption) {
            onSelectMultiTaskOption(taskId, date, optionId);
          }
        }}
      />

      {/* SKIP REASON MODAL */}
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

      {/* RECURRING TASK DELETE MODAL */}
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
                  «{taskToDelete.task.title}»
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

      {/* 2-STEP CONFIRMATION MODAL FOR DELETING CATEGORY */}
      <AnimatePresence>
        {isDeleteCategoryOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#0F172A] border border-red-500/40 rounded-2xl p-6 shadow-[0_0_30px_rgba(239,68,68,0.25)] text-slate-100 relative"
            >
              {deleteCategoryStep === 1 ? (
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
                        «{category.name}»
                      </span>
                      ?
                    </p>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      При удалении будут стёрты все привязанные задачи ({categoryTasks.length}), звания, история выполнения и весь прогресс XP.
                    </p>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsDeleteCategoryOpen(false)}
                      className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 font-gamer text-xs cursor-pointer hover:bg-slate-800"
                    >
                      ОТМЕНА
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteCategoryStep(2)}
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
                    Категория «{category.name}» будет немедленно удалена из облака и вашего аккаунта навсегда.
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsDeleteCategoryOpen(false);
                        setDeleteCategoryStep(1);
                      }}
                      className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 font-gamer text-xs cursor-pointer hover:bg-slate-800"
                    >
                      ОТМЕНА
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDeleteCategoryOpen(false);
                        onDeleteCategory(category.id);
                      }}
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
