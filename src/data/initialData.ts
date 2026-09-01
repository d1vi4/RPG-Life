import { Category, GlobalState, Task, Penalty, ActivityLog } from '../types';

export const getTodayDateString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getRelativeDateString = (offsetDays: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Returns ISO day of week: 1 (Monday) to 7 (Sunday)
 */
export const getDayOfWeek = (dateStr: string): number => {
  const d = new Date(`${dateStr}T00:00:00`);
  const day = d.getDay();
  return day === 0 ? 7 : day;
};

export const INITIAL_GLOBAL_STATE: GlobalState = {
  globalUXP: 0,
  highestGlobalUXP: 0,
  globalLevels: [],
  globalShop: [],
  lastCheckDate: getTodayDateString(),
};

export const INITIAL_CATEGORIES: Category[] = [];

export const INITIAL_TASKS: Task[] = [];

export const INITIAL_PENALTIES: Penalty[] = [];

export const INITIAL_LOGS: ActivityLog[] = [];

export const INITIAL_DAY_REASONS: Record<string, string> = {};
