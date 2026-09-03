import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Volume2,
  VolumeX,
  ShieldAlert,
  Coins,
  Layers,
  ShoppingBag,
  Settings,
  History,
  Menu,
  X,
  Crown,
  CloudCheck,
  CloudUpload,
  CloudAlert,
  Award,
  Zap,
  Palette,
} from 'lucide-react';
import { Category, GlobalState, CloudSyncStatus } from '../types';
import { calculateGlobalProgression } from '../utils/progression';
import { DynamicIcon } from './DynamicIcon';
import { TitleBadge } from './TitleBadge';

interface HeaderProps {
  globalState: GlobalState;
  categories: Category[];
  activeTab: 'categories' | 'globalShop' | 'settings' | 'logs';
  onTabChange: (tab: 'categories' | 'globalShop' | 'settings' | 'logs') => void;
  onOpenPenaltyModal: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  cloudSyncStatus: CloudSyncStatus;
  onOpenThemeMockups?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  globalState,
  categories,
  activeTab,
  onTabChange,
  onOpenPenaltyModal,
  soundEnabled,
  onToggleSound,
  cloudSyncStatus,
  onOpenThemeMockups,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const globalProg = calculateGlobalProgression(
    globalState.globalUXP,
    globalState.highestGlobalUXP,
    globalState.globalLevels || []
  );

  const navItems = [
    { id: 'categories', label: 'Категории & Задачи', icon: Layers, shortLabel: 'Задачи' },
    { id: 'globalShop', label: 'Общий UXP Магазин', icon: ShoppingBag, shortLabel: 'Магазин' },
    { id: 'logs', label: 'Журнал событий', icon: History, shortLabel: 'Журнал' },
    { id: 'settings', label: 'Настройки системы', icon: Settings, shortLabel: 'Настройки' },
  ] as const;

  const renderCloudStatus = () => {
    switch (cloudSyncStatus) {
      case 'synced':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[11px] font-mono-code text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <CloudCheck className="w-3.5 h-3.5" />
            <span className="truncate">Supabase: Синхронизировано</span>
          </div>
        );
      case 'saving':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/25 text-[11px] font-mono-code text-sky-400">
            <CloudUpload className="w-3.5 h-3.5 animate-bounce" />
            <span className="truncate">Сохранение в облако...</span>
          </div>
        );
      case 'error':
      case 'offline':
      default:
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-[11px] font-mono-code text-amber-400">
            <CloudAlert className="w-3.5 h-3.5" />
            <span className="truncate">Локальный режим</span>
          </div>
        );
    }
  };

  return (
    <>
      {/* 1. DESKTOP IMMERSIVE SIDEBAR */}
      <aside className="hidden lg:flex w-72 h-screen fixed left-0 top-0 z-30 border-r border-slate-800 bg-[#0F172A] flex-col p-5 justify-between select-none overflow-y-auto">
        <div className="space-y-4">
          {/* User Profile Block */}
          <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80">
            <div className="relative group">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-gamer font-bold shadow-[0_0_15px_rgba(14,165,233,0.35)] border border-sky-400/30 transition-transform group-hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #0284c7 0%, #4338ca 100%)',
                }}
              >
                <DynamicIcon
                  name={globalProg.currentLevel?.icon || 'Crown'}
                  className="h-5 w-5 text-white stroke-[2.5]"
                />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="font-gamer font-bold text-sm tracking-tight text-white truncate">
                LifeRPG Hero
              </h2>
              <div className="mt-1">
                <TitleBadge
                  title={globalProg.currentLevel ? globalProg.currentLevel.name : 'Без звания'}
                  icon={globalProg.currentLevel?.icon || 'Crown'}
                  color={globalProg.currentLevel?.color || '#3b82f6'}
                  effect={globalProg.currentLevel?.effect || 'none'}
                  size="sm"
                />
              </div>
            </div>
          </div>

          {/* Cloud Sync Status */}
          <div className="flex justify-center">{renderCloudStatus()}</div>

          {/* Global UXP Level Progress Card (Shows both current spendable UXP & Title Record UXP) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-sm">
            <div className="flex justify-between items-center text-xs font-mono-code mb-1.5">
              <span className="text-slate-400 font-gamer font-bold uppercase tracking-wider truncate">
                {globalProg.currentLevel ? globalProg.currentLevel.name : 'ГЛОБАЛЬНЫЙ РАНГ'}
              </span>
              <span className="text-sky-400 font-bold">
                {Math.round(globalProg.progressPercent)}%
              </span>
            </div>

            {/* Progress Track */}
            <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
              <motion.div
                className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${globalProg.progressPercent}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>

            <div className="flex justify-between items-center mt-2 text-[10px] font-mono-code text-slate-400">
              <span className="text-sky-300 font-bold" title="Текущий баланс для покупок">
                Баланс: {globalState.globalUXP} UXP
              </span>
              <span className="text-indigo-300 font-bold" title="Максимальный титульный UXP за все время">
                Титул: {globalState.highestGlobalUXP || globalState.globalUXP} UXP
              </span>
            </div>
          </div>

          {/* Currency HUD Badges: Global UXP Spendable Balance & Title Record UXP */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 flex flex-col justify-between">
              <span className="text-[9px] font-gamer text-slate-400 uppercase">Баланс UXP</span>
              <div className="flex items-center gap-1 mt-0.5 text-xs font-mono-code font-bold text-sky-400">
                <Sparkles className="w-3.5 h-3.5 fill-sky-400 shrink-0" />
                <span className="truncate">{globalState.globalUXP.toLocaleString()} UXP</span>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-purple-950/40 rounded-xl p-2.5 flex flex-col justify-between border border-purple-500/20">
              <span className="text-[9px] font-gamer text-purple-300 uppercase flex items-center gap-1">
                <Crown className="w-3 h-3 text-purple-400" />
                <span>Титул UXP</span>
              </span>
              <div className="flex items-center gap-1 mt-0.5 text-xs font-mono-code font-bold text-purple-300">
                <Zap className="w-3.5 h-3.5 shrink-0 text-purple-400" />
                <span className="truncate">{(globalState.highestGlobalUXP || globalState.globalUXP).toLocaleString()} UXP</span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 pt-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-gamer font-bold tracking-wide transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-[0_0_15px_rgba(14,165,233,0.3)]'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="pt-4 border-t border-slate-800 space-y-2">
          {onOpenThemeMockups && (
            <button
              onClick={onOpenThemeMockups}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-purple-500/15 to-indigo-500/15 border border-purple-500/30 text-purple-300 hover:text-white hover:border-purple-400 text-xs font-gamer font-bold cursor-pointer transition-all shadow-sm group"
            >
              <Palette className="w-4 h-4 text-purple-400 group-hover:rotate-12 transition-transform" />
              <span>КОНЦЕПТЫ СТИЛЯ (5)</span>
            </button>
          )}

          <div className="flex items-center justify-between gap-2">
            <button
              onClick={onOpenPenaltyModal}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-xs font-gamer font-bold cursor-pointer transition-colors"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>ШТРАФ</span>
            </button>

            <button
              onClick={onToggleSound}
              className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                soundEnabled
                  ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                  : 'bg-red-500/10 border-red-500/20 text-red-400'
              }`}
              title={soundEnabled ? 'Звук включен' : 'Звук выключен'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </aside>

      {/* 2. MOBILE TOP BAR */}
      <header className="lg:hidden sticky top-0 z-30 bg-[#0F172A]/95 backdrop-blur-xl border-b border-slate-800 px-3.5 py-2.5 shadow-md">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-sm shrink-0">
              <DynamicIcon name={globalProg.currentLevel?.icon || 'Crown'} className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <div className="flex items-center gap-1.5 truncate">
                <span className="font-gamer font-bold text-xs text-white truncate">LifeRPG</span>
                <span className="text-[10px] font-mono-code font-bold text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20 shrink-0">
                  {globalState.globalUXP} UXP
                </span>
              </div>
              <div className="mt-0.5 truncate flex items-center">
                <TitleBadge
                  title={globalProg.currentLevel ? globalProg.currentLevel.name : 'Без звания'}
                  icon={globalProg.currentLevel?.icon || 'Crown'}
                  color={globalProg.currentLevel?.color || '#3b82f6'}
                  effect={globalProg.currentLevel?.effect || 'none'}
                  size="sm"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={onOpenPenaltyModal}
              className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
              title="Штраф"
            >
              <ShieldAlert className="w-4 h-4" />
            </button>
            <button
              onClick={onToggleSound}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
              title="Звук"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-red-400" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu for Detailed Stats & Cloud Status */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden pt-3 mt-2.5 border-t border-slate-800 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-gamer text-slate-400 uppercase">Статус синхронизации:</span>
                {renderCloudStatus()}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-gamer uppercase">Баланс UXP:</span>
                  <span className="font-mono-code font-bold text-sky-400">{globalState.globalUXP.toLocaleString()} UXP</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-purple-950 border-purple-500/30">
                  <span className="text-[10px] text-purple-300 block font-gamer uppercase">Титул UXP (Рекорд):</span>
                  <span className="font-mono-code font-bold text-purple-300">{(globalState.highestGlobalUXP || globalState.globalUXP).toLocaleString()} UXP</span>
                </div>
              </div>

              {onOpenThemeMockups && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenThemeMockups();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/30 text-purple-300 hover:text-white text-xs font-gamer font-bold cursor-pointer"
                >
                  <Palette className="w-4 h-4 text-purple-400" />
                  <span>КОНЦЕПТЫ СТИЛЯ UI (5)</span>
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* 3. MOBILE BOTTOM NAVIGATION BAR (Fixed thumb-friendly for smartphones) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0F172A]/95 backdrop-blur-xl border-t border-slate-800 flex justify-around items-center px-1 py-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all cursor-pointer min-h-[46px] min-w-[56px] ${
                isActive
                  ? 'text-sky-400 font-bold bg-sky-500/10'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
              <span className="text-[10px] font-gamer mt-0.5 tracking-tight">{item.shortLabel}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};

