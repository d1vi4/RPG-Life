import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Layers,
  ShieldAlert,
  Crown,
  ShoppingBag,
  Plus,
  Trash2,
  Edit2,
  Download,
  Upload,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  Globe,
  Filter,
  X,
  Sparkles,
  Flame,
  Award,
  Coins,
  Check,
} from 'lucide-react';
import {
  Category,
  CategoryLevel,
  CategoryShopItem,
  GlobalLevel,
  GlobalShopItem,
  GlobalState,
  Penalty,
  TitleEffect,
} from '../types';
import { DynamicIcon, AVAILABLE_ICONS } from './DynamicIcon';
import { TitleBadge } from './TitleBadge';
import { getSortedCategoryLevels, getSortedGlobalLevels } from '../utils/progression';

interface SettingsPanelProps {
  globalState: GlobalState;
  categories: Category[];
  penalties: Penalty[];
  onUpdateGlobalState: (val: GlobalState | ((prev: GlobalState) => GlobalState)) => void;
  onUpdateCategories: (val: Category[] | ((prev: Category[]) => Category[])) => void;
  onUpdatePenalties: (val: Penalty[] | ((prev: Penalty[]) => Penalty[])) => void;
  onResetAllData: () => void;
  onImportData: (data: any) => void;
  onOpenSyncModal: () => void;
  onShowToast: (type: 'info' | 'success' | 'penalty', title: string, message: string) => void;
}

const COLOR_PRESETS = [
  '#3b82f6', // Blue (default)
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Gold
  '#64748b', // Slate
];

const TITLE_EFFECTS: { id: TitleEffect; name: string; desc: string }[] = [
  { id: 'none', name: 'Обычный', desc: 'Стандартный чистый стиль' },
  { id: 'glow', name: 'Свечение', desc: 'Мягкое ореольное свечение (Glow)' },
  { id: 'neon', name: 'Неон', desc: 'Пульсирующий киберпанк неон (Neon)' },
  { id: 'shimmer', name: 'Мерцание', desc: 'Анимированный золотой перелив (Shimmer)' },
];

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  globalState,
  categories,
  penalties,
  onUpdateGlobalState,
  onUpdateCategories,
  onUpdatePenalties,
  onResetAllData,
  onImportData,
  onOpenSyncModal,
  onShowToast,
}) => {
  const [activeSection, setActiveSection] = useState<
    'categories' | 'globalTitles' | 'globalShop' | 'penalties' | 'backup'
  >('categories');

  const [selectedCatId, setSelectedCatId] = useState<string>(categories[0]?.id || '');
  const activeCategory = categories.find((c) => c.id === selectedCatId) || categories[0];

  // -------------------------------------------------------------
  // MODAL STATES (NO INLINE FORMS!)
  // -------------------------------------------------------------

  // 1. Category Level Modal
  const [isCLevelModalOpen, setIsCLevelModalOpen] = useState(false);
  const [editingCLevelId, setEditingCLevelId] = useState<string | null>(null);
  const [cLevelName, setCLevelName] = useState('');
  const [cLevelXP, setCLevelXP] = useState<number>(1000);
  const [cLevelReward, setCLevelReward] = useState('');
  const [cLevelIcon, setCLevelIcon] = useState('Award');
  const [cLevelColor, setCLevelColor] = useState('#3b82f6');
  const [cLevelEffect, setCLevelEffect] = useState<TitleEffect>('none');

  // 2. Category Shop Item Modal
  const [isCShopModalOpen, setIsCShopModalOpen] = useState(false);
  const [editingCShopId, setEditingCShopId] = useState<string | null>(null);
  const [cShopName, setCShopName] = useState('');
  const [cShopCost, setCShopCost] = useState<number>(500);
  const [cShopDesc, setCShopDesc] = useState('');
  const [cShopIcon, setCShopIcon] = useState('Gift');

  // 3. Global Level Modal
  const [isGLevelModalOpen, setIsGLevelModalOpen] = useState(false);
  const [editingGLevelId, setEditingGLevelId] = useState<string | null>(null);
  const [gLevelName, setGLevelName] = useState('');
  const [gLevelUXP, setGLevelUXP] = useState<number>(50);
  const [gLevelReward, setGLevelReward] = useState('');
  const [gLevelIcon, setGLevelIcon] = useState('Crown');
  const [gLevelColor, setGLevelColor] = useState('#3b82f6');
  const [gLevelEffect, setGLevelEffect] = useState<TitleEffect>('none');

  // 4. Global Shop Item Modal
  const [isGShopModalOpen, setIsGShopModalOpen] = useState(false);
  const [editingGShopId, setEditingGShopId] = useState<string | null>(null);
  const [gShopName, setGShopName] = useState('');
  const [gShopCost, setGShopCost] = useState<number>(100);
  const [gShopDesc, setGShopDesc] = useState('');
  const [gShopIcon, setGShopIcon] = useState('Crown');

  // 5. Penalty Modal
  const [isPenaltyModalOpen, setIsPenaltyModalOpen] = useState(false);
  const [editingPenaltyId, setEditingPenaltyId] = useState<string | null>(null);
  const [penaltyScope, setPenaltyScope] = useState<'category' | 'global'>('category');
  const [penaltyCategoryId, setPenaltyCategoryId] = useState<string>(categories[0]?.id || '');
  const [penaltyName, setPenaltyName] = useState('');
  const [penaltyXP, setPenaltyXP] = useState<number>(200);
  const [penaltyReason, setPenaltyReason] = useState('');

  // Filtering for penalties catalog
  const [penaltyFilter, setPenaltyFilter] = useState<string>('all');

  // Data reset double confirmation
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [resetConfirmStep, setResetConfirmStep] = useState<1 | 2>(1);

  // -------------------------------------------------------------
  // OPEN MODAL HANDLERS
  // -------------------------------------------------------------

  const handleOpenAddCLevel = () => {
    setEditingCLevelId(null);
    setCLevelName('');
    setCLevelXP(1000);
    setCLevelReward('');
    setCLevelIcon('Award');
    setCLevelColor(activeCategory?.color || '#3b82f6');
    setCLevelEffect('none');
    setIsCLevelModalOpen(true);
  };

  const handleOpenEditCLevel = (lvl: CategoryLevel) => {
    setEditingCLevelId(lvl.id);
    setCLevelName(lvl.name);
    setCLevelXP(lvl.requiredXP);
    setCLevelReward(lvl.rewardDescription || '');
    setCLevelIcon(lvl.icon || 'Award');
    setCLevelColor(lvl.color || activeCategory?.color || '#3b82f6');
    setCLevelEffect(lvl.effect || 'none');
    setIsCLevelModalOpen(true);
  };

  const handleOpenAddCShop = () => {
    setEditingCShopId(null);
    setCShopName('');
    setCShopCost(500);
    setCShopDesc('');
    setCShopIcon('Gift');
    setIsCShopModalOpen(true);
  };

  const handleOpenEditCShop = (item: CategoryShopItem) => {
    setEditingCShopId(item.id);
    setCShopName(item.name);
    setCShopCost(item.costXP);
    setCShopDesc(item.description || '');
    setCShopIcon(item.icon || 'Gift');
    setIsCShopModalOpen(true);
  };

  const handleOpenAddGLevel = () => {
    setEditingGLevelId(null);
    setGLevelName('');
    setGLevelUXP(50);
    setGLevelReward('');
    setGLevelIcon('Crown');
    setGLevelColor('#3b82f6');
    setGLevelEffect('none');
    setIsGLevelModalOpen(true);
  };

  const handleOpenEditGLevel = (lvl: GlobalLevel) => {
    setEditingGLevelId(lvl.id);
    setGLevelName(lvl.name);
    setGLevelUXP(lvl.requiredUXP);
    setGLevelReward(lvl.rewardDescription || '');
    setGLevelIcon(lvl.icon || 'Crown');
    setGLevelColor(lvl.color || '#3b82f6');
    setGLevelEffect(lvl.effect || 'none');
    setIsGLevelModalOpen(true);
  };

  const handleOpenAddGShop = () => {
    setEditingGShopId(null);
    setGShopName('');
    setGShopCost(100);
    setGShopDesc('');
    setGShopIcon('Crown');
    setIsGShopModalOpen(true);
  };

  const handleOpenEditGShop = (item: GlobalShopItem) => {
    setEditingGShopId(item.id);
    setGShopName(item.name);
    setGShopCost(item.costUXP);
    setGShopDesc(item.description || '');
    setGShopIcon(item.icon || 'Crown');
    setIsGShopModalOpen(true);
  };

  const handleOpenAddPenalty = () => {
    setEditingPenaltyId(null);
    setPenaltyScope('category');
    setPenaltyCategoryId(categories[0]?.id || '');
    setPenaltyName('');
    setPenaltyXP(200);
    setPenaltyReason('');
    setIsPenaltyModalOpen(true);
  };

  const handleOpenEditPenalty = (p: Penalty) => {
    setEditingPenaltyId(p.id);
    setPenaltyScope(p.scope || 'category');
    setPenaltyCategoryId(p.targetCategoryId || p.categoryId || categories[0]?.id || '');
    setPenaltyName(p.name);
    setPenaltyXP(p.xpDeduction ?? p.amountXP ?? 100);
    setPenaltyReason(p.actionDescription || p.description || '');
    setIsPenaltyModalOpen(true);
  };

  // -------------------------------------------------------------
  // SAVE HANDLERS
  // -------------------------------------------------------------

  const handleSaveCLevel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cLevelName.trim() || !activeCategory) return;

    if (editingCLevelId) {
      onUpdateCategories((prev) =>
        prev.map((c) => {
          if (c.id !== activeCategory.id) return c;
          return {
            ...c,
            levels: (c.levels || []).map((lvl) =>
              lvl.id === editingCLevelId
                ? {
                    ...lvl,
                    name: cLevelName.trim(),
                    requiredXP: Number(cLevelXP),
                    rewardDescription: cLevelReward.trim() || undefined,
                    icon: cLevelIcon,
                    color: cLevelColor,
                    effect: cLevelEffect,
                  }
                : lvl
            ),
          };
        })
      );
      onShowToast('success', 'Звание обновлено', `Звание «${cLevelName}» сохранено`);
    } else {
      const newLvl: CategoryLevel = {
        id: `lvl-${Date.now()}`,
        name: cLevelName.trim(),
        requiredXP: Number(cLevelXP),
        rewardDescription: cLevelReward.trim() || undefined,
        icon: cLevelIcon,
        color: cLevelColor,
        effect: cLevelEffect,
      };
      onUpdateCategories((prev) =>
        prev.map((c) => {
          if (c.id !== activeCategory.id) return c;
          return {
            ...c,
            levels: [...(c.levels || []), newLvl],
          };
        })
      );
      onShowToast('success', 'Звание создано', `Добавлено новое звание «${cLevelName}»`);
    }

    setIsCLevelModalOpen(false);
  };

  const handleDeleteCLevel = (lvlId: string) => {
    if (!activeCategory) return;
    onUpdateCategories((prev) =>
      prev.map((c) => {
        if (c.id !== activeCategory.id) return c;
        return {
          ...c,
          levels: (c.levels || []).filter((l) => l.id !== lvlId),
        };
      })
    );
    onShowToast('info', 'Звание удалено', 'Звание успешно удалено из категории');
  };

  const handleSaveCShop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cShopName.trim() || !activeCategory) return;

    if (editingCShopId) {
      onUpdateCategories((prev) =>
        prev.map((c) => {
          if (c.id !== activeCategory.id) return c;
          return {
            ...c,
            shopItems: (c.shopItems || []).map((item) =>
              item.id === editingCShopId
                ? {
                    ...item,
                    name: cShopName.trim(),
                    costXP: Number(cShopCost),
                    description: cShopDesc.trim() || undefined,
                    icon: cShopIcon,
                  }
                : item
            ),
          };
        })
      );
      onShowToast('success', 'Товар обновлен', `Товар «${cShopName}» успешно изменен`);
    } else {
      const newItem: CategoryShopItem = {
        id: `cshop-${Date.now()}`,
        name: cShopName.trim(),
        costXP: Number(cShopCost),
        description: cShopDesc.trim() || undefined,
        icon: cShopIcon,
      };
      onUpdateCategories((prev) =>
        prev.map((c) => {
          if (c.id !== activeCategory.id) return c;
          return {
            ...c,
            shopItems: [...(c.shopItems || []), newItem],
          };
        })
      );
      onShowToast('success', 'Товар добавлен', `Товар «${cShopName}» добавлен в магазин категории`);
    }

    setIsCShopModalOpen(false);
  };

  const handleDeleteCShop = (itemId: string) => {
    if (!activeCategory) return;
    onUpdateCategories((prev) =>
      prev.map((c) => {
        if (c.id !== activeCategory.id) return c;
        return {
          ...c,
          shopItems: (c.shopItems || []).filter((i) => i.id !== itemId),
        };
      })
    );
    onShowToast('info', 'Товар удален', 'Товар удален из магазина категории');
  };

  const handleSaveGLevel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gLevelName.trim()) return;

    if (editingGLevelId) {
      onUpdateGlobalState((prev) => ({
        ...prev,
        globalLevels: (prev.globalLevels || []).map((lvl) =>
          lvl.id === editingGLevelId
            ? {
                ...lvl,
                name: gLevelName.trim(),
                requiredUXP: Number(gLevelUXP),
                rewardDescription: gLevelReward.trim() || undefined,
                icon: gLevelIcon,
                color: gLevelColor,
                effect: gLevelEffect,
              }
            : lvl
        ),
      }));
      onShowToast('success', 'Титул обновлен', `Глобальный титул «${gLevelName}» сохранен`);
    } else {
      const newLvl: GlobalLevel = {
        id: `glvl-${Date.now()}`,
        name: gLevelName.trim(),
        requiredUXP: Number(gLevelUXP),
        rewardDescription: gLevelReward.trim() || undefined,
        icon: gLevelIcon,
        color: gLevelColor,
        effect: gLevelEffect,
      };
      onUpdateGlobalState((prev) => ({
        ...prev,
        globalLevels: [...(prev.globalLevels || []), newLvl],
      }));
      onShowToast('success', 'Титул создан', `Глобальный титул «${gLevelName}» добавлен`);
    }

    setIsGLevelModalOpen(false);
  };

  const handleDeleteGLevel = (lvlId: string) => {
    onUpdateGlobalState((prev) => ({
      ...prev,
      globalLevels: (prev.globalLevels || []).filter((l) => l.id !== lvlId),
    }));
    onShowToast('info', 'Титул удален', 'Глобальный титул удален');
  };

  const handleSaveGShop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gShopName.trim()) return;

    if (editingGShopId) {
      onUpdateGlobalState((prev) => ({
        ...prev,
        globalShopItems: (prev.globalShopItems || []).map((item) =>
          item.id === editingGShopId
            ? {
                ...item,
                name: gShopName.trim(),
                costUXP: Number(gShopCost),
                description: gShopDesc.trim() || undefined,
                icon: gShopIcon,
              }
            : item
        ),
      }));
      onShowToast('success', 'Товар обновлен', `Глобальный товар «${gShopName}» обновлен`);
    } else {
      const newItem: GlobalShopItem = {
        id: `gshop-${Date.now()}`,
        name: gShopName.trim(),
        costUXP: Number(gShopCost),
        description: gShopDesc.trim() || undefined,
        icon: gShopIcon,
      };
      onUpdateGlobalState((prev) => ({
        ...prev,
        globalShopItems: [...(prev.globalShopItems || []), newItem],
      }));
      onShowToast('success', 'Товар добавлен', `Глобальный товар «${gShopName}» добавлен`);
    }

    setIsGShopModalOpen(false);
  };

  const handleDeleteGShop = (itemId: string) => {
    onUpdateGlobalState((prev) => ({
      ...prev,
      globalShopItems: (prev.globalShopItems || []).filter((i) => i.id !== itemId),
    }));
    onShowToast('info', 'Товар удален', 'Товар удален из глобального магазина');
  };

  const handleSavePenalty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!penaltyName.trim()) return;

    if (editingPenaltyId) {
      onUpdatePenalties((prev) =>
        prev.map((p) =>
          p.id === editingPenaltyId
            ? {
                ...p,
                name: penaltyName.trim(),
                scope: penaltyScope,
                targetCategoryId: penaltyScope === 'category' ? penaltyCategoryId : undefined,
                categoryId: penaltyScope === 'category' ? penaltyCategoryId : undefined,
                xpDeduction: Number(penaltyXP),
                amountXP: Number(penaltyXP),
                actionDescription: penaltyReason.trim() || 'Штраф',
                description: penaltyReason.trim() || undefined,
              }
            : p
        )
      );
      onShowToast('success', 'Штраф обновлен', `Штраф «${penaltyName}» обновлен`);
    } else {
      const newPenalty: Penalty = {
        id: `pen-${Date.now()}`,
        name: penaltyName.trim(),
        scope: penaltyScope,
        targetCategoryId: penaltyScope === 'category' ? penaltyCategoryId : undefined,
        categoryId: penaltyScope === 'category' ? penaltyCategoryId : undefined,
        xpDeduction: Number(penaltyXP),
        amountXP: Number(penaltyXP),
        actionDescription: penaltyReason.trim() || 'Штраф',
        description: penaltyReason.trim() || undefined,
      };
      onUpdatePenalties((prev) => [...prev, newPenalty]);
      onShowToast('success', 'Штраф добавлен', `Штраф «${penaltyName}» добавлен в каталог`);
    }

    setIsPenaltyModalOpen(false);
  };

  const handleDeletePenalty = (penId: string) => {
    onUpdatePenalties((prev) => prev.filter((p) => p.id !== penId));
    onShowToast('info', 'Штраф удален', 'Штраф удален из каталога');
  };

  // Export JSON file
  const handleExportJSON = () => {
    const data = {
      globalState,
      categories,
      penalties,
      exportedAt: new Date().toISOString(),
      version: '2.0.0',
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute(
      'download',
      `LifeRPG_backup_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    onShowToast('success', 'Экспорт завершен', 'Резервная копия сохранена на устройство');
  };

  // Import JSON file
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        onImportData(json);
        onShowToast('success', 'Импорт успешен', 'Все данные восстановлены из файла');
      } catch (err) {
        onShowToast('penalty', 'Ошибка файла', 'Неверный формат JSON резервной копии');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Filtered penalties list
  const filteredPenalties = penalties.filter((p) => {
    if (penaltyFilter === 'all') return true;
    if (penaltyFilter === 'global') return p.scope === 'global';
    return p.scope === 'category' && p.categoryId === penaltyFilter;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-gamer font-bold text-white flex items-center gap-2">
            <span>НАСТРОЙКИ СИСТЕМЫ</span>
            <span className="text-xs font-mono-code bg-sky-500/15 text-sky-400 border border-sky-500/30 px-2.5 py-0.5 rounded-full">
              PRO v2.0
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Управление званиями, магазинами, штрафами, облаком и резервным копированием
          </p>
        </div>

        <button
          onClick={onOpenSyncModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-sky-400 text-sky-400 hover:text-white font-gamer font-bold text-xs cursor-pointer transition-all shadow-md shrink-0"
        >
          <Globe className="w-4 h-4 text-sky-400" />
          <span>ОБЛАЧНАЯ СИНХРОНИЗАЦИЯ</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5 overflow-x-auto">
        <button
          onClick={() => setActiveSection('categories')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-gamer font-bold cursor-pointer transition-all shrink-0 ${
            activeSection === 'categories'
              ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800/80'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>НАПРАВЛЕНИЯ & ЗВАНИЯ</span>
        </button>

        <button
          onClick={() => setActiveSection('globalTitles')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-gamer font-bold cursor-pointer transition-all shrink-0 ${
            activeSection === 'globalTitles'
              ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800/80'
          }`}
        >
          <Crown className="w-4 h-4" />
          <span>ГЛОБАЛЬНЫЕ ТИТУЛЫ (UXP)</span>
        </button>

        <button
          onClick={() => setActiveSection('globalShop')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-gamer font-bold cursor-pointer transition-all shrink-0 ${
            activeSection === 'globalShop'
              ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800/80'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>ГЛОБАЛЬНЫЙ МАГАЗИН (UXP)</span>
        </button>

        <button
          onClick={() => setActiveSection('penalties')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-gamer font-bold cursor-pointer transition-all shrink-0 ${
            activeSection === 'penalties'
              ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800/80'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>КАТАЛОГ ШТРАФОВ</span>
        </button>

        <button
          onClick={() => setActiveSection('backup')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-gamer font-bold cursor-pointer transition-all shrink-0 ${
            activeSection === 'backup'
              ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800/80'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>РЕЗЕРВНОЕ КОПИРОВАНИЕ</span>
        </button>
      </div>

      {/* SECTION 1: CATEGORY TITLES & CATEGORY SHOP */}
      {activeSection === 'categories' && (
        <div className="space-y-6">
          {/* Category Selector Bar */}
          <div className="bg-[#0F172A] p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <label className="text-xs font-gamer font-bold text-slate-300">ВЫБЕРИТЕ НАПРАВЛЕНИЕ:</label>
              <select
                value={selectedCatId}
                onChange={(e) => setSelectedCatId(e.target.value)}
                className="rounded-xl border border-slate-700 bg-[#0B0F19] px-3.5 py-2 text-white font-gamer font-bold text-xs focus:border-sky-400 focus:outline-none"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {activeCategory && (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Цвет направления:</span>
                <span
                  className="w-4 h-4 rounded-full border border-white/20 inline-block"
                  style={{ backgroundColor: activeCategory.color }}
                />
                <span className="font-mono-code font-bold text-white">{activeCategory.name}</span>
              </div>
            )}
          </div>

          {activeCategory && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Category Titles Column */}
              <div className="bg-[#0F172A] p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-sky-400" />
                    <h3 className="font-gamer font-bold text-sm text-white">
                      ЗВАНИЯ КАТЕГОРИИ ({activeCategory.levels?.length || 0})
                    </h3>
                  </div>
                  <button
                    onClick={handleOpenAddCLevel}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-gamer font-bold text-xs cursor-pointer shadow-md transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>ДОБАВИТЬ ЗВАНИЕ</span>
                  </button>
                </div>

                <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                  {getSortedCategoryLevels(activeCategory.levels || []).length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                      В этой категории еще нет настроенных званий. Нажмите «Добавить звание».
                    </div>
                  ) : (
                    getSortedCategoryLevels(activeCategory.levels || []).map((lvl) => (
                      <div
                        key={lvl.id}
                        className="p-3.5 rounded-xl border border-slate-800/80 bg-[#0B0F19] flex items-center justify-between gap-3 hover:border-slate-700 transition-all"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <TitleBadge
                            title={lvl.name}
                            icon={lvl.icon || 'Award'}
                            color={lvl.color || activeCategory.color || '#3b82f6'}
                            effect={lvl.effect || 'none'}
                            size="sm"
                          />
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-mono-code font-bold text-xs text-emerald-400">
                            {lvl.requiredXP.toLocaleString()} XP
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEditCLevel(lvl)}
                              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                              title="Редактировать"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteCLevel(lvl.id)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 cursor-pointer"
                              title="Удалить"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Category Shop Column */}
              <div className="bg-[#0F172A] p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-emerald-400" />
                    <h3 className="font-gamer font-bold text-sm text-white">
                      МАГАЗИН КАТЕГОРИИ ({activeCategory.shopItems?.length || 0})
                    </h3>
                  </div>
                  <button
                    onClick={handleOpenAddCShop}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-gamer font-bold text-xs cursor-pointer shadow-md transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>ДОБАВИТЬ ТОВАР</span>
                  </button>
                </div>

                <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                  {(activeCategory.shopItems || []).length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                      В магазине этой категории еще нет товаров. Нажмите «Добавить товар».
                    </div>
                  ) : (
                    (activeCategory.shopItems || []).map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-xl border border-slate-800/80 bg-[#0B0F19] flex items-center justify-between gap-3 hover:border-slate-700 transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                            <DynamicIcon name={item.icon || 'Gift'} className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-gamer font-bold text-xs text-white truncate">
                              {item.name}
                            </h4>
                            {item.description && (
                              <p className="text-[11px] text-slate-400 truncate max-w-xs">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-mono-code font-bold text-xs text-emerald-400">
                            {item.costXP.toLocaleString()} XP
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEditCShop(item)}
                              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                              title="Редактировать"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteCShop(item.id)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 cursor-pointer"
                              title="Удалить"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: GLOBAL TITLES (UXP) */}
      {activeSection === 'globalTitles' && (
        <div className="bg-[#0F172A] p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-gamer font-bold text-base text-white flex items-center gap-2">
                <Crown className="w-4 h-4 text-sky-400" />
                <span>ГЛОБАЛЬНЫЕ ТИТУЛЫ (UXP)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Отображаются в шапке на всех экранах (включая смартфоны). Награды за общий рекорд UXP.
              </p>
            </div>

            <button
              onClick={handleOpenAddGLevel}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-gamer font-bold text-xs cursor-pointer shadow-md transition-all shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ДОБАВИТЬ ГЛОБАЛЬНЫЙ ТИТУЛ</span>
            </button>
          </div>

          <div className="space-y-3">
            {getSortedGlobalLevels(globalState.globalLevels || []).length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                Глобальные титулы еще не настроены.
              </div>
            ) : (
              getSortedGlobalLevels(globalState.globalLevels || []).map((lvl) => (
                <div
                  key={lvl.id}
                  className="p-4 rounded-xl border border-slate-800/80 bg-[#0B0F19] flex items-center justify-between gap-4 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <TitleBadge
                      title={lvl.name}
                      icon={lvl.icon || 'Crown'}
                      color={lvl.color || '#3b82f6'}
                      effect={lvl.effect || 'none'}
                      size="md"
                    />
                    {lvl.rewardDescription && (
                      <p className="text-xs text-slate-400 truncate hidden sm:block">
                        {lvl.rewardDescription}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <span className="font-mono-code font-bold text-sm text-sky-400 block">
                        {lvl.requiredUXP.toLocaleString()} UXP
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditGLevel(lvl)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                        title="Редактировать"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteGLevel(lvl.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 cursor-pointer"
                        title="Удалить"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SECTION 3: GLOBAL SHOP (UXP) */}
      {activeSection === 'globalShop' && (
        <div className="bg-[#0F172A] p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-gamer font-bold text-base text-white flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-sky-400" />
                <span>ГЛОБАЛЬНЫЙ МАГАЗИН (UXP)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Крупные награды, приобретаемые за общий заработанный капитал UXP.
              </p>
            </div>

            <button
              onClick={handleOpenAddGShop}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-gamer font-bold text-xs cursor-pointer shadow-md transition-all shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ДОБАВИТЬ ТОВАР</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(globalState.globalShopItems || []).length === 0 ? (
              <div className="col-span-full p-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                В глобальном магазине еще нет товаров.
              </div>
            ) : (
              (globalState.globalShopItems || []).map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-slate-800 bg-[#0B0F19] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                        <DynamicIcon name={item.icon || 'Crown'} className="w-5 h-5" />
                      </div>
                      <span className="font-mono-code font-bold text-xs text-sky-300 bg-sky-500/10 px-2.5 py-0.5 rounded-lg border border-sky-500/20">
                        {item.costUXP.toLocaleString()} UXP
                      </span>
                    </div>

                    <h4 className="font-gamer font-bold text-sm text-white mt-3">{item.name}</h4>
                    {item.description && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{item.description}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-1 mt-4 pt-2 border-t border-slate-800/80">
                    <button
                      onClick={() => handleOpenEditGShop(item)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                      title="Редактировать"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteGShop(item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 cursor-pointer"
                      title="Удалить"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SECTION 4: PENALTIES CATALOG */}
      {activeSection === 'penalties' && (
        <div className="bg-[#0F172A] p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-gamer font-bold text-base text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>КАТАЛОГ ШТРАФОВ (XP И UXP САНКЦИИ)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Предустановленные санкции за срывы, вредные привычки или пропуски обязательств.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Category Filter */}
              <select
                value={penaltyFilter}
                onChange={(e) => setPenaltyFilter(e.target.value)}
                className="rounded-xl border border-slate-700 bg-[#0B0F19] px-3 py-2 text-white text-xs font-gamer focus:border-sky-400 focus:outline-none"
              >
                <option value="all">Все штрафы ({penalties.length})</option>
                <option value="global">Только Глобальные (UXP)</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (XP)
                  </option>
                ))}
              </select>

              <button
                onClick={handleOpenAddPenalty}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-gamer font-bold text-xs cursor-pointer shadow-md transition-all shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>ДОБАВИТЬ ШТРАФ</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {filteredPenalties.length === 0 ? (
              <div className="col-span-full p-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                В этой выборке нет штрафов. Нажмите «Добавить штраф».
              </div>
            ) : (
              filteredPenalties.map((pen) => {
                const isGlobal = pen.scope === 'global';
                const cat = categories.find((c) => c.id === pen.categoryId);

                return (
                  <div
                    key={pen.id}
                    className="p-4 rounded-xl border border-rose-500/20 bg-[#0B0F19] flex items-start justify-between gap-3 hover:border-rose-500/40 transition-all"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[9px] font-gamer font-bold px-2 py-0.5 rounded-full ${
                            isGlobal
                              ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {isGlobal ? 'ГЛОБАЛЬНЫЙ (UXP)' : cat ? cat.name : 'КАТЕГОРИЯ'}
                        </span>
                      </div>

                      <h4 className="font-gamer font-bold text-sm text-white mt-1.5">{pen.name}</h4>
                      {pen.description && (
                        <p className="text-xs text-slate-400 mt-1">{pen.description}</p>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="font-mono-code font-bold text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 rounded-lg">
                        -{pen.amountXP} {isGlobal ? 'UXP' : 'XP'}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditPenalty(pen)}
                          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                          title="Редактировать"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletePenalty(pen.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 cursor-pointer"
                          title="Удалить"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* SECTION 5: BACKUP & DANGER ZONE */}
      {activeSection === 'backup' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Export */}
            <div className="bg-[#0F172A] p-5 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 mb-2">
                  <Download className="w-5 h-5" />
                </div>
                <h3 className="font-gamer font-bold text-base text-white">ЭКСПОРТ ДАННЫХ (JSON)</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Скачать полный файл резервной копии всех задач, направлений, наград, штрафов и истории.
                </p>
              </div>

              <button
                onClick={handleExportJSON}
                className="w-full mt-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-sky-400 text-sky-300 hover:text-white font-gamer font-bold text-xs cursor-pointer transition-all flex items-center justify-center gap-2 shadow-md"
              >
                <Download className="w-4 h-4" />
                <span>СКАЧАТЬ JSON БЭКАП</span>
              </button>
            </div>

            {/* Import */}
            <div className="bg-[#0F172A] p-5 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-2">
                  <Upload className="w-5 h-5" />
                </div>
                <h3 className="font-gamer font-bold text-base text-white">ИМПОРТ ДАННЫХ (JSON)</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Восстановить аккаунт из ранее сохраненного JSON-файла.
                </p>
              </div>

              <label className="w-full mt-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-emerald-400 text-emerald-300 hover:text-white font-gamer font-bold text-xs cursor-pointer transition-all flex items-center justify-center gap-2 shadow-md">
                <Upload className="w-4 h-4" />
                <span>ЗАГРУЗИТЬ JSON ФАЙЛ</span>
                <input type="file" accept=".json" onChange={handleFileImport} className="hidden" />
              </label>
            </div>
          </div>

          {/* Danger Zone: Full Factory Reset */}
          <div className="bg-red-950/20 p-5 rounded-2xl border border-red-500/30 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-gamer font-bold text-base text-red-400">ОПАСНАЯ ЗОНА: СБРОС ВСЕХ ДАННЫХ</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Полный сброс приложения до начального заводского состояния.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => {
                  setIsResetConfirmOpen(true);
                  setResetConfirmStep(1);
                }}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-gamer font-bold text-xs shadow-md cursor-pointer transition-colors flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>СБРОСИТЬ ВСЕ ДАННЫЕ ДО НАЧАЛЬНЫХ</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS (POP-UPS WITH BACKDROP BLUR)                                       */}
      {/* ========================================================================= */}

      {/* MODAL 1: CATEGORY LEVEL (TITLE) */}
      <AnimatePresence>
        {isCLevelModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-[#0F172A] border border-slate-700 rounded-2xl p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-gamer font-bold text-base text-white">
                    {editingCLevelId ? 'РЕДАКТИРОВАТЬ ЗВАНИЕ КАТЕГОРИИ' : 'НОВОЕ ЗВАНИЕ КАТЕГОРИИ'}
                  </h3>
                  <p className="text-xs text-slate-400">Направление: {activeCategory?.name}</p>
                </div>
                <button
                  onClick={() => setIsCLevelModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Live Preview */}
              <div className="p-4 rounded-xl bg-[#0B0F19] border border-slate-800 text-center space-y-1.5">
                <span className="text-[10px] font-gamer text-slate-400 block uppercase">
                  Предпросмотр визуализации:
                </span>
                <div className="flex justify-center py-1">
                  <TitleBadge
                    title={cLevelName || 'Пример звания'}
                    icon={cLevelIcon}
                    color={cLevelColor}
                    effect={cLevelEffect}
                    size="md"
                  />
                </div>
              </div>

              <form onSubmit={handleSaveCLevel} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-gamer font-bold mb-1">Название звания *</label>
                  <input
                    type="text"
                    required
                    placeholder="например, Гроссмейстер кода / Мастер спорта"
                    value={cLevelName}
                    onChange={(e) => setCLevelName(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-[#0B0F19] px-3.5 py-2.5 text-white focus:border-sky-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-gamer font-bold mb-1">
                    Требуемый рекорд XP в этой категории *
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={cLevelXP}
                    onChange={(e) => setCLevelXP(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-700 bg-[#0B0F19] px-3.5 py-2 text-emerald-400 font-mono-code font-bold focus:border-sky-400 focus:outline-none"
                  />
                </div>

                {/* Color Selection (HEX + Presets) */}
                <div>
                  <label className="block text-slate-300 font-gamer font-bold mb-1.5">
                    Цвет звания (HEX):
                  </label>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="color"
                      value={cLevelColor}
                      onChange={(e) => setCLevelColor(e.target.value)}
                      className="w-9 h-9 rounded-xl border border-slate-700 bg-transparent cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={cLevelColor}
                      onChange={(e) => setCLevelColor(e.target.value)}
                      className="flex-1 rounded-xl border border-slate-700 bg-[#0B0F19] px-3 py-2 text-white font-mono-code focus:border-sky-400 focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {COLOR_PRESETS.map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setCLevelColor(col)}
                        className={`w-6 h-6 rounded-lg border transition-all cursor-pointer ${
                          cLevelColor === col ? 'ring-2 ring-white scale-110' : 'border-white/20'
                        }`}
                        style={{ backgroundColor: col }}
                      />
                    ))}
                  </div>
                </div>

                {/* Visual Effect Selector */}
                <div>
                  <label className="block text-slate-300 font-gamer font-bold mb-1.5">
                    Визуальный спецэффект:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {TITLE_EFFECTS.map((eff) => (
                      <button
                        key={eff.id}
                        type="button"
                        onClick={() => setCLevelEffect(eff.id)}
                        className={`p-2 rounded-xl border text-left cursor-pointer transition-all ${
                          cLevelEffect === eff.id
                            ? 'border-sky-400 bg-sky-500/20 text-white'
                            : 'border-slate-800 bg-[#0B0F19] text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span className="font-gamer font-bold block">{eff.name}</span>
                        <span className="text-[10px] text-slate-400">{eff.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Icon Selector */}
                <div>
                  <label className="block text-slate-300 font-gamer font-bold mb-1.5">Иконка звания:</label>
                  <div className="flex gap-1.5 flex-wrap max-h-28 overflow-y-auto p-2 bg-[#0B0F19] rounded-xl border border-slate-800">
                    {AVAILABLE_ICONS.map((ic) => (
                      <button
                        key={ic}
                        type="button"
                        onClick={() => setCLevelIcon(ic)}
                        className={`p-2 rounded-lg border cursor-pointer transition-all ${
                          cLevelIcon === ic
                            ? 'border-sky-400 bg-sky-500/20 text-sky-300'
                            : 'border-slate-800 text-slate-400 hover:text-white'
                        }`}
                        title={ic}
                      >
                        <DynamicIcon name={ic} className="w-4 h-4" />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-gamer font-bold mb-1">
                    Описание награды / привилегии (опционально)
                  </label>
                  <input
                    type="text"
                    placeholder="например, +10% к XP в задачах / Доступ к турнирам"
                    value={cLevelReward}
                    onChange={(e) => setCLevelReward(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-[#0B0F19] px-3.5 py-2 text-white focus:border-sky-400 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsCLevelModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 font-gamer cursor-pointer hover:bg-slate-800"
                  >
                    ОТМЕНА
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-gamer font-bold shadow-md cursor-pointer"
                  >
                    СОХРАНИТЬ ЗВАНИЕ
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: CATEGORY SHOP ITEM */}
      <AnimatePresence>
        {isCShopModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#0F172A] border border-slate-700 rounded-2xl p-6 shadow-2xl text-slate-100 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-gamer font-bold text-base text-white">
                    {editingCShopId ? 'РЕДАКТИРОВАТЬ ТОВАР КАТЕГОРИИ' : 'НОВЫЙ ТОВАР КАТЕГОРИИ'}
                  </h3>
                  <p className="text-xs text-slate-400">Направление: {activeCategory?.name}</p>
                </div>
                <button
                  onClick={() => setIsCShopModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveCShop} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-gamer font-bold mb-1">Название товара *</label>
                  <input
                    type="text"
                    required
                    placeholder="например, Читмил / Покупка книги по теме"
                    value={cShopName}
                    onChange={(e) => setCShopName(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-[#0B0F19] px-3.5 py-2 text-white focus:border-sky-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-gamer font-bold mb-1">Стоимость в XP *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={cShopCost}
                    onChange={(e) => setCShopCost(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-700 bg-[#0B0F19] px-3.5 py-2 text-emerald-400 font-mono-code font-bold focus:border-sky-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-gamer font-bold mb-1.5">Иконка товара:</label>
                  <div className="flex gap-1.5 flex-wrap max-h-28 overflow-y-auto p-2 bg-[#0B0F19] rounded-xl border border-slate-800">
                    {AVAILABLE_ICONS.map((ic) => (
                      <button
                        key={ic}
                        type="button"
                        onClick={() => setCShopIcon(ic)}
                        className={`p-2 rounded-lg border cursor-pointer transition-all ${
                          cShopIcon === ic
                            ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300'
                            : 'border-slate-800 text-slate-400 hover:text-white'
                        }`}
                        title={ic}
                      >
                        <DynamicIcon name={ic} className="w-4 h-4" />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-gamer font-bold mb-1">Описание (опционально)</label>
                  <textarea
                    rows={2}
                    placeholder="Подробности или правила использования награды..."
                    value={cShopDesc}
                    onChange={(e) => setCShopDesc(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-[#0B0F19] px-3.5 py-2 text-white focus:border-sky-400 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsCShopModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 font-gamer cursor-pointer hover:bg-slate-800"
                  >
                    ОТМЕНА
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-gamer font-bold shadow-md cursor-pointer"
                  >
                    СОХРАНИТЬ ТОВАР
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: GLOBAL TITLE (UXP) */}
      <AnimatePresence>
        {isGLevelModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-[#0F172A] border border-slate-700 rounded-2xl p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-gamer font-bold text-base text-white">
                    {editingGLevelId ? 'РЕДАКТИРОВАТЬ ГЛОБАЛЬНЫЙ ТИТУЛ' : 'НОВЫЙ ГЛОБАЛЬНЫЙ ТИТУЛ'}
                  </h3>
                  <p className="text-xs text-slate-400">Глобальный ранг аккаунта по UXP</p>
                </div>
                <button
                  onClick={() => setIsGLevelModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Live Preview */}
              <div className="p-4 rounded-xl bg-[#0B0F19] border border-slate-800 text-center space-y-1.5">
                <span className="text-[10px] font-gamer text-slate-400 block uppercase">
                  Отображение в мобильной шапке и профиле:
                </span>
                <div className="flex justify-center py-1">
                  <TitleBadge
                    title={gLevelName || 'Пример титула'}
                    icon={gLevelIcon}
                    color={gLevelColor}
                    effect={gLevelEffect}
                    size="md"
                  />
                </div>
              </div>

              <form onSubmit={handleSaveGLevel} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-gamer font-bold mb-1">Название титула *</label>
                  <input
                    type="text"
                    required
                    placeholder="например, Апостол дисциплины / Архитектор жизни"
                    value={gLevelName}
                    onChange={(e) => setGLevelName(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-[#0B0F19] px-3.5 py-2.5 text-white focus:border-sky-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-gamer font-bold mb-1">
                    Требуемый рекорд UXP *
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={gLevelUXP}
                    onChange={(e) => setGLevelUXP(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-700 bg-[#0B0F19] px-3.5 py-2 text-sky-400 font-mono-code font-bold focus:border-sky-400 focus:outline-none"
                  />
                </div>

                {/* Color Selection */}
                <div>
                  <label className="block text-slate-300 font-gamer font-bold mb-1.5">Цвет титула (HEX):</label>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="color"
                      value={gLevelColor}
                      onChange={(e) => setGLevelColor(e.target.value)}
                      className="w-9 h-9 rounded-xl border border-slate-700 bg-transparent cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={gLevelColor}
                      onChange={(e) => setGLevelColor(e.target.value)}
                      className="flex-1 rounded-xl border border-slate-700 bg-[#0B0F19] px-3 py-2 text-white font-mono-code focus:border-sky-400 focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {COLOR_PRESETS.map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setGLevelColor(col)}
                        className={`w-6 h-6 rounded-lg border transition-all cursor-pointer ${
                          gLevelColor === col ? 'ring-2 ring-white scale-110' : 'border-white/20'
                        }`}
                        style={{ backgroundColor: col }}
                      />
                    ))}
                  </div>
                </div>

                {/* Visual Effect Selector */}
                <div>
                  <label className="block text-slate-300 font-gamer font-bold mb-1.5">
                    Визуальный спецэффект:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {TITLE_EFFECTS.map((eff) => (
                      <button
                        key={eff.id}
                        type="button"
                        onClick={() => setGLevelEffect(eff.id)}
                        className={`p-2 rounded-xl border text-left cursor-pointer transition-all ${
                          gLevelEffect === eff.id
                            ? 'border-sky-400 bg-sky-500/20 text-white'
                            : 'border-slate-800 bg-[#0B0F19] text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span className="font-gamer font-bold block">{eff.name}</span>
                        <span className="text-[10px] text-slate-400">{eff.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Icon Selector */}
                <div>
                  <label className="block text-slate-300 font-gamer font-bold mb-1.5">Иконка титула:</label>
                  <div className="flex gap-1.5 flex-wrap max-h-28 overflow-y-auto p-2 bg-[#0B0F19] rounded-xl border border-slate-800">
                    {AVAILABLE_ICONS.map((ic) => (
                      <button
                        key={ic}
                        type="button"
                        onClick={() => setGLevelIcon(ic)}
                        className={`p-2 rounded-lg border cursor-pointer transition-all ${
                          gLevelIcon === ic
                            ? 'border-sky-400 bg-sky-500/20 text-sky-300'
                            : 'border-slate-800 text-slate-400 hover:text-white'
                        }`}
                        title={ic}
                      >
                        <DynamicIcon name={ic} className="w-4 h-4" />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-gamer font-bold mb-1">
                    Описание награды (опционально)
                  </label>
                  <input
                    type="text"
                    placeholder="например, Высший социальный статус / Премиум значок"
                    value={gLevelReward}
                    onChange={(e) => setGLevelReward(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-[#0B0F19] px-3.5 py-2 text-white focus:border-sky-400 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsGLevelModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 font-gamer cursor-pointer hover:bg-slate-800"
                  >
                    ОТМЕНА
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-gamer font-bold shadow-md cursor-pointer"
                  >
                    СОХРАНИТЬ ТИТУЛ
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 4: GLOBAL SHOP ITEM */}
      <AnimatePresence>
        {isGShopModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#0F172A] border border-slate-700 rounded-2xl p-6 shadow-2xl text-slate-100 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-gamer font-bold text-base text-white">
                    {editingGShopId ? 'РЕДАКТИРОВАТЬ ТОВАР UXP' : 'НОВЫЙ ТОВАР UXP'}
                  </h3>
                  <p className="text-xs text-slate-400">Глобальный магазин наград</p>
                </div>
                <button
                  onClick={() => setIsGShopModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveGShop} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-gamer font-bold mb-1">Название награды *</label>
                  <input
                    type="text"
                    required
                    placeholder="например, Выходной день без будильника"
                    value={gShopName}
                    onChange={(e) => setGShopName(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-[#0B0F19] px-3.5 py-2 text-white focus:border-sky-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-gamer font-bold mb-1">Стоимость в UXP *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={gShopCost}
                    onChange={(e) => setGShopCost(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-700 bg-[#0B0F19] px-3.5 py-2 text-sky-400 font-mono-code font-bold focus:border-sky-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-gamer font-bold mb-1.5">Иконка награды:</label>
                  <div className="flex gap-1.5 flex-wrap max-h-28 overflow-y-auto p-2 bg-[#0B0F19] rounded-xl border border-slate-800">
                    {AVAILABLE_ICONS.map((ic) => (
                      <button
                        key={ic}
                        type="button"
                        onClick={() => setGShopIcon(ic)}
                        className={`p-2 rounded-lg border cursor-pointer transition-all ${
                          gShopIcon === ic
                            ? 'border-sky-400 bg-sky-500/20 text-sky-300'
                            : 'border-slate-800 text-slate-400 hover:text-white'
                        }`}
                        title={ic}
                      >
                        <DynamicIcon name={ic} className="w-4 h-4" />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-gamer font-bold mb-1">Описание (опционально)</label>
                  <textarea
                    rows={2}
                    placeholder="Подробности или правила использования награды..."
                    value={gShopDesc}
                    onChange={(e) => setGShopDesc(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-[#0B0F19] px-3.5 py-2 text-white focus:border-sky-400 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsGShopModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 font-gamer cursor-pointer hover:bg-slate-800"
                  >
                    ОТМЕНА
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-gamer font-bold shadow-md cursor-pointer"
                  >
                    СОХРАНИТЬ НАГРАДУ
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 5: PENALTY */}
      <AnimatePresence>
        {isPenaltyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#0F172A] border border-rose-500/40 rounded-2xl p-6 shadow-2xl text-slate-100 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-400" />
                  <h3 className="font-gamer font-bold text-base text-white">
                    {editingPenaltyId ? 'РЕДАКТИРОВАТЬ ШТРАФ' : 'ДОБАВИТЬ ШТРАФ'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsPenaltyModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSavePenalty} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-gamer font-bold mb-1">Название санкции *</label>
                  <input
                    type="text"
                    required
                    placeholder="например, Пропуск тренировки / Срыв диеты"
                    value={penaltyName}
                    onChange={(e) => setPenaltyName(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-[#0B0F19] px-3.5 py-2 text-white focus:border-sky-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-gamer font-bold mb-1.5">Область действия:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPenaltyScope('category')}
                      className={`p-2 rounded-xl border text-center font-gamer font-bold cursor-pointer transition-all ${
                        penaltyScope === 'category'
                          ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300'
                          : 'border-slate-800 bg-[#0B0F19] text-slate-400'
                      }`}
                    >
                      Категория (XP)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPenaltyScope('global')}
                      className={`p-2 rounded-xl border text-center font-gamer font-bold cursor-pointer transition-all ${
                        penaltyScope === 'global'
                          ? 'border-sky-400 bg-sky-500/20 text-sky-300'
                          : 'border-slate-800 bg-[#0B0F19] text-slate-400'
                      }`}
                    >
                      Глобальный (UXP)
                    </button>
                  </div>
                </div>

                {penaltyScope === 'category' && (
                  <div>
                    <label className="block text-slate-300 font-gamer font-bold mb-1">Привязка к категории:</label>
                    <select
                      value={penaltyCategoryId}
                      onChange={(e) => setPenaltyCategoryId(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-[#0B0F19] px-3.5 py-2 text-white focus:border-sky-400 focus:outline-none"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-slate-300 font-gamer font-bold mb-1">
                    Сумма списания ({penaltyScope === 'category' ? 'XP' : 'UXP'}) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={penaltyXP}
                    onChange={(e) => setPenaltyXP(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-700 bg-[#0B0F19] px-3.5 py-2 text-rose-400 font-mono-code font-bold focus:border-sky-400 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    ℹ️ Списание уменьшает баланс покупок, а также понижает исторический рекорд титула.
                  </p>
                </div>

                <div>
                  <label className="block text-slate-300 font-gamer font-bold mb-1">Причина / Условия (опционально)</label>
                  <textarea
                    rows={2}
                    placeholder="При каких обстоятельствах накладывается данный штраф..."
                    value={penaltyReason}
                    onChange={(e) => setPenaltyReason(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-[#0B0F19] px-3.5 py-2 text-white focus:border-sky-400 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsPenaltyModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 font-gamer cursor-pointer hover:bg-slate-800"
                  >
                    ОТМЕНА
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-gamer font-bold shadow-md cursor-pointer"
                  >
                    СОХРАНИТЬ ШТРАФ
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DOUBLE CONFIRMATION FOR FULL FACTORY RESET */}
      <AnimatePresence>
        {isResetConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#0F172A] border border-red-500/40 rounded-2xl p-6 shadow-[0_0_30px_rgba(239,68,68,0.25)] text-slate-100 relative"
            >
              {resetConfirmStep === 1 ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-gamer font-bold text-base text-white">ШАГ 1 ИЗ 2: СБРОС ДАННЫХ</h3>
                      <p className="text-xs text-slate-400">Требуется подтверждение действия</p>
                    </div>
                  </div>

                  <div className="bg-[#0B0F19] p-3.5 rounded-xl border border-slate-800 space-y-2">
                    <p className="text-xs text-slate-200">
                      Вы действительно хотите стереть все текущие задачи, опыт, товары и вернуть заводские настройки?
                    </p>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Рекомендуется предварительно скачать резервную копию JSON во вкладке «Резервное копирование».
                    </p>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsResetConfirmOpen(false)}
                      className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 font-gamer text-xs cursor-pointer hover:bg-slate-800"
                    >
                      ОТМЕНА
                    </button>
                    <button
                      type="button"
                      onClick={() => setResetConfirmStep(2)}
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
                      <h3 className="font-gamer font-bold text-base text-red-400">ШАГ 2 ИЗ 2: ОКОНЧАТЕЛЬНЫЙ СБРОС</h3>
                      <p className="text-xs text-slate-400">Это действие невозможно отменить!</p>
                    </div>
                  </div>

                  <div className="bg-red-500/10 p-3.5 rounded-xl border border-red-500/30 text-xs text-red-200 leading-relaxed">
                    Все ваши данные в браузере и Supabase будут сброшены к начальным шаблонам.
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsResetConfirmOpen(false);
                        setResetConfirmStep(1);
                      }}
                      className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 font-gamer text-xs cursor-pointer hover:bg-slate-800"
                    >
                      ОТМЕНА
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsResetConfirmOpen(false);
                        onResetAllData();
                      }}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-gamer font-bold text-xs shadow-[0_0_15px_rgba(239,68,68,0.4)] cursor-pointer transition-all flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>ДА, СБРОСИТЬ ВСЕ</span>
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
