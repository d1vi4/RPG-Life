export type CurrencyType = 'XP' | 'UXP';
export type TaskDifficulty = 'Easy' | 'Medium' | 'Hard' | 'Olympiad';
export type TaskRecurrence = 'none' | 'daily' | 'weekly';
export type TaskType = 'standard' | 'multi';

export type TitleVisualEffect = 'none' | 'glow' | 'neon' | 'shimmer';
export type TitleEffect = TitleVisualEffect;

export interface TaskOption {
  id: string;
  title: string;
  xpReward: number;
  uxpReward?: number;
}

export interface CategoryLevel {
  id: string;
  name: string;
  requiredXP: number;
  rewardDescription?: string;
  icon?: string;
  color?: string; // Default #3b82f6 (blue)
  effect?: TitleVisualEffect; // 'none' | 'glow' | 'neon' | 'shimmer'
}

export interface CategoryShopItem {
  id: string;
  name: string;
  costXP: number;
  icon?: string;
  description?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
  categoryXP: number; // Balance of XP in this category
  highestCategoryXP: number; // Highest XP ever achieved in this category (for titles/ranks)
  levels: CategoryLevel[]; // Category-specific titles/levels
  shopItems: CategoryShopItem[]; // Category-specific shop items for XP
}

export interface GlobalLevel {
  id: string;
  name: string;
  requiredUXP: number;
  rewardDescription?: string;
  icon?: string;
  color?: string; // Default #3b82f6 (blue)
  effect?: TitleVisualEffect; // 'none' | 'glow' | 'neon' | 'shimmer'
}

export interface GlobalShopItem {
  id: string;
  name: string;
  costUXP: number;
  icon?: string;
  description?: string;
}

export interface GlobalState {
  globalUXP: number; // Global UXP balance
  highestGlobalUXP: number; // Historical max UXP
  globalLevels: GlobalLevel[]; // Titles for UXP
  globalShop: GlobalShopItem[]; // Shop items for UXP
  lastCheckDate?: string; // YYYY-MM-DD
}

export interface Task {
  id: string;
  categoryId: string;
  date: string; // YYYY-MM-DD
  title: string;
  xpReward: number; // XP to add to categoryXP
  uxpReward: number; // UXP to add to globalUXP
  isCompleted: boolean;
  recurrence: TaskRecurrence; // 'none' | 'daily' | 'weekly'
  repeatDays?: number[]; // [1, 4] for Mon=1 ... Sun=7
  completedDates?: string[]; // List of YYYY-MM-DD for which recurring or single task was completed
  excludedDates?: string[]; // List of YYYY-MM-DD for which this recurring task was removed individually
  completionNote?: string; // Note left upon task completion
  completionNotesByDate?: Record<string, string>; // Completion notes per date
  difficulty?: TaskDifficulty;
  notes?: string;

  // Multi-option task support
  type?: TaskType; // 'standard' | 'multi'
  options?: TaskOption[]; // 2 or more options when type === 'multi'
  selectedOptionId?: string; // ID of chosen option for non-recurring multi-task
  selectedOptionByDate?: Record<string, string>; // dateStr -> optionId for recurring multi-task

  // Protection from retroactive penalties & calendar display
  createdAt?: string; // Date or timestamp of task creation (YYYY-MM-DD or ISO)
}

export type CloudSyncStatus = 'synced' | 'saving' | 'error' | 'offline';

export interface Penalty {
  id: string;
  name: string;
  xpDeduction: number;
  actionDescription: string;
  scope?: 'category' | 'global';
  targetCategoryId?: string | null; // Optional specific category if scope === 'category'
  categoryId?: string | null;
  amountXP?: number;
  description?: string;
}

export interface ActivityLog {
  id: string;
  type: 'task_complete' | 'task_uncomplete' | 'penalty' | 'purchase' | 'levelup';
  title: string;
  details: string;
  timestamp: number; // Date.now()
  xpChange?: number;
  uxpChange?: number;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  syncId: string;
}
