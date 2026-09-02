import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { Category, Task } from '../types';
import { getTodayDateString, getDayOfWeek } from '../data/initialData';
import { DynamicIcon } from './DynamicIcon';

interface GlobalCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  tasks: Task[];
  onSelectCategoryOnDate: (categoryId: string, dateStr: string) => void;
}

export const GlobalCalendarModal: React.FC<GlobalCalendarModalProps> = ({
  isOpen,
  onClose,
  categories,
  tasks,
  onSelectCategoryOnDate,
}) => {
  const todayStr = getTodayDateString();
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

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

  /**
   * Helper: Get tasks for a given date across all categories
   */
  const getTasksForDate = (dateStr: string): Task[] => {
    const dayOfWeek = getDayOfWeek(dateStr);
    return tasks.filter((t) => {
      if (t.excludedDates && t.excludedDates.includes(dateStr)) return false;
      if (t.recurrence === 'daily') return true;
      if (t.recurrence === 'weekly') {
        return (t.repeatDays || []).includes(dayOfWeek);
      }
      return t.date === dateStr;
    });
  };

  const isTaskCompletedOnDate = (task: Task, dateStr: string): boolean => {
    if (task.recurrence === 'none') {
      return !!task.isCompleted;
    }
    return (task.completedDates || []).includes(dateStr);
  };

  // Calendar month grid calculation
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const numDays = lastDayOfMonth.getDate();

    let startDayOfWeek = firstDayOfMonth.getDay();
    startDayOfWeek = startDayOfWeek === 0 ? 7 : startDayOfWeek;

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

  // Selected date statistics & grouped tasks by category
  const selectedDateTasks = useMemo(() => {
    return getTasksForDate(selectedDate);
  }, [selectedDate, tasks]);

  const categoriesWithTasksOnDate = useMemo(() => {
    const map = new Map<string, { category: Category; tasks: Task[]; completedCount: number }>();

    for (const task of selectedDateTasks) {
      const cat = categories.find((c) => c.id === task.categoryId);
      if (!cat) continue;
      const isDone = isTaskCompletedOnDate(task, selectedDate);
      if (!map.has(cat.id)) {
        map.set(cat.id, { category: cat, tasks: [], completedCount: 0 });
      }
      const entry = map.get(cat.id)!;
      entry.tasks.push(task);
      if (isDone) entry.completedCount++;
    }

    return Array.from(map.values());
  }, [selectedDateTasks, categories, selectedDate]);

  if (!isOpen) return null;

  const WEEK_DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.15 }}
        className="w-full max-w-5xl bg-[#0F172A] border border-slate-800 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] text-slate-100 flex flex-col max-h-[92vh] overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-[#0B0F19]/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-gamer font-bold text-base sm:text-lg text-white flex items-center gap-2">
                <span>ОБЩИЙ КАЛЕНДАРЬ ЗАДАЧ</span>
              </h2>
              <p className="text-xs text-slate-400 hidden sm:block">
                Единый обзор всех направлений и распределение задач по дням
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body: Calendar Grid + Day Details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 flex-1 overflow-y-auto min-h-0">
          {/* Left / Top: Full Month Calendar (7 cols on lg) */}
          <div className="lg:col-span-7 p-4 sm:p-5 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col space-y-4">
            {/* Month Navigation Controls */}
            <div className="flex items-center justify-between bg-[#0B0F19] p-2.5 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
                title="Предыдущий месяц"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2.5">
                <span className="font-gamer font-bold text-sm sm:text-base text-white tracking-wide">
                  {monthNames[currentMonth]} {currentYear}
                </span>
                <button
                  type="button"
                  onClick={handleTodayMonth}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-gamer font-bold text-sky-400 bg-sky-500/10 border border-sky-500/25 hover:bg-sky-500/20 transition-colors cursor-pointer"
                >
                  СЕГОДНЯ
                </button>
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
                title="Следующий месяц"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Weekdays Header */}
            <div className="grid grid-cols-7 gap-1.5 text-center">
              {WEEK_DAYS.map((day, idx) => (
                <div
                  key={day}
                  className={`text-[11px] font-gamer font-bold py-1 ${
                    idx >= 5 ? 'text-rose-400/80' : 'text-slate-400'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Month Days Grid */}
            <div className="grid grid-cols-7 gap-1.5 flex-1 auto-rows-fr">
              {calendarDays.map((cell) => {
                const dayTasks = getTasksForDate(cell.dateStr);
                const total = dayTasks.length;
                const completed = dayTasks.filter((t) => isTaskCompletedOnDate(t, cell.dateStr)).length;
                const isSelected = cell.dateStr === selectedDate;
                const isToday = cell.dateStr === todayStr;
                const isPast = cell.dateStr < todayStr;

                // Category dots on this cell (up to 4 unique category colors)
                const uniqueCatColors = Array.from(
                  new Set(
                    dayTasks
                      .map((t) => categories.find((c) => c.id === t.categoryId)?.color)
                      .filter(Boolean) as string[]
                  )
                ).slice(0, 4);

                let statusBorder = 'border-slate-800/80 bg-[#0B0F19]/70';
                if (isSelected) {
                  statusBorder = 'border-sky-400 bg-sky-950/40 ring-2 ring-sky-500/30';
                } else if (isToday) {
                  statusBorder = 'border-amber-500/50 bg-[#0B0F19] ring-1 ring-amber-500/30';
                } else if (total > 0 && completed === total) {
                  statusBorder = 'border-emerald-500/40 bg-emerald-950/20';
                } else if (total > 0 && isPast && completed < total) {
                  statusBorder = 'border-red-500/30 bg-red-950/20';
                }

                return (
                  <button
                    key={cell.dateStr}
                    type="button"
                    onClick={() => setSelectedDate(cell.dateStr)}
                    className={`min-h-[54px] sm:min-h-[64px] p-1.5 rounded-xl border flex flex-col justify-between transition-all cursor-pointer text-left relative ${statusBorder} ${
                      !cell.isCurrentMonth ? 'opacity-30' : 'hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`font-mono-code font-bold text-xs ${
                          isSelected
                            ? 'text-sky-300'
                            : isToday
                            ? 'text-amber-400'
                            : cell.isCurrentMonth
                            ? 'text-slate-200'
                            : 'text-slate-600'
                        }`}
                      >
                        {cell.dayNum}
                      </span>

                      {total > 0 && (
                        <span
                          className={`text-[9px] font-mono-code font-bold px-1 rounded ${
                            completed === total
                              ? 'text-emerald-400 bg-emerald-500/20'
                              : isPast
                              ? 'text-red-400 bg-red-500/20'
                              : 'text-sky-300 bg-sky-500/20'
                          }`}
                        >
                          {completed}/{total}
                        </span>
                      )}
                    </div>

                    {/* Category Colored Dots */}
                    <div className="flex items-center gap-1 mt-1 min-h-[6px]">
                      {uniqueCatColors.map((col, idx) => (
                        <span
                          key={idx}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: col }}
                        />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right / Bottom: Selected Day Breakdown by Category (5 cols on lg) */}
          <div className="lg:col-span-5 p-4 sm:p-5 flex flex-col space-y-4 bg-[#0B0F19]/40 overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <div>
                <span className="text-[11px] font-gamer text-slate-400 uppercase tracking-wider block">
                  Выбранный день:
                </span>
                <h3 className="font-gamer font-bold text-base sm:text-lg text-white">
                  {selectedDate === todayStr ? `Сегодня (${selectedDate})` : selectedDate}
                </h3>
              </div>

              <div className="text-right font-mono-code text-xs">
                <span className="text-slate-400 block text-[10px]">Всего задач:</span>
                <span className="font-bold text-sky-400">
                  {selectedDateTasks.filter((t) => isTaskCompletedOnDate(t, selectedDate)).length} /{' '}
                  {selectedDateTasks.length}
                </span>
              </div>
            </div>

            {/* List of categories that have tasks on this date */}
            {categoriesWithTasksOnDate.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                <Clock className="w-8 h-8 mb-2 opacity-40 text-slate-400" />
                <p className="font-gamer text-sm text-slate-400">На этот день нет запланированных задач</p>
                <p className="text-xs text-slate-600 mt-1 max-w-xs">
                  Перейдите в нужное направление на главном экране, чтобы создать новые задачи.
                </p>
              </div>
            ) : (
              <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                {categoriesWithTasksOnDate.map(({ category, tasks: catTasks, completedCount }) => {
                  const isDoneAll = completedCount === catTasks.length;

                  return (
                    <div
                      key={category.id}
                      className="p-3.5 rounded-2xl border border-slate-800/90 bg-[#0F172A] hover:border-slate-700 transition-all space-y-2.5 shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center border shrink-0"
                            style={{
                              backgroundColor: `${category.color}15`,
                              borderColor: `${category.color}40`,
                              color: category.color,
                            }}
                          >
                            <DynamicIcon name={category.icon} className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-gamer font-bold text-xs sm:text-sm text-white truncate">
                              {category.name}
                            </h4>
                            <span
                              className="text-[10px] font-mono-code font-bold uppercase"
                              style={{ color: category.color }}
                            >
                              {completedCount}/{catTasks.length} выполнено
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onSelectCategoryOnDate(category.id, selectedDate);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 font-gamer font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                        >
                          <span>ОТКРЫТЬ</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Mini list of tasks */}
                      <div className="space-y-1 pt-1 border-t border-slate-800/60">
                        {catTasks.map((t) => {
                          const isDone = isTaskCompletedOnDate(t, selectedDate);
                          return (
                            <div
                              key={t.id}
                              className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-[#0B0F19]/60 text-slate-300"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {isDone ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                ) : (
                                  <div className="w-3.5 h-3.5 rounded-full border border-slate-600 shrink-0" />
                                )}
                                <span className={`truncate text-[11px] ${isDone ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                                  {t.title}
                                </span>
                              </div>
                              <span className="font-mono-code text-[10px] text-amber-400/80 shrink-0 ml-2">
                                +{t.xpReward} XP
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
