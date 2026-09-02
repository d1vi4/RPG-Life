import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Header,
} from './components/Header';
import { CategoryGrid } from './components/CategoryGrid';
import { CategoryView } from './components/CategoryView';
import { GlobalShopView } from './components/GlobalShopView';
import { SettingsPanel } from './components/SettingsPanel';
import { ActivityLogView } from './components/ActivityLogView';
import { PenaltyModal } from './components/PenaltyModal';
import { GlobalCalendarModal } from './components/GlobalCalendarModal';
import { Toast, ToastNotification } from './components/Toast';

import {
  Category,
  GlobalState,
  Task,
  ActivityLog,
  Penalty,
  CategoryShopItem,
  GlobalShopItem,
  CloudSyncStatus,
} from './types';
import {
  INITIAL_CATEGORIES,
  INITIAL_GLOBAL_STATE,
  INITIAL_TASKS,
  INITIAL_PENALTIES,
  INITIAL_LOGS,
  INITIAL_DAY_REASONS,
  getTodayDateString,
} from './data/initialData';
import { soundFX } from './utils/sound';
import { triggerTaskCompleteConfetti, triggerLevelUpConfetti } from './utils/confetti';
import {
  calculateCategoryProgression,
  calculateGlobalProgression,
} from './utils/progression';
import {
  loadAppStateFromSupabase,
  saveAppStateToSupabase,
  isSupabaseConfigured,
} from './services/supabaseSync';

export const App: React.FC = () => {
  // --- Core State Initialization (localStorage as instant cache) ---
  const [globalState, setGlobalState] = useState<GlobalState>(() => {
    try {
      const saved = localStorage.getItem('liferpg_global_v3');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_GLOBAL_STATE;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem('liferpg_categories_v3');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_CATEGORIES;
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem('liferpg_tasks_v3');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_TASKS;
  });

  const [penalties, setPenalties] = useState<Penalty[]>(() => {
    try {
      const saved = localStorage.getItem('liferpg_penalties_v3');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_PENALTIES;
  });

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    try {
      const saved = localStorage.getItem('liferpg_logs_v3');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_LOGS;
  });

  const [dayReasons, setDayReasons] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('liferpg_reasons_v3');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_DAY_REASONS;
  });

  // Cloud sync status state
  const [cloudSyncStatus, setCloudSyncStatus] = useState<CloudSyncStatus>(() =>
    isSupabaseConfigured() ? 'syncing' : 'offline'
  );
  const [isInitialLoadDone, setIsInitialLoadDone] = useState(false);

  // UI Navigation state
  const [activeTab, setActiveTab] = useState<'categories' | 'globalShop' | 'settings' | 'logs'>('categories');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [categoryInitialDate, setCategoryInitialDate] = useState<string | null>(null);

  // Modals & Sound
  const [isPenaltyModalOpen, setIsPenaltyModalOpen] = useState(false);
  const [penaltyInitialCategoryId, setPenaltyInitialCategoryId] = useState<string | null>(null);
  const [isGlobalCalendarOpen, setIsGlobalCalendarOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Toast notifications queue
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const addToast = (type: 'info' | 'success' | 'penalty' | 'levelup', title: string, message: string) => {
    const newToast: ToastNotification = {
      id: `toast-${Date.now()}-${Math.random()}`,
      type,
      title,
      message,
      duration: 5000,
      createdAt: Date.now(),
    };
    setToasts((prev) => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // --- Browser Back Button Navigation & History Management ---
  const isNavigatingFromHistory = useRef(false);

  useEffect(() => {
    // Initial history state setup
    window.history.replaceState({ activeTab: 'categories', selectedCategoryId: null }, '');

    const handlePopState = (event: PopStateEvent) => {
      isNavigatingFromHistory.current = true;
      if (isGlobalCalendarOpen) {
        setIsGlobalCalendarOpen(false);
        return;
      }
      if (isPenaltyModalOpen) {
        setIsPenaltyModalOpen(false);
        return;
      }
      if (event.state) {
        if (event.state.selectedCategoryId !== undefined) {
          setSelectedCategoryId(event.state.selectedCategoryId);
        }
        if (event.state.activeTab) {
          setActiveTab(event.state.activeTab);
        }
      } else {
        setSelectedCategoryId(null);
        setActiveTab('categories');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isGlobalCalendarOpen, isPenaltyModalOpen]);

  const handleSelectCategory = (catId: string | null, initialDate?: string) => {
    setSelectedCategoryId(catId);
    setCategoryInitialDate(initialDate || null);
    if (!isNavigatingFromHistory.current) {
      window.history.pushState({ activeTab: 'categories', selectedCategoryId: catId }, '');
    }
    isNavigatingFromHistory.current = false;
  };

  const handleTabChange = (tab: 'categories' | 'globalShop' | 'settings' | 'logs') => {
    setActiveTab(tab);
    setSelectedCategoryId(null);
    if (!isNavigatingFromHistory.current) {
      window.history.pushState({ activeTab: tab, selectedCategoryId: null }, '');
    }
    isNavigatingFromHistory.current = false;
  };

  // --- Initial Load from Supabase on App Mount ---
  useEffect(() => {
    let isMounted = true;

    const fetchRemoteData = async () => {
      if (!isSupabaseConfigured()) {
        setCloudSyncStatus('offline');
        setIsInitialLoadDone(true);
        return;
      }

      setCloudSyncStatus('syncing');
      try {
        const remoteData = await loadAppStateFromSupabase();
        if (remoteData && isMounted) {
          if (remoteData.globalState) setGlobalState(remoteData.globalState);
          if (Array.isArray(remoteData.categories)) setCategories(remoteData.categories);
          if (Array.isArray(remoteData.tasks)) setTasks(remoteData.tasks);
          if (Array.isArray(remoteData.penalties)) setPenalties(remoteData.penalties);
          if (Array.isArray(remoteData.activityLogs)) setActivityLogs(remoteData.activityLogs);
          if (remoteData.dayReasons) setDayReasons(remoteData.dayReasons);
          setCloudSyncStatus('synced');
        } else if (isMounted) {
          setCloudSyncStatus('synced');
        }
      } catch (err) {
        console.warn('Supabase initial fetch failed, using local cache:', err);
        if (isMounted) setCloudSyncStatus('offline');
      } finally {
        if (isMounted) setIsInitialLoadDone(true);
      }
    };

    fetchRemoteData();

    return () => {
      isMounted = false;
    };
  }, []);

  // --- Automatic Debounced Sync to Supabase & LocalStorage ---
  useEffect(() => {
    if (!isInitialLoadDone) return;

    // 1. Instant local persistence fallback
    localStorage.setItem('liferpg_global_v3', JSON.stringify(globalState));
    localStorage.setItem('liferpg_categories_v3', JSON.stringify(categories));
    localStorage.setItem('liferpg_tasks_v3', JSON.stringify(tasks));
    localStorage.setItem('liferpg_penalties_v3', JSON.stringify(penalties));
    localStorage.setItem('liferpg_logs_v3', JSON.stringify(activityLogs));
    localStorage.setItem('liferpg_reasons_v3', JSON.stringify(dayReasons));

    if (!isSupabaseConfigured()) {
      setCloudSyncStatus('offline');
      return;
    }

    setCloudSyncStatus('syncing');
    const timer = setTimeout(async () => {
      try {
        const success = await saveAppStateToSupabase({
          globalState,
          categories,
          tasks,
          penalties,
          activityLogs,
          dayReasons,
        });
        if (success) {
          setCloudSyncStatus('synced');
        } else {
          setCloudSyncStatus('error');
        }
      } catch (e) {
        console.error('Supabase auto-save error:', e);
        setCloudSyncStatus('error');
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [globalState, categories, tasks, penalties, activityLogs, dayReasons, isInitialLoadDone]);

  // --- Task Completion Handler with Recurrence, Notes & XP ---
  const handleToggleTask = (taskId: string, date: string, note?: string, event?: React.MouseEvent) => {
    const todayStr = getTodayDateString();
    // Block editing for past days (00:00 lock)
    if (date < todayStr) {
      addToast('penalty', 'День заблокирован', 'Задачи за прошедшие дни зафиксированы в 00:00 и закрыты для редактирования.');
      return;
    }

    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const targetCategory = categories.find((c) => c.id === task.categoryId);
    if (!targetCategory) return;

    // Check if task is currently completed on that date
    let willBeCompleted = false;
    if (task.recurrence === 'none') {
      willBeCompleted = !task.isCompleted;
    } else {
      const completedDates = task.completedDates || [];
      willBeCompleted = !completedDates.includes(date);
    }

    // 1. Update task completed state & completion notes
    const updatedTasks = tasks.map((t) => {
      if (t.id !== taskId) return t;

      if (t.recurrence === 'none') {
        return {
          ...t,
          isCompleted: willBeCompleted,
          completionNote: willBeCompleted ? note || t.completionNote : undefined,
        };
      } else {
        const completedDates = t.completedDates || [];
        const newDates = willBeCompleted
          ? [...completedDates.filter((d) => d !== date), date]
          : completedDates.filter((d) => d !== date);

        const currentNotes = { ...(t.completionNotesByDate || {}) };
        if (willBeCompleted && note) {
          currentNotes[date] = note;
        } else if (!willBeCompleted) {
          delete currentNotes[date];
        }

        return {
          ...t,
          completedDates: newDates,
          completionNotesByDate: currentNotes,
        };
      }
    });
    setTasks(updatedTasks);

    // 2. Play Sound and Confetti
    if (willBeCompleted) {
      soundFX.playTaskComplete();
      triggerTaskCompleteConfetti();
    }

    // 3. XP / UXP Adjustments
    const xpDelta = willBeCompleted ? task.xpReward : -task.xpReward;
    const uxpDelta = willBeCompleted ? task.uxpReward : -task.uxpReward;

    // 4. Update Category XP Balance and check Category Level Up
    setCategories((prevCategories) =>
      prevCategories.map((c) => {
        if (c.id !== targetCategory.id) return c;

        const newCategoryXP = willBeCompleted
          ? (c.categoryXP || 0) + task.xpReward
          : Math.max(0, (c.categoryXP || 0) - task.xpReward);

        const newHighestXP = willBeCompleted
          ? Math.max(c.highestCategoryXP || 0, newCategoryXP)
          : Math.max(0, (c.highestCategoryXP || 0) - task.xpReward);

        const prevProg = calculateCategoryProgression(c.categoryXP || 0, c.highestCategoryXP || 0, c.levels || []);
        const nextProg = calculateCategoryProgression(newCategoryXP, newHighestXP, c.levels || []);

        if (nextProg.currentLevel && nextProg.currentLevel.id !== prevProg.currentLevel?.id) {
          soundFX.playLevelUp();
          triggerLevelUpConfetti();
          addToast(
            'levelup',
            `Новое звание в «${c.name}»!`,
            `Вы достигли звания: ${nextProg.currentLevel.name}!`
          );

          // Add level up log
          setActivityLogs((prev) => [
            {
              id: `log-lvl-${Date.now()}-${Math.random()}`,
              type: 'levelup',
              title: `Новое звание в «${c.name}»`,
              details: `Получен ранг «${nextProg.currentLevel?.name}»`,
              timestamp: Date.now(),
              xpChange: 0,
              uxpChange: 0,
            },
            ...prev,
          ]);
        }

        return {
          ...c,
          categoryXP: newCategoryXP,
          highestCategoryXP: newHighestXP,
        };
      })
    );

    // 5. Update Global UXP state and check Global Level Up
    setGlobalState((prev) => {
      const newUXP = willBeCompleted
        ? (prev.globalUXP || 0) + task.uxpReward
        : Math.max(0, (prev.globalUXP || 0) - task.uxpReward);

      const newHighestUXP = willBeCompleted
        ? Math.max(prev.highestGlobalUXP || 0, newUXP)
        : Math.max(0, (prev.highestGlobalUXP || 0) - task.uxpReward);

      const prevProg = calculateGlobalProgression(prev.globalUXP || 0, prev.highestGlobalUXP || 0, prev.globalLevels || []);
      const nextProg = calculateGlobalProgression(newUXP, newHighestUXP, prev.globalLevels || []);

      if (nextProg.currentLevel && nextProg.currentLevel.id !== prevProg.currentLevel?.id) {
        soundFX.playLevelUp();
        triggerLevelUpConfetti();
        addToast(
          'levelup',
          'Новое глобальное звание!',
          `Вы достигли общего ранга: ${nextProg.currentLevel.name} (${newUXP} UXP)!`
        );
      }

      return {
        ...prev,
        globalUXP: newUXP,
        highestGlobalUXP: newHighestUXP,
      };
    });

    // 6. Strict Activity Log
    setActivityLogs((prev) => [
      {
        id: `log-${Date.now()}-${Math.random()}`,
        type: willBeCompleted ? 'task_complete' : 'task_uncomplete',
        title: willBeCompleted ? 'Задача выполнена' : 'Выполнение задачи отменено',
        details: `${task.title} (${targetCategory.name}) ${note ? `• Заметка: ${note}` : ''}`,
        timestamp: Date.now(),
        xpChange: xpDelta,
        uxpChange: uxpDelta,
      },
      ...prev,
    ]);
  };

  // --- Category CRUD ---
  const handleAddCategory = (
    newCatData: Omit<Category, 'id' | 'categoryXP' | 'highestCategoryXP' | 'levels' | 'shopItems'>
  ) => {
    const newCategory: Category = {
      ...newCatData,
      id: `cat-${Date.now()}`,
      categoryXP: 0,
      highestCategoryXP: 0,
      levels: [],
      shopItems: [],
    };

    setCategories((prev) => [...prev, newCategory]);
    addToast('success', 'Категория создана', `Направление «${newCategory.name}» успешно добавлено.`);
  };

  const handleDeleteCategory = (categoryId: string) => {
    const targetCat = categories.find((c) => c.id === categoryId);
    setCategories((prev) => prev.filter((c) => c.id !== categoryId));
    setTasks((prev) => prev.filter((t) => t.categoryId !== categoryId));

    if (selectedCategoryId === categoryId) {
      setSelectedCategoryId(null);
    }

    addToast(
      'info',
      'Категория удалена',
      `Категория «${targetCat?.name || ''}» и все её задачи безвозвратно удалены.`
    );
  };

  const handleReorderCategories = (newCategories: Category[]) => {
    setCategories(newCategories);
  };

  const handleReorderTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
  };

  // --- Task CRUD & Cleanup on Deletion ---
  const handleAddTask = (newTaskData: Omit<Task, 'id'>) => {
    const newTask: Task = {
      ...newTaskData,
      id: `task-${Date.now()}`,
      completedDates: [],
    };
    setTasks((prev) => [newTask, ...prev]);
    addToast('info', 'Задача добавлена', `Задача «${newTask.title}» успешно запланирована.`);
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
    addToast('info', 'Задача обновлена', `Изменения в «${updatedTask.title}» сохранены.`);
  };

  // When a task is deleted, cleanly deduct all XP, UXP, Title XP and Title UXP earned from it
  const handleDeleteTask = (taskId: string) => {
    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask) return;

    // Calculate how many times this task was completed
    let completedCount = 0;
    if (targetTask.recurrence === 'none') {
      completedCount = targetTask.isCompleted ? 1 : 0;
    } else {
      completedCount = (targetTask.completedDates || []).length;
    }

    const totalEarnedXP = completedCount * (targetTask.xpReward || 0);
    const totalEarnedUXP = completedCount * (targetTask.uxpReward || 0);

    // 1. Remove task from tasks state
    setTasks((prev) => prev.filter((t) => t.id !== taskId));

    // 2. If XP was earned, deduct from category XP and highestCategoryXP
    if (totalEarnedXP > 0) {
      setCategories((prevCategories) =>
        prevCategories.map((c) => {
          if (c.id !== targetTask.categoryId) return c;
          const newXP = Math.max(0, (c.categoryXP || 0) - totalEarnedXP);
          const newHighestXP = Math.max(0, (c.highestCategoryXP || 0) - totalEarnedXP);
          return {
            ...c,
            categoryXP: newXP,
            highestCategoryXP: newHighestXP,
          };
        })
      );
    }

    // 3. If UXP was earned, deduct from global UXP and highestGlobalUXP
    if (totalEarnedUXP > 0) {
      setGlobalState((prev) => {
        const newUXP = Math.max(0, (prev.globalUXP || 0) - totalEarnedUXP);
        const newHighestUXP = Math.max(0, (prev.highestGlobalUXP || 0) - totalEarnedUXP);
        return {
          ...prev,
          globalUXP: newUXP,
          highestGlobalUXP: newHighestUXP,
        };
      });
    }

    // 4. Activity Log
    setActivityLogs((prev) => [
      {
        id: `log-deltask-${Date.now()}-${Math.random()}`,
        type: 'task_uncomplete',
        title: 'Удаление задачи и списание наград',
        details: `Удалена задача «${targetTask.title}» (${completedCount} выполнений). Списано: ${totalEarnedXP} XP и ${totalEarnedUXP} UXP.`,
        timestamp: Date.now(),
        xpChange: -totalEarnedXP,
        uxpChange: -totalEarnedUXP,
      },
      ...prev,
    ]);

    addToast(
      'info',
      'Задача удалена',
      totalEarnedXP > 0 || totalEarnedUXP > 0
        ? `Удалена задача «${targetTask.title}». Награды (-${totalEarnedXP} XP, -${totalEarnedUXP} UXP) списаны с баланса и титула.`
        : `Задача «${targetTask.title}» удалена.`
    );
  };

  const handleDeleteTaskInstance = (taskId: string, dateStr: string) => {
    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask) return;

    const isCompletedOnDate =
      targetTask.recurrence === 'none'
        ? !!targetTask.isCompleted
        : (targetTask.completedDates || []).includes(dateStr);

    const xpToDeduct = isCompletedOnDate ? targetTask.xpReward || 0 : 0;
    const uxpToDeduct = isCompletedOnDate ? targetTask.uxpReward || 0 : 0;

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const excluded = t.excludedDates || [];
        const completed = t.completedDates || [];
        return {
          ...t,
          excludedDates: excluded.includes(dateStr) ? excluded : [...excluded, dateStr],
          completedDates: completed.filter((d) => d !== dateStr),
        };
      })
    );

    if (xpToDeduct > 0) {
      setCategories((prevCategories) =>
        prevCategories.map((c) => {
          if (c.id !== targetTask.categoryId) return c;
          return {
            ...c,
            categoryXP: Math.max(0, (c.categoryXP || 0) - xpToDeduct),
            highestCategoryXP: Math.max(0, (c.highestCategoryXP || 0) - xpToDeduct),
          };
        })
      );
    }

    if (uxpToDeduct > 0) {
      setGlobalState((prev) => ({
        ...prev,
        globalUXP: Math.max(0, (prev.globalUXP || 0) - uxpToDeduct),
        highestGlobalUXP: Math.max(0, (prev.highestGlobalUXP || 0) - uxpToDeduct),
      }));
    }

    addToast('info', 'Задача скрыта на дату', `Задача удалена на день ${dateStr}.`);
  };

  // --- Skip Reason for Red Past Day ---
  const handleSetDayReason = (categoryId: string, date: string, reason: string) => {
    const key = `${categoryId}_${date}`;
    setDayReasons((prev) => ({
      ...prev,
      [key]: reason,
    }));
    addToast('info', 'Причина зафиксирована', `День ${date} помечен как уважительный пропуск.`);
  };

  // --- Shop Purchases ---
  const handleBuyCategoryShopItem = (categoryId: string, item: CategoryShopItem) => {
    const cat = categories.find((c) => c.id === categoryId);
    if (!cat || cat.categoryXP < item.costXP) return;

    setCategories((prev) =>
      prev.map((c) =>
        c.id === categoryId ? { ...c, categoryXP: Math.max(0, c.categoryXP - item.costXP) } : c
      )
    );

    setActivityLogs((prev) => [
      {
        id: `log-shop-${Date.now()}-${Math.random()}`,
        type: 'purchase',
        title: 'Покупка в магазине категории',
        details: `Куплено: «${item.name}» в «${cat.name}»`,
        timestamp: Date.now(),
        xpChange: -item.costXP,
        uxpChange: 0,
      },
      ...prev,
    ]);

    addToast('success', 'Покупка совершена!', `Куплено: «${item.name}» за ${item.costXP} XP.`);
  };

  const handleBuyGlobalShopItem = (item: GlobalShopItem) => {
    if (globalState.globalUXP < item.costUXP) return;

    setGlobalState((prev) => ({
      ...prev,
      globalUXP: Math.max(0, prev.globalUXP - item.costUXP),
    }));

    setActivityLogs((prev) => [
      {
        id: `log-gshop-${Date.now()}-${Math.random()}`,
        type: 'purchase',
        title: 'Покупка в общем UXP магазине',
        details: `Куплена награда: «${item.name}»`,
        timestamp: Date.now(),
        xpChange: 0,
        uxpChange: -item.costUXP,
      },
      ...prev,
    ]);

    addToast('success', 'Элитная награда получена!', `Куплено: «${item.name}» за ${item.costUXP} UXP.`);
  };

  // --- Penalties Logic (Category XP + Title XP deduction OR Global UXP + Title UXP deduction) ---
  const handleApplyPenalty = (
    penalty: Penalty,
    targetCategoryId?: string,
    penaltyScope?: 'category' | 'global'
  ) => {
    soundFX.playPenalty();

    const isGlobal = penaltyScope === 'global' || penalty.scope === 'global';

    if (isGlobal) {
      // Global penalty: Deduct from globalUXP AND highestGlobalUXP
      const uxpDeduct = penalty.xpDeduction;

      setGlobalState((prev) => {
        const newUXP = Math.max(0, (prev.globalUXP || 0) - uxpDeduct);
        const newHighestUXP = Math.max(0, (prev.highestGlobalUXP || 0) - uxpDeduct);
        return {
          ...prev,
          globalUXP: newUXP,
          highestGlobalUXP: newHighestUXP,
        };
      });

      setActivityLogs((prev) => [
        {
          id: `log-pen-global-${Date.now()}-${Math.random()}`,
          type: 'penalty',
          title: `Глобальный штраф: ${penalty.name}`,
          details: `${penalty.actionDescription} (-${uxpDeduct} UXP с баланса и титульного рекорда)`,
          timestamp: Date.now(),
          xpChange: 0,
          uxpChange: -uxpDeduct,
        },
        ...prev,
      ]);

      addToast(
        'penalty',
        `Глобальный штраф: -${uxpDeduct} UXP`,
        `${penalty.name}: ${penalty.actionDescription} (списано с баланса и титула)`
      );
    } else {
      // Category penalty: Deduct from categoryXP AND highestCategoryXP of the specific category
      const targetCat =
        categories.find((c) => c.id === targetCategoryId) ||
        categories.find((c) => c.id === penalty.targetCategoryId) ||
        categories[0];

      if (targetCat) {
        const xpDeduct = penalty.xpDeduction;

        setCategories((prev) =>
          prev.map((c) => {
            if (c.id !== targetCat.id) return c;
            const newXP = Math.max(0, (c.categoryXP || 0) - xpDeduct);
            const newHighestXP = Math.max(0, (c.highestCategoryXP || 0) - xpDeduct);
            return {
              ...c,
              categoryXP: newXP,
              highestCategoryXP: newHighestXP,
            };
          })
        );

        setActivityLogs((prev) => [
          {
            id: `log-pen-cat-${Date.now()}-${Math.random()}`,
            type: 'penalty',
            title: `Штраф категории «${targetCat.name}»: ${penalty.name}`,
            details: `${penalty.actionDescription} (-${xpDeduct} XP с баланса и титульного рекорда категории)`,
            timestamp: Date.now(),
            xpChange: -xpDeduct,
            uxpChange: 0,
          },
          ...prev,
        ]);

        addToast(
          'penalty',
          `Штраф в «${targetCat.name}»: -${xpDeduct} XP`,
          `${penalty.name}: ${penalty.actionDescription} (списано с баланса и титула)`
        );
      }
    }
  };

  // --- Reset & Import Data ---
  const handleResetAllData = async () => {
    // 1. Reset React states
    setGlobalState(INITIAL_GLOBAL_STATE);
    setCategories(INITIAL_CATEGORIES);
    setTasks(INITIAL_TASKS);
    setPenalties(INITIAL_PENALTIES);
    setActivityLogs(INITIAL_LOGS);
    setDayReasons(INITIAL_DAY_REASONS);
    setSelectedCategoryId(null);
    setActiveTab('categories');

    // 2. Clear local storage specifically
    localStorage.setItem('liferpg_global_v3', JSON.stringify(INITIAL_GLOBAL_STATE));
    localStorage.setItem('liferpg_categories_v3', JSON.stringify(INITIAL_CATEGORIES));
    localStorage.setItem('liferpg_tasks_v3', JSON.stringify(INITIAL_TASKS));
    localStorage.setItem('liferpg_penalties_v3', JSON.stringify(INITIAL_PENALTIES));
    localStorage.setItem('liferpg_logs_v3', JSON.stringify(INITIAL_LOGS));
    localStorage.setItem('liferpg_reasons_v3', JSON.stringify(INITIAL_DAY_REASONS));

    // 3. Immediately persist clean zero state to Supabase
    if (isSupabaseConfigured()) {
      setCloudSyncStatus('syncing');
      try {
        await saveAppStateToSupabase({
          globalState: INITIAL_GLOBAL_STATE,
          categories: INITIAL_CATEGORIES,
          tasks: INITIAL_TASKS,
          penalties: INITIAL_PENALTIES,
          activityLogs: INITIAL_LOGS,
          dayReasons: INITIAL_DAY_REASONS,
        });
        setCloudSyncStatus('synced');
      } catch (err) {
        console.error('Failed to sync zero state to Supabase:', err);
      }
    }

    addToast('info', 'Система очищена', 'Все параметры сброшены в абсолютный ноль.');
  };

  const handleImportData = (data: any) => {
    if (!data) return;
    if (data.globalState) setGlobalState(data.globalState);
    if (Array.isArray(data.categories)) setCategories(data.categories);
    if (Array.isArray(data.tasks)) setTasks(data.tasks);
    if (Array.isArray(data.penalties)) setPenalties(data.penalties);
    if (Array.isArray(data.activityLogs)) setActivityLogs(data.activityLogs);
    if (data.dayReasons) setDayReasons(data.dayReasons);
    addToast('success', 'Импорт завершен', 'Данные успешно загружены.');
  };

  const activeCategory = categories.find((c) => c.id === selectedCategoryId);

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* Dynamic Toast Notifications */}
      <Toast toasts={toasts} onDismiss={removeToast} />

      {/* Header & Sidebar Navigation */}
      <Header
        globalState={globalState}
        categories={categories}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onOpenPenaltyModal={() => {
          setPenaltyInitialCategoryId(selectedCategoryId);
          setIsPenaltyModalOpen(true);
        }}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((prev) => !prev)}
        cloudSyncStatus={cloudSyncStatus}
      />

      {/* Main Content Area with bottom padding for mobile navigation */}
      <main className="lg:pl-72 flex-1 flex flex-col min-w-0 pb-24 lg:pb-8">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* VIEW ROUTING */}
          {activeTab === 'categories' && (
            <>
              {selectedCategoryId && activeCategory ? (
                <CategoryView
                  category={activeCategory}
                  tasks={tasks}
                  dayReasons={dayReasons}
                  initialSelectedDate={categoryInitialDate || undefined}
                  onBack={() => handleSelectCategory(null)}
                  onToggleTask={handleToggleTask}
                  onAddTask={handleAddTask}
                  onUpdateTask={handleUpdateTask}
                  onDeleteTask={handleDeleteTask}
                  onDeleteTaskInstance={handleDeleteTaskInstance}
                  onDeleteCategory={handleDeleteCategory}
                  onSetDayReason={handleSetDayReason}
                  onBuyCategoryShopItem={handleBuyCategoryShopItem}
                  onOpenCategorySettings={() => handleTabChange('settings')}
                  onOpenPenaltyModal={(catId) => {
                    setPenaltyInitialCategoryId(catId || selectedCategoryId);
                    setIsPenaltyModalOpen(true);
                  }}
                  onReorderTasks={handleReorderTasks}
                />
              ) : (
                <CategoryGrid
                  categories={categories}
                  tasks={tasks}
                  onSelectCategory={(catId) => handleSelectCategory(catId)}
                  onAddCategory={handleAddCategory}
                  onDeleteCategory={handleDeleteCategory}
                  onReorderCategories={handleReorderCategories}
                  onOpenGlobalCalendar={() => setIsGlobalCalendarOpen(true)}
                />
              )}
            </>
          )}

          {activeTab === 'globalShop' && (
            <GlobalShopView
              globalState={globalState}
              onBuyItem={handleBuyGlobalShopItem}
              onNavigateToSettings={() => handleTabChange('settings')}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsPanel
              globalState={globalState}
              categories={categories}
              penalties={penalties}
              onUpdateGlobalState={setGlobalState}
              onUpdateCategories={setCategories}
              onUpdatePenalties={setPenalties}
              onResetAllData={handleResetAllData}
              onImportData={handleImportData}
              onOpenSyncModal={() => {}}
              onShowToast={addToast}
            />
          )}

          {activeTab === 'logs' && (
            <ActivityLogView
              logs={activityLogs}
              onClearLogs={() => setActivityLogs([])}
            />
          )}
        </div>
      </main>

      {/* Global Calendar Modal across all categories */}
      <GlobalCalendarModal
        isOpen={isGlobalCalendarOpen}
        onClose={() => setIsGlobalCalendarOpen(false)}
        categories={categories}
        tasks={tasks}
        onSelectCategoryOnDate={(categoryId, dateStr) => {
          setIsGlobalCalendarOpen(false);
          setActiveTab('categories');
          handleSelectCategory(categoryId, dateStr);
        }}
      />

      {/* Penalty Modal */}
      <PenaltyModal
        isOpen={isPenaltyModalOpen}
        onClose={() => {
          setIsPenaltyModalOpen(false);
          setPenaltyInitialCategoryId(null);
        }}
        penalties={penalties}
        categories={categories}
        initialCategoryId={penaltyInitialCategoryId}
        onApplyPenalty={handleApplyPenalty}
      />
    </div>
  );
};

export default App;

