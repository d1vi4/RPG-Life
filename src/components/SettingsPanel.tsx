import React, { useState } from 'react';
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
  Smartphone,
} from 'lucide-react';
import {
  Category,
  CategoryLevel,
  CategoryShopItem,
  GlobalLevel,
  GlobalShopItem,
  GlobalState,
  Penalty,
} from '../types';
import { DynamicIcon } from './DynamicIcon';
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

  const [selectedCatId, setSelectedCatId] = useState<string>(
    categories[0]?.id || ''
  );

  const activeCategory = categories.find((c) => c.id === selectedCatId) || categories[0];

  // 1. Global Level Form State
  const [gLevelName, setGLevelName] = useState('');
  const [gLevelUXP, setGLevelUXP] = useState<number>(50);
  const [gLevelReward, setGLevelReward] = useState('');
  const [gLevelIcon, setGLevelIcon] = useState('Crown');
  const [editingGLevelId, setEditingGLevelId] = useState<string | null>(null);

  // 2. Global Shop Form State
  const [gShopName, setGShopName] = useState('');
  const [gShopCost, setGShopCost] = useState<number>(100);
  const [gShopDesc, setGShopDesc] = useState('');
  const [gShopIcon, setGShopIcon] = useState('Crown');
  const [editingGShopId, setEditingGShopId] = useState<string | null>(null);

  // 3. Category Level Form State
  const [cLevelName, setCLevelName] = useState('');
  const [cLevelXP, setCLevelXP] = useState<number>(1000);
  const [cLevelReward, setCLevelReward] = useState('');
  const [cLevelIcon, setCLevelIcon] = useState('Award');
  const [editingCLevelId, setEditingCLevelId] = useState<string | null>(null);

  // 4. Category Shop Item Form State
  const [cShopName, setCShopName] = useState('');
  const [cShopCost, setCShopCost] = useState<number>(500);
  const [cShopDesc, setCShopDesc] = useState('');
  const [cShopIcon, setCShopIcon] = useState('Gift');
  const [editingCShopId, setEditingCShopId] = useState<string | null>(null);

  // 5. Penalty Form State
  const [penaltyName, setPenaltyName] = useState('');
  const [penaltyXP, setPenaltyXP] = useState<number>(200);
  const [penaltyDesc, setPenaltyDesc] = useState('');
  const [editingPenaltyId, setEditingPenaltyId] = useState<string | null>(null);

  // --- Handlers: Category Level Save ---
  const handleSaveCategoryLevel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cLevelName.trim() || !activeCategory) return;

    const existingLevels = activeCategory.levels || [];
    let updatedLevels: CategoryLevel[];

    if (editingCLevelId) {
      updatedLevels = existingLevels.map((l) =>
        l.id === editingCLevelId
          ? {
              ...l,
              name: cLevelName.trim(),
              requiredXP: Number(cLevelXP),
              rewardDescription: cLevelReward.trim() || undefined,
              icon: cLevelIcon,
            }
          : l
      );
    } else {
      const newLvl: CategoryLevel = {
        id: `clevel-${Date.now()}`,
        name: cLevelName.trim(),
        requiredXP: Number(cLevelXP),
        rewardDescription: cLevelReward.trim() || undefined,
        icon: cLevelIcon,
      };
      updatedLevels = [...existingLevels, newLvl];
    }

    const sorted = getSortedCategoryLevels(updatedLevels);
    onUpdateCategories((prev) =>
      prev.map((c) => (c.id === activeCategory.id ? { ...c, levels: sorted } : c))
    );

    setCLevelName('');
    setCLevelReward('');
    setCLevelXP(1000);
    setEditingCLevelId(null);
    onShowToast('success', 'Звание сохранено', `Звание для «${activeCategory.name}» обновлено.`);
  };

  const handleDeleteCategoryLevel = (lvlId: string) => {
    if (!activeCategory) return;
    onUpdateCategories((prev) =>
      prev.map((c) =>
        c.id === activeCategory.id
          ? { ...c, levels: (c.levels || []).filter((l) => l.id !== lvlId) }
          : c
      )
    );
  };

  // --- Handlers: Category Shop Save ---
  const handleSaveCategoryShopItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cShopName.trim() || !activeCategory) return;

    const existingItems = activeCategory.shopItems || [];
    let updatedItems: CategoryShopItem[];

    if (editingCShopId) {
      updatedItems = existingItems.map((item) =>
        item.id === editingCShopId
          ? {
              ...item,
              name: cShopName.trim(),
              costXP: Number(cShopCost),
              description: cShopDesc.trim() || undefined,
              icon: cShopIcon,
            }
          : item
      );
    } else {
      const newItem: CategoryShopItem = {
        id: `cshop-${Date.now()}`,
        name: cShopName.trim(),
        costXP: Number(cShopCost),
        description: cShopDesc.trim() || undefined,
        icon: cShopIcon,
      };
      updatedItems = [...existingItems, newItem];
    }

    onUpdateCategories((prev) =>
      prev.map((c) => (c.id === activeCategory.id ? { ...c, shopItems: updatedItems } : c))
    );

    setCShopName('');
    setCShopDesc('');
    setCShopCost(500);
    setEditingCShopId(null);
    onShowToast('success', 'Товар сохранен', `Товар в магазин «${activeCategory.name}» добавлен.`);
  };

  const handleDeleteCategoryShopItem = (itemId: string) => {
    if (!activeCategory) return;
    onUpdateCategories((prev) =>
      prev.map((c) =>
        c.id === activeCategory.id
          ? { ...c, shopItems: (c.shopItems || []).filter((i) => i.id !== itemId) }
          : c
      )
    );
  };

  // --- Handlers: Global Level Save ---
  const handleSaveGlobalLevel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gLevelName.trim()) return;

    const existing = globalState.globalLevels || [];
    let updated: GlobalLevel[];

    if (editingGLevelId) {
      updated = existing.map((l) =>
        l.id === editingGLevelId
          ? {
              ...l,
              name: gLevelName.trim(),
              requiredUXP: Number(gLevelUXP),
              rewardDescription: gLevelReward.trim() || undefined,
              icon: gLevelIcon,
            }
          : l
      );
    } else {
      const newLvl: GlobalLevel = {
        id: `glevel-${Date.now()}`,
        name: gLevelName.trim(),
        requiredUXP: Number(gLevelUXP),
        rewardDescription: gLevelReward.trim() || undefined,
        icon: gLevelIcon,
      };
      updated = [...existing, newLvl];
    }

    const sorted = getSortedGlobalLevels(updated);
    onUpdateGlobalState((prev) => ({ ...prev, globalLevels: sorted }));

    setGLevelName('');
    setGLevelReward('');
    setGLevelUXP(50);
    setEditingGLevelId(null);
    onShowToast('success', 'Общее звание сохранено', 'Каталог общих званий за UXP обновлен.');
  };

  const handleDeleteGlobalLevel = (lvlId: string) => {
    onUpdateGlobalState((prev) => ({
      ...prev,
      globalLevels: (prev.globalLevels || []).filter((l) => l.id !== lvlId),
    }));
  };

  // --- Handlers: Global Shop Save ---
  const handleSaveGlobalShopItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gShopName.trim()) return;

    const existing = globalState.globalShop || [];
    let updated: GlobalShopItem[];

    if (editingGShopId) {
      updated = existing.map((i) =>
        i.id === editingGShopId
          ? {
              ...i,
              name: gShopName.trim(),
              costUXP: Number(gShopCost),
              description: gShopDesc.trim() || undefined,
              icon: gShopIcon,
            }
          : i
      );
    } else {
      const newItem: GlobalShopItem = {
        id: `gshop-${Date.now()}`,
        name: gShopName.trim(),
        costUXP: Number(gShopCost),
        description: gShopDesc.trim() || undefined,
        icon: gShopIcon,
      };
      updated = [...existing, newItem];
    }

    onUpdateGlobalState((prev) => ({ ...prev, globalShop: updated }));

    setGShopName('');
    setGShopDesc('');
    setGShopCost(100);
    setEditingGShopId(null);
    onShowToast('success', 'Товар UXP сохранен', 'Общий каталог товаров за UXP обновлен.');
  };

  const handleDeleteGlobalShopItem = (itemId: string) => {
    onUpdateGlobalState((prev) => ({
      ...prev,
      globalShop: (prev.globalShop || []).filter((i) => i.id !== itemId),
    }));
  };

  // --- Handlers: Penalty Save ---
  const handleSavePenalty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!penaltyName.trim()) return;

    let updated: Penalty[];

    if (editingPenaltyId) {
      updated = penalties.map((p) =>
        p.id === editingPenaltyId
          ? {
              ...p,
              name: penaltyName.trim(),
              xpDeduction: Number(penaltyXP),
              actionDescription: penaltyDesc.trim(),
            }
          : p
      );
    } else {
      const newPenalty: Penalty = {
        id: `pen-${Date.now()}`,
        name: penaltyName.trim(),
        xpDeduction: Number(penaltyXP),
        actionDescription: penaltyDesc.trim(),
      };
      updated = [...penalties, newPenalty];
    }

    onUpdatePenalties(updated);

    setPenaltyName('');
    setPenaltyDesc('');
    setPenaltyXP(200);
    setEditingPenaltyId(null);
    onShowToast('success', 'Штраф сохранен', 'Список дисциплинарных штрафов обновлен.');
  };

  const handleDeletePenalty = (penId: string) => {
    onUpdatePenalties(penalties.filter((p) => p.id !== penId));
  };

  // Export JSON
  const handleExportJSON = () => {
    const data = {
      globalState,
      categories,
      penalties,
      exportedAt: new Date().toISOString(),
      version: '3.0-clean',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `liferpg-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onShowToast('success', 'Экспорт завершен', 'Файл сохранения успешно скачан.');
  };

  // Import JSON
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        onImportData(parsed);
      } catch (err) {
        onShowToast('penalty', 'Ошибка импорта', 'Неверный формат JSON файла.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0F172A] p-5 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-2xl font-extrabold font-gamer tracking-wide text-white">
            НАСТРОЙКИ СИСТЕМЫ LIFERPG
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Управление званиями категорий, магазинами XP/UXP, штрафами и резервным копированием
          </p>
        </div>

        <button
          onClick={onOpenSyncModal}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500/20 border border-sky-500/30 text-sky-300 hover:bg-sky-500/30 text-xs font-gamer font-bold cursor-pointer transition-all shrink-0"
        >
          <Smartphone className="w-4 h-4" />
          <span>СИНХРОНИЗАЦИЯ С ТЕЛЕФОНОМ</span>
        </button>
      </div>

      {/* Nav Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
        <button
          onClick={() => setActiveSection('categories')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-gamer font-bold cursor-pointer shrink-0 transition-all ${
            activeSection === 'categories'
              ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>ЗВАНИЯ И МАГАЗИН КАТЕГОРИИ (XP)</span>
        </button>

        <button
          onClick={() => setActiveSection('globalTitles')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-gamer font-bold cursor-pointer shrink-0 transition-all ${
            activeSection === 'globalTitles'
              ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Crown className="w-3.5 h-3.5" />
          <span>ОБЩИЕ ЗВАНИЯ (UXP)</span>
        </button>

        <button
          onClick={() => setActiveSection('globalShop')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-gamer font-bold cursor-pointer shrink-0 transition-all ${
            activeSection === 'globalShop'
              ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>ОБЩИЙ МАГАЗИН (UXP)</span>
        </button>

        <button
          onClick={() => setActiveSection('penalties')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-gamer font-bold cursor-pointer shrink-0 transition-all ${
            activeSection === 'penalties'
              ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>ШТРАФЫ</span>
        </button>

        <button
          onClick={() => setActiveSection('backup')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-gamer font-bold cursor-pointer shrink-0 transition-all ${
            activeSection === 'backup'
              ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>РЕЗЕРВНОЕ КОПИРОВАНИЕ</span>
        </button>
      </div>

      {/* 1. CATEGORIES CONFIGURATION (LEVELS & SHOP PER CATEGORY) */}
      {activeSection === 'categories' && (
        <div className="space-y-6">
          {categories.length === 0 ? (
            <div className="p-8 text-center bg-[#0F172A] rounded-2xl border border-dashed border-slate-800 text-slate-400">
              <p className="font-gamer font-bold text-sm text-slate-300">Категории пока не созданы</p>
              <p className="text-xs text-slate-500 mt-1">
                Перейдите во вкладку «Категории & Календарь» и создайте ваше первое направление.
              </p>
            </div>
          ) : (
            <>
              {/* Category Selector Pill Row */}
              <div className="bg-[#0F172A] p-4 rounded-xl border border-slate-800">
                <label className="block text-xs font-gamer font-bold text-slate-400 mb-2 uppercase">
                  Выберите категорию для настройки её званий и магазина:
                </label>
                <div className="flex items-center gap-2 overflow-x-auto">
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCatId(c.id)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-gamer font-bold border transition-all cursor-pointer ${
                        activeCategory?.id === c.id
                          ? 'border-sky-400 bg-sky-500/20 text-sky-300'
                          : 'border-slate-800 bg-[#0B0F19] text-slate-400 hover:text-white'
                      }`}
                    >
                      <DynamicIcon name={c.icon} className="w-4 h-4" />
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {activeCategory && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left: Category Levels */}
                  <div className="bg-[#0F172A] p-5 rounded-2xl border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <h3 className="font-gamer font-bold text-base text-white">
                          ЗВАНИЯ В КАТЕГОРИИ: {activeCategory.name}
                        </h3>
                        <p className="text-xs text-slate-400">
                          Иерархия рангов за XP в этом направлении
                        </p>
                      </div>
                      <span className="text-xs font-mono-code font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-lg border border-sky-500/20">
                        {(activeCategory.levels || []).length} званий
                      </span>
                    </div>

                    {/* Level Form */}
                    <form onSubmit={handleSaveCategoryLevel} className="space-y-3 text-xs bg-[#0B0F19] p-3.5 rounded-xl border border-slate-800">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-300 font-gamer font-bold mb-1">Название звания *</label>
                          <input
                            type="text"
                            required
                            placeholder="например, Junior, Master, Legend"
                            value={cLevelName}
                            onChange={(e) => setCLevelName(e.target.value)}
                            className="w-full rounded-lg border border-slate-800 bg-[#0F172A] px-3 py-1.5 text-white focus:border-sky-400 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-300 font-gamer font-bold mb-1">Порог XP (в категории) *</label>
                          <input
                            type="number"
                            min={0}
                            required
                            value={cLevelXP}
                            onChange={(e) => setCLevelXP(Number(e.target.value))}
                            className="w-full rounded-lg border border-slate-800 bg-[#0F172A] px-3 py-1.5 text-sky-400 font-mono-code font-bold focus:border-sky-400 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-300 font-gamer font-bold mb-1">Награда / Описание ранга</label>
                        <input
                          type="text"
                          placeholder="например, Доступ к олимпиадным контестам"
                          value={cLevelReward}
                          onChange={(e) => setCLevelReward(e.target.value)}
                          className="w-full rounded-lg border border-slate-800 bg-[#0F172A] px-3 py-1.5 text-white focus:border-sky-400 focus:outline-none"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        {editingCLevelId && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCLevelId(null);
                              setCLevelName('');
                              setCLevelReward('');
                              setCLevelXP(1000);
                            }}
                            className="px-3 py-1.5 rounded-lg border border-slate-800 text-slate-400 font-gamer text-xs"
                          >
                            ОТМЕНА
                          </button>
                        )}
                        <button
                          type="submit"
                          className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-gamer font-bold text-xs cursor-pointer shadow-sm"
                        >
                          {editingCLevelId ? 'ОБНОВИТЬ ЗВАНИЕ' : 'ДОБАВИТЬ ЗВАНИЕ'}
                        </button>
                      </div>
                    </form>

                    {/* Level List */}
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {(activeCategory.levels || []).map((lvl) => (
                        <div
                          key={lvl.id}
                          className="p-3 rounded-xl border border-slate-800 bg-[#0B0F19] flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-gamer font-bold text-white text-sm">{lvl.name}</span>
                              <span className="font-mono-code text-sky-400 font-bold">
                                {lvl.requiredXP.toLocaleString()} XP
                              </span>
                            </div>
                            {lvl.rewardDescription && (
                              <p className="text-slate-400 text-[11px] mt-0.5">{lvl.rewardDescription}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setEditingCLevelId(lvl.id);
                                setCLevelName(lvl.name);
                                setCLevelXP(lvl.requiredXP);
                                setCLevelReward(lvl.rewardDescription || '');
                                setCLevelIcon(lvl.icon || 'Award');
                              }}
                              className="p-1 rounded text-slate-400 hover:text-white"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategoryLevel(lvl.id)}
                              className="p-1 rounded text-slate-400 hover:text-red-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right: Category Shop Items */}
                  <div className="bg-[#0F172A] p-5 rounded-2xl border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <h3 className="font-gamer font-bold text-base text-white">
                          МАГАЗИН КАТЕГОРИИ: {activeCategory.name}
                        </h3>
                        <p className="text-xs text-slate-400">
                          Товары за XP в этом направлении
                        </p>
                      </div>
                      <span className="text-xs font-mono-code font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-lg border border-sky-500/20">
                        {(activeCategory.shopItems || []).length} товаров
                      </span>
                    </div>

                    {/* Shop Item Form */}
                    <form onSubmit={handleSaveCategoryShopItem} className="space-y-3 text-xs bg-[#0B0F19] p-3.5 rounded-xl border border-slate-800">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-300 font-gamer font-bold mb-1">Название награды *</label>
                          <input
                            type="text"
                            required
                            placeholder="например, 1 час отдыха, пицца"
                            value={cShopName}
                            onChange={(e) => setCShopName(e.target.value)}
                            className="w-full rounded-lg border border-slate-800 bg-[#0F172A] px-3 py-1.5 text-white focus:border-sky-400 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-300 font-gamer font-bold mb-1">Стоимость XP *</label>
                          <input
                            type="number"
                            min={1}
                            required
                            value={cShopCost}
                            onChange={(e) => setCShopCost(Number(e.target.value))}
                            className="w-full rounded-lg border border-slate-800 bg-[#0F172A] px-3 py-1.5 text-sky-400 font-mono-code font-bold focus:border-sky-400 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-300 font-gamer font-bold mb-1">Описание</label>
                        <input
                          type="text"
                          placeholder="Условия или приятные детали..."
                          value={cShopDesc}
                          onChange={(e) => setCShopDesc(e.target.value)}
                          className="w-full rounded-lg border border-slate-800 bg-[#0F172A] px-3 py-1.5 text-white focus:border-sky-400 focus:outline-none"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        {editingCShopId && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCShopId(null);
                              setCShopName('');
                              setCShopDesc('');
                              setCShopCost(500);
                            }}
                            className="px-3 py-1.5 rounded-lg border border-slate-800 text-slate-400 font-gamer text-xs"
                          >
                            ОТМЕНА
                          </button>
                        )}
                        <button
                          type="submit"
                          className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-gamer font-bold text-xs cursor-pointer shadow-sm"
                        >
                          {editingCShopId ? 'ОБНОВИТЬ ТОВАР' : 'ДОБАВИТЬ ТОВАР'}
                        </button>
                      </div>
                    </form>

                    {/* Shop Item List */}
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {(activeCategory.shopItems || []).map((item) => (
                        <div
                          key={item.id}
                          className="p-3 rounded-xl border border-slate-800 bg-[#0B0F19] flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-gamer font-bold text-white text-sm">{item.name}</span>
                              <span className="font-mono-code text-sky-400 font-bold">
                                {item.costXP.toLocaleString()} XP
                              </span>
                            </div>
                            {item.description && (
                              <p className="text-slate-400 text-[11px] mt-0.5">{item.description}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setEditingCShopId(item.id);
                                setCShopName(item.name);
                                setCShopCost(item.costXP);
                                setCShopDesc(item.description || '');
                                setCShopIcon(item.icon || 'Gift');
                              }}
                              className="p-1 rounded text-slate-400 hover:text-white"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategoryShopItem(item.id)}
                              className="p-1 rounded text-slate-400 hover:text-red-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* 2. GLOBAL LEVEL TITLES (UXP) */}
      {activeSection === 'globalTitles' && (
        <div className="bg-[#0F172A] p-6 rounded-2xl border border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-gamer font-bold text-lg text-white">
                ОБЩИЕ ЗВАНИЯ ЗА ОПЫТ (UXP)
              </h3>
              <p className="text-xs text-slate-400">
                Глобальная иерархия титулов за Ultra UXP. Звания несгораемы и отображаются в шапке.
              </p>
            </div>
            <span className="text-xs font-mono-code font-bold text-sky-300 bg-sky-500/10 px-2.5 py-1 rounded-xl border border-sky-500/20">
              {(globalState.globalLevels || []).length} общих званий
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSaveGlobalLevel} className="space-y-4 text-xs bg-[#0B0F19] p-4 rounded-xl border border-slate-800">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-gamer font-bold mb-1">Название общего звания *</label>
                <input
                  type="text"
                  required
                  placeholder="например, Grand Champion, Mythic"
                  value={gLevelName}
                  onChange={(e) => setGLevelName(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-[#0F172A] px-3.5 py-2 text-white focus:border-sky-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-gamer font-bold mb-1">Порог UXP *</label>
                <input
                  type="number"
                  min={0}
                  required
                  value={gLevelUXP}
                  onChange={(e) => setGLevelUXP(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-800 bg-[#0F172A] px-3.5 py-2 text-sky-300 font-mono-code font-bold focus:border-sky-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-gamer font-bold mb-1">Награда / Описание</label>
              <input
                type="text"
                placeholder="Привилегия или статус..."
                value={gLevelReward}
                onChange={(e) => setGLevelReward(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-[#0F172A] px-3.5 py-2 text-white focus:border-sky-400 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              {editingGLevelId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingGLevelId(null);
                    setGLevelName('');
                    setGLevelReward('');
                    setGLevelUXP(50);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-800 text-slate-400 font-gamer text-xs cursor-pointer"
                >
                  ОТМЕНА
                </button>
              )}
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-gamer font-bold text-xs cursor-pointer shadow-md"
              >
                {editingGLevelId ? 'ОБНОВИТЬ ОБЩЕЕ ЗВАНИЕ' : 'ДОБАВИТЬ ОБЩЕЕ ЗВАНИЕ'}
              </button>
            </div>
          </form>

          {/* List */}
          <div className="space-y-3">
            {(globalState.globalLevels || []).map((lvl) => (
              <div
                key={lvl.id}
                className="p-4 rounded-xl border border-slate-800 bg-[#0B0F19] flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-300">
                    <DynamicIcon name={lvl.icon || 'Crown'} className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-gamer font-bold text-white text-base">{lvl.name}</span>
                      <span className="font-mono-code text-sky-300 font-bold text-xs bg-sky-500/10 px-2 py-0.5 rounded-md border border-sky-500/20">
                        {lvl.requiredUXP} UXP
                      </span>
                    </div>
                    {lvl.rewardDescription && (
                      <p className="text-slate-400 text-xs mt-0.5">{lvl.rewardDescription}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingGLevelId(lvl.id);
                      setGLevelName(lvl.name);
                      setGLevelUXP(lvl.requiredUXP);
                      setGLevelReward(lvl.rewardDescription || '');
                      setGLevelIcon(lvl.icon || 'Crown');
                    }}
                    className="p-2 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteGlobalLevel(lvl.id)}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-400 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. GLOBAL SHOP ITEMS (UXP) */}
      {activeSection === 'globalShop' && (
        <div className="bg-[#0F172A] p-6 rounded-2xl border border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-gamer font-bold text-lg text-white">
                ТОВАРЫ ОБЩЕГО МАГАЗИНА (UXP)
              </h3>
              <p className="text-xs text-slate-400">
                Товары и артефакты, приобретаемые за Ultra UXP
              </p>
            </div>
            <span className="text-xs font-mono-code font-bold text-sky-300 bg-sky-500/10 px-2.5 py-1 rounded-xl border border-sky-500/20">
              {(globalState.globalShop || []).length} товаров UXP
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSaveGlobalShopItem} className="space-y-4 text-xs bg-[#0B0F19] p-4 rounded-xl border border-slate-800">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-gamer font-bold mb-1">Название товара *</label>
                <input
                  type="text"
                  required
                  placeholder="например, Наушники, Путешествие, Книга"
                  value={gShopName}
                  onChange={(e) => setGShopName(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-[#0F172A] px-3.5 py-2 text-white focus:border-sky-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-gamer font-bold mb-1">Стоимость UXP *</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={gShopCost}
                  onChange={(e) => setGShopCost(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-800 bg-[#0F172A] px-3.5 py-2 text-sky-300 font-mono-code font-bold focus:border-sky-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-gamer font-bold mb-1">Описание</label>
              <input
                type="text"
                placeholder="Подробности награды..."
                value={gShopDesc}
                onChange={(e) => setGShopDesc(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-[#0F172A] px-3.5 py-2 text-white focus:border-sky-400 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              {editingGShopId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingGShopId(null);
                    setGShopName('');
                    setGShopDesc('');
                    setGShopCost(100);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-800 text-slate-400 font-gamer text-xs cursor-pointer"
                >
                  ОТМЕНА
                </button>
              )}
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-gamer font-bold text-xs cursor-pointer shadow-md"
              >
                {editingGShopId ? 'ОБНОВИТЬ ТОВАР UXP' : 'ДОБАВИТЬ ТОВАР UXP'}
              </button>
            </div>
          </form>

          {/* List */}
          <div className="space-y-3">
            {(globalState.globalShop || []).map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-slate-800 bg-[#0B0F19] flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-300">
                    <DynamicIcon name={item.icon || 'Crown'} className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-gamer font-bold text-white text-base">{item.name}</span>
                      <span className="font-mono-code text-sky-300 font-bold text-xs bg-sky-500/10 px-2 py-0.5 rounded-md border border-sky-500/20">
                        {item.costUXP} UXP
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-slate-400 text-xs mt-0.5">{item.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingGShopId(item.id);
                      setGShopName(item.name);
                      setGShopCost(item.costUXP);
                      setGShopDesc(item.description || '');
                      setGShopIcon(item.icon || 'Crown');
                    }}
                    className="p-2 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteGlobalShopItem(item.id)}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-400 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. PENALTIES */}
      {activeSection === 'penalties' && (
        <div className="bg-[#0F172A] p-6 rounded-2xl border border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-gamer font-bold text-lg text-white">
                ДИСЦИПЛИНАРНЫЕ ШТРАФЫ
              </h3>
              <p className="text-xs text-slate-400">
                Списывают очки XP с выбранной категории при нарушении дисциплины.
              </p>
            </div>
            <span className="text-xs font-mono-code font-bold text-red-400 bg-red-500/10 px-2.5 py-1 rounded-xl border border-red-500/20">
              {penalties.length} штрафов
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSavePenalty} className="space-y-4 text-xs bg-[#0B0F19] p-4 rounded-xl border border-slate-800">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-gamer font-bold mb-1">Название нарушения *</label>
                <input
                  type="text"
                  required
                  placeholder="например, Пропуск тренировки без причины"
                  value={penaltyName}
                  onChange={(e) => setPenaltyName(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-[#0F172A] px-3.5 py-2 text-white focus:border-red-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-gamer font-bold mb-1">Списание XP *</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={penaltyXP}
                  onChange={(e) => setPenaltyXP(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-800 bg-[#0F172A] px-3.5 py-2 text-red-400 font-mono-code font-bold focus:border-red-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-gamer font-bold mb-1">Дисциплинарное последствие</label>
              <input
                type="text"
                placeholder="например, Сделать 50 приседаний или решить дополнительную задачу"
                value={penaltyDesc}
                onChange={(e) => setPenaltyDesc(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-[#0F172A] px-3.5 py-2 text-white focus:border-red-400 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              {editingPenaltyId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingPenaltyId(null);
                    setPenaltyName('');
                    setPenaltyDesc('');
                    setPenaltyXP(200);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-800 text-slate-400 font-gamer text-xs cursor-pointer"
                >
                  ОТМЕНА
                </button>
              )}
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white font-gamer font-bold text-xs cursor-pointer shadow-md"
              >
                {editingPenaltyId ? 'ОБНОВИТЬ ШТРАФ' : 'ДОБАВИТЬ ШТРАФ'}
              </button>
            </div>
          </form>

          {/* List */}
          <div className="space-y-3">
            {penalties.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-xl border border-slate-800 bg-[#0B0F19] flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-gamer font-bold text-white text-base">{p.name}</span>
                    <span className="font-mono-code text-red-400 font-bold text-xs bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20">
                      -{p.xpDeduction} XP
                    </span>
                  </div>
                  {p.actionDescription && (
                    <p className="text-slate-400 text-xs mt-0.5">{p.actionDescription}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingPenaltyId(p.id);
                      setPenaltyName(p.name);
                      setPenaltyXP(p.xpDeduction);
                      setPenaltyDesc(p.actionDescription);
                    }}
                    className="p-2 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeletePenalty(p.id)}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-400 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. BACKUP & SYSTEM RESET */}
      {activeSection === 'backup' && (
        <div className="bg-[#0F172A] p-6 rounded-2xl border border-slate-800 space-y-6">
          <div>
            <h3 className="font-gamer font-bold text-lg text-white">
              РЕЗЕРВНОЕ КОПИРОВАНИЕ И СБРОС
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Экспорт и импорт всех категорий, задач, календаря и наград через JSON или сброс к чистому нулю
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={handleExportJSON}
              className="p-4 rounded-xl border border-slate-800 bg-[#0B0F19] hover:border-sky-400 flex items-center gap-3 transition-colors cursor-pointer text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <span className="font-gamer font-bold text-white block text-sm">Скачать JSON бэкап</span>
                <span className="text-xs text-slate-400">Сохранить файл на ПК или смартфон</span>
              </div>
            </button>

            <label className="p-4 rounded-xl border border-slate-800 bg-[#0B0F19] hover:border-sky-400 flex items-center gap-3 transition-colors cursor-pointer text-left">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <span className="font-gamer font-bold text-white block text-sm">Восстановить из JSON</span>
                <span className="text-xs text-slate-400">Загрузить сохраненную базу данных</span>
              </div>
              <input type="file" accept=".json" onChange={handleFileImport} className="hidden" />
            </label>
          </div>

          <div className="pt-6 border-t border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-red-950/20 border border-red-500/30 p-4 rounded-xl">
              <div>
                <span className="font-gamer font-bold text-red-400 text-sm block">
                  ПОЛНЫЙ СБРОС К ЧИСТОМУ СТАРТУ (ZERO STATE)
                </span>
                <span className="text-xs text-slate-400">
                  Удаляет все созданные категории, задачи, записи календаря и обнуляет балансы.
                </span>
              </div>

              <button
                onClick={() => {
                  if (confirm('Вы уверены? Все задачи, категории, записи календаря и опыт будут удалены в ноль!')) {
                    onResetAllData();
                  }
                }}
                className="px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 text-xs font-gamer font-bold cursor-pointer transition-colors shrink-0"
              >
                ОЧИСТИТЬ ВСЁ (В НОЛЬ)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
