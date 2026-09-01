import { CategoryLevel, GlobalLevel } from '../types';

export interface CategoryProgression {
  currentLevel: CategoryLevel | null;
  nextLevel: CategoryLevel | null;
  currentLevelIndex: number;
  totalLevelsCount: number;
  isMaxLevel: boolean;
  floorXP: number;
  nextLevelXP: number;
  progressPercent: number;
}

export interface GlobalProgression {
  currentLevel: GlobalLevel | null;
  nextLevel: GlobalLevel | null;
  currentLevelIndex: number;
  totalLevelsCount: number;
  isMaxLevel: boolean;
  floorUXP: number;
  nextLevelUXP: number;
  progressPercent: number;
}

export const getSortedCategoryLevels = (levels: CategoryLevel[]): CategoryLevel[] => {
  return [...levels].sort((a, b) => a.requiredXP - b.requiredXP);
};

export const getSortedGlobalLevels = (levels: GlobalLevel[]): GlobalLevel[] => {
  return [...levels].sort((a, b) => a.requiredUXP - b.requiredUXP);
};

export const calculateCategoryProgression = (
  categoryXP: number,
  highestXP: number,
  levels: CategoryLevel[]
): CategoryProgression => {
  const sorted = getSortedCategoryLevels(levels);

  if (sorted.length === 0) {
    return {
      currentLevel: null,
      nextLevel: null,
      currentLevelIndex: -1,
      totalLevelsCount: 0,
      isMaxLevel: true,
      floorXP: 0,
      nextLevelXP: 0,
      progressPercent: 0,
    };
  }

  let currentIdx = -1;
  for (let i = 0; i < sorted.length; i++) {
    if (highestXP >= sorted[i].requiredXP) {
      currentIdx = i;
    } else {
      break;
    }
  }

  const currentLevel = currentIdx >= 0 ? sorted[currentIdx] : null;
  const nextLevel = currentIdx + 1 < sorted.length ? sorted[currentIdx + 1] : null;
  const isMaxLevel = nextLevel === null && currentLevel !== null;

  const floorXP = currentLevel ? currentLevel.requiredXP : 0;
  const nextLevelXP = nextLevel ? nextLevel.requiredXP : floorXP;

  const bracketNeeded = isMaxLevel ? 1 : Math.max(1, nextLevelXP - floorXP);
  const earned = Math.max(0, categoryXP - floorXP);
  const progressPercent = isMaxLevel
    ? 100
    : Math.min(100, Math.max(0, (earned / bracketNeeded) * 100));

  return {
    currentLevel,
    nextLevel,
    currentLevelIndex: currentIdx,
    totalLevelsCount: sorted.length,
    isMaxLevel,
    floorXP,
    nextLevelXP,
    progressPercent,
  };
};

export const calculateGlobalProgression = (
  globalUXP: number,
  highestUXP: number,
  levels: GlobalLevel[]
): GlobalProgression => {
  const sorted = getSortedGlobalLevels(levels);

  if (sorted.length === 0) {
    return {
      currentLevel: null,
      nextLevel: null,
      currentLevelIndex: -1,
      totalLevelsCount: 0,
      isMaxLevel: true,
      floorUXP: 0,
      nextLevelUXP: 0,
      progressPercent: 0,
    };
  }

  let currentIdx = -1;
  for (let i = 0; i < sorted.length; i++) {
    if (highestUXP >= sorted[i].requiredUXP) {
      currentIdx = i;
    } else {
      break;
    }
  }

  const currentLevel = currentIdx >= 0 ? sorted[currentIdx] : null;
  const nextLevel = currentIdx + 1 < sorted.length ? sorted[currentIdx + 1] : null;
  const isMaxLevel = nextLevel === null && currentLevel !== null;

  const floorUXP = currentLevel ? currentLevel.requiredUXP : 0;
  const nextLevelUXP = nextLevel ? nextLevel.requiredUXP : floorUXP;

  const bracketNeeded = isMaxLevel ? 1 : Math.max(1, nextLevelUXP - floorUXP);
  const earned = Math.max(0, globalUXP - floorUXP);
  const progressPercent = isMaxLevel
    ? 100
    : Math.min(100, Math.max(0, (earned / bracketNeeded) * 100));

  return {
    currentLevel,
    nextLevel,
    currentLevelIndex: currentIdx,
    totalLevelsCount: sorted.length,
    isMaxLevel,
    floorUXP,
    nextLevelUXP,
    progressPercent,
  };
};
