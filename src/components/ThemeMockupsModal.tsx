import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Palette,
  Sparkles,
  Check,
  Eye,
  Zap,
  Shield,
  Layers,
  Flame,
  Crown,
} from 'lucide-react';

export interface ThemeConcept {
  id: string;
  title: string;
  subtitle: string;
  imageSrc: string;
  badge: string;
  colorPalette: string[];
  description: string;
  features: string[];
  recommendedFor: string;
}

export const THEME_CONCEPTS: ThemeConcept[] = [
  {
    id: 'concept-1',
    title: '1. Cyberpunk Neon HUD',
    subtitle: 'Футуристический синдикат и неоновый интерфейс',
    imageSrc: new URL('../assets/images/concept_cyberpunk_hud_1788428956943.jpg', import.meta.url).href,
    badge: 'CYBERPUNK // HUD',
    colorPalette: ['#0B0D17', '#06b6d4', '#ec4899', '#8b5cf6', '#10b981'],
    description:
      'Глубокий обсидиановый фон, неоновые светящиеся контуры, неоново-бирюзовый (electric cyan) и фиолетово-розовый (synthwave magenta) акценты. Виджеты в стиле телеметрии космического корабля с интерактивными линиями сетки.',
    features: [
      'Неоновый контурный глоу-эффект у активных задач',
      'Геймерские прогресс-бары с градиентным заполнением',
      'Голографические карточки магазинов и титулов',
    ],
    recommendedFor: 'Любителей sci-fi, киберпанка, неонового света и технологичного гейминга',
  },
  {
    id: 'concept-2',
    title: '2. Dark Gold Luxury RPG',
    subtitle: 'Тёмное фэнтези, золото и древние реликвии',
    imageSrc: new URL('../assets/images/concept_dark_gold_1788428973822.jpg', import.meta.url).href,
    badge: 'DARK FANTASY // GOLD',
    colorPalette: ['#0B0C10', '#d97706', '#f59e0b', '#78350f', '#e2e8f0'],
    description:
      'Атмосфера Elden Ring и Diablo: бархатистый тёмный фон, рамы из состаренного золота и античной бронзы, тёплое свечение кристаллов UXP и богатые средневековые геральдические значки.',
    features: [
      'Золотые градиенты и благородная бронзовая окантовка',
      'Античные щиты и гербы для уровней и категорий',
      'Премиальная контрастность без лишнего визуального шума',
    ],
    recommendedFor: 'Ценителей классических RPG, атмосферы рыцарства, реликвий и тёмного фэнтези',
  },
  {
    id: 'concept-3',
    title: '3. Obsidian & Emerald High-Tech',
    subtitle: 'Ультрасовременный Bento Grid (Linear & Vercel Style)',
    imageSrc: new URL('../assets/images/concept_obsidian_emerald_1788428990494.jpg', import.meta.url).href,
    badge: 'MINIMAL // OBSIDIAN TECH',
    colorPalette: ['#090D16', '#10b981', '#059669', '#34d399', '#38bdf8'],
    description:
      'Изумрудно-мятный неоновый акцент на ультра-черном стеклянном фоне. Минималистичные карточки с микро-свечением, четкая математическая сетка, идеальная читаемость и чистота интерфейса топовых SaaS-продуктов.',
    features: [
      'Кристальная читаемость календаря и задач',
      'Минималистичный стеклянный блюр (Glassmorphism)',
      'Энергичные изумрудные акценты выполненных квестов',
    ],
    recommendedFor: 'Программистов, продуктивности и любителей эстетики Linear, Raycast и Vercel',
  },
  {
    id: 'concept-4',
    title: '4. Retro 16-bit JRPG Pixel',
    subtitle: 'Ностальгический пиксельный аркадный квест',
    imageSrc: new URL('../assets/images/concept_retro_pixel_1788429005781.jpg', import.meta.url).href,
    badge: 'RETRO // 16-BIT JRPG',
    colorPalette: ['#0f172a', '#e11d48', '#f59e0b', '#3b82f6', '#22c55e'],
    description:
      'Настоящий аркадный автомат и золотая эра 16-битных RPG: характерные пиксельные сердечки, шкалы маны/XP, яркие монетки, контрастные блочные плашки и ностальгические декоративные рамки.',
    features: [
      'Пиксельные рамки для аватаров и карточек',
      'Классические ретро-полоски здоровья и маны',
      'Аркадная звуковая и визуальная атмосфера побед',
    ],
    recommendedFor: 'Фанатам классических игр Final Fantasy, Chrono Trigger, Pokemon и 80-90s аркад',
  },
  {
    id: 'concept-5',
    title: '5. Nordic Frost & Royal Violet',
    subtitle: 'Скандинавская морозная ночь и королевский пурпур',
    imageSrc: new URL('../assets/images/concept_nordic_frost_1788429022535.jpg', import.meta.url).href,
    badge: 'NORDIC // ROYAL VIOLET',
    colorPalette: ['#0c1021', '#6366f1', '#a855f7', '#38bdf8', '#f8fafc'],
    description:
      'Глубокая полярная ночь, ледяная синева и насыщенный фиолетово-индиговый свет. Идеальный баланс между сдержанной элитной эстетикой и яркими киберспортивными акцентами достижений.',
    features: [
      'Морозное свечение вокруг активных элементов',
      'Благородный индиго-фиолетовый градиент кнопок',
      'Превосходный контраст шрифтов и карточек на темном стекле',
    ],
    recommendedFor: 'Любителей сбалансированного, глубокого темно-синего и фиолетового дизайна',
  },
];

interface ThemeMockupsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectConcept?: (conceptId: string) => void;
}

export const ThemeMockupsModal: React.FC<ThemeMockupsModalProps> = ({
  isOpen,
  onClose,
  onSelectConcept,
}) => {
  const [selectedConcept, setSelectedConcept] = useState<ThemeConcept>(THEME_CONCEPTS[0]);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-5xl bg-[#0B0F19] border border-slate-700/80 rounded-2xl shadow-2xl text-slate-100 flex flex-col max-h-[92vh] overflow-hidden"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-[#0F172A]/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-gamer font-bold text-base sm:text-lg text-white flex items-center gap-2">
                ГАЛЕРЕЯ ВИЗУАЛЬНЫХ КОНЦЕПТОВ UI
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  5 ВАРИАНТОВ
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Выберите понравившийся стиль для полного обновления дизайна LifeRPG
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Concept Tabs Selector */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {THEME_CONCEPTS.map((concept) => {
              const isSelected = selectedConcept.id === concept.id;
              return (
                <button
                  key={concept.id}
                  type="button"
                  onClick={() => setSelectedConcept(concept)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-slate-800 border-sky-400 shadow-md ring-1 ring-sky-400'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                  }`}
                >
                  <div>
                    <span className="text-[10px] font-mono-code font-bold uppercase tracking-wider block text-slate-400 mb-1">
                      {concept.badge}
                    </span>
                    <h4 className="font-gamer font-bold text-xs text-white line-clamp-1">
                      {concept.title.replace(/^\d+\.\s*/, '')}
                    </h4>
                  </div>

                  {/* Micro color dots */}
                  <div className="flex items-center gap-1 mt-2.5">
                    {concept.colorPalette.slice(0, 4).map((c, i) => (
                      <span
                        key={i}
                        className="w-2.5 h-2.5 rounded-full border border-black/50"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Concept Showcase Hero */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start bg-[#0F172A] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-inner">
            {/* Image Preview */}
            <div className="lg:col-span-7 space-y-2">
              <div
                onClick={() => setZoomedImage(selectedConcept.imageSrc)}
                className="relative group rounded-xl overflow-hidden border border-slate-700 bg-black cursor-zoom-in aspect-video"
              >
                <img
                  src={selectedConcept.imageSrc}
                  alt={selectedConcept.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3.5">
                  <span className="text-xs font-gamer text-white flex items-center gap-1.5 bg-black/70 px-3 py-1 rounded-lg backdrop-blur-sm border border-white/20">
                    <Eye className="w-3.5 h-3.5" /> Нажмите для увеличения
                  </span>
                  <span className="text-[10px] font-mono-code text-sky-300 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-400/30">
                    16:9 HD Mockup
                  </span>
                </div>
              </div>
            </div>

            {/* Concept Details */}
            <div className="lg:col-span-5 space-y-4">
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-sky-400 font-mono-code text-[11px] font-bold mb-2">
                  {selectedConcept.badge}
                </span>
                <h3 className="font-gamer font-bold text-lg sm:text-xl text-white">
                  {selectedConcept.title}
                </h3>
                <p className="text-xs text-sky-400/90 font-medium mt-0.5">
                  {selectedConcept.subtitle}
                </p>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {selectedConcept.description}
              </p>

              {/* Color Palette Swatches */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-gamer font-bold text-slate-400 uppercase tracking-wider">
                  Цветовая палитра:
                </label>
                <div className="flex items-center gap-2">
                  {selectedConcept.colorPalette.map((col, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1">
                      <div
                        className="w-7 h-7 rounded-lg border border-white/20 shadow-sm"
                        style={{ backgroundColor: col }}
                      />
                      <span className="text-[9px] font-mono-code text-slate-400">{col}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Features */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-gamer font-bold text-slate-400 uppercase tracking-wider">
                  Особенности стиля:
                </label>
                <ul className="space-y-1 text-xs text-slate-300">
                  {selectedConcept.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommendation */}
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-gamer font-bold text-white block">Идеально для:</span>
                  <span>{selectedConcept.recommendedFor}</span>
                </div>
              </div>
            </div>
          </div>

          {/* All 5 Concepts Quick Comparison Grid */}
          <div className="space-y-3 pt-2">
            <h4 className="font-gamer font-bold text-sm text-slate-200">
              ВСЕ 5 КОНЦЕПТОВ ДЛЯ СРАВНЕНИЯ:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {THEME_CONCEPTS.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedConcept(c)}
                  className={`p-3 rounded-xl border bg-[#0F172A] cursor-pointer transition-all hover:border-sky-400 group ${
                    selectedConcept.id === c.id ? 'border-sky-400 ring-1 ring-sky-400' : 'border-slate-800'
                  }`}
                >
                  <div className="aspect-video rounded-lg overflow-hidden border border-slate-700/60 mb-2.5 bg-black">
                    <img
                      src={c.imageSrc}
                      alt={c.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform"
                    />
                  </div>
                  <h5 className="font-gamer font-bold text-xs text-white group-hover:text-sky-300">
                    {c.title}
                  </h5>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                    {c.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#0F172A] flex items-center justify-between shrink-0">
          <p className="text-xs text-slate-400">
            Выбран концепт: <strong className="text-white">{selectedConcept.title}</strong>
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-white text-slate-950 font-gamer font-bold text-xs cursor-pointer shadow-md"
          >
            ЗАКРЫТЬ
          </button>
        </div>
      </motion.div>

      {/* Full Screen Image Zoom Modal */}
      {zoomedImage && (
        <div
          onClick={() => setZoomedImage(null)}
          className="fixed inset-0 z-60 bg-black/95 flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div className="relative max-w-6xl w-full">
            <img
              src={zoomedImage}
              alt="Zoomed concept"
              referrerPolicy="no-referrer"
              className="w-full h-auto rounded-2xl border border-slate-700 shadow-2xl max-h-[90vh] object-contain mx-auto"
            />
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/70 text-white hover:bg-black border border-white/20"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
