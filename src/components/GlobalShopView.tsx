import React from 'react';
import { motion } from 'motion/react';
import {
  ShoppingBag,
  Sparkles,
  CheckCircle,
  Lock,
  Crown,
  Award,
} from 'lucide-react';
import { GlobalShopItem, GlobalState } from '../types';
import { DynamicIcon } from './DynamicIcon';
import { triggerPurchaseConfetti } from '../utils/confetti';
import { soundFX } from '../utils/sound';

interface GlobalShopViewProps {
  globalState: GlobalState;
  onBuyItem: (item: GlobalShopItem) => void;
  onNavigateToSettings: () => void;
}

export const GlobalShopView: React.FC<GlobalShopViewProps> = ({
  globalState,
  onBuyItem,
  onNavigateToSettings,
}) => {
  const shopItems = globalState.globalShop || [];

  const handlePurchase = (item: GlobalShopItem) => {
    if (globalState.globalUXP < item.costUXP) return;

    soundFX.playPurchase();
    triggerPurchaseConfetti();
    onBuyItem(item);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0F172A] p-6 rounded-2xl border border-slate-800 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-60 h-60 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold font-gamer tracking-wide text-white">
                ОБЩИЙ МАГАЗИН ЭЛИТНЫХ НАГРАД (UXP)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Каталог наград, приобретаемых за единую валюту Ultra UXP
              </p>
            </div>
          </div>
        </div>

        {/* Global UXP Balance Cards */}
        <div className="relative z-10 flex flex-wrap items-center gap-3 shrink-0">
          <div className="flex items-center gap-3 bg-[#0B0F19] px-4 py-2.5 rounded-xl border border-sky-500/30">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 flex items-center justify-center text-sky-400">
              <Sparkles className="w-4 h-4 fill-sky-400" />
            </div>
            <div>
              <span className="text-[10px] font-gamer text-slate-400 uppercase">Баланс покупок</span>
              <div className="text-lg font-mono-code font-bold text-sky-400">
                {globalState.globalUXP.toLocaleString()} UXP
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-[#0B0F19] px-4 py-2.5 rounded-xl border border-indigo-500/30">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-gamer text-indigo-300 uppercase">Титульный UXP</span>
              <div className="text-lg font-mono-code font-bold text-indigo-300">
                {(globalState.highestGlobalUXP || globalState.globalUXP).toLocaleString()} UXP
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Global Shop Items */}
      {shopItems.length === 0 ? (
        <div className="p-12 text-center bg-[#0F172A] rounded-2xl border border-dashed border-slate-800 text-slate-400">
          <ShoppingBag className="h-10 w-10 mx-auto text-slate-500 mb-3" />
          <p className="font-gamer font-bold text-base text-slate-300">В общем магазине пока нет товаров</p>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Вы можете самостоятельно добавить любые желаемые награды во вкладке «Настройки системы».
          </p>
          <button
            onClick={onNavigateToSettings}
            className="mt-4 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-gamer font-bold text-xs cursor-pointer transition-colors shadow-lg"
          >
            ДОБАВИТЬ ТОВАР В НАСТРОЙКАХ
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {shopItems.map((item) => {
            const canAfford = globalState.globalUXP >= item.costUXP;
            const missing = item.costUXP - globalState.globalUXP;

            return (
              <motion.div
                key={item.id}
                whileHover={{ y: -4, scale: 1.01 }}
                className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-[#0F172A] p-5 backdrop-blur-xl transition-all duration-300 flex flex-col justify-between hover:border-sky-500/50"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-500/30 bg-sky-500/10 text-sky-400 shadow-lg">
                      <DynamicIcon name={item.icon || 'Crown'} className="h-6 w-6" />
                    </div>

                    <span className="inline-flex items-center gap-1 font-mono-code font-bold text-xs px-2.5 py-1 rounded-xl border border-sky-500/30 bg-sky-950/40 text-sky-200">
                      <Sparkles className="h-3.5 w-3.5 text-sky-400 fill-sky-400" />
                      <span>{item.costUXP.toLocaleString()} UXP</span>
                    </span>
                  </div>

                  <h3 className="mt-4 font-gamer font-bold text-base text-white group-hover:text-sky-300 transition-colors">
                    {item.name}
                  </h3>

                  {item.description && (
                    <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800">
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    disabled={!canAfford}
                    onClick={() => handlePurchase(item)}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-gamer font-bold text-xs transition-all cursor-pointer ${
                      canAfford
                        ? 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white shadow-[0_0_12px_rgba(14,165,233,0.3)]'
                        : 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {canAfford ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>КУПИТЬ ЗА {item.costUXP} UXP</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>НЕ ХВАТАЕТ {missing} UXP</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
