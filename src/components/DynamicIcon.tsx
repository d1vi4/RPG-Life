import React from 'react';
import * as LucideIcons from 'lucide-react';
import { LucideProps } from 'lucide-react';
import { TitleVisualEffect } from '../types';

interface DynamicIconProps extends LucideProps {
  name: string;
}

export const DynamicIcon: React.FC<DynamicIconProps> = ({ name, ...props }) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const IconComponent = (LucideIcons as any)[name] || LucideIcons.Sparkles;
  return <IconComponent {...props} />;
};

export const DEFAULT_TITLE_COLOR = '#3b82f6'; // Blue default

export const TITLE_COLOR_PRESETS = [
  { name: 'Синий (Классик)', value: '#3b82f6' },
  { name: 'Небесный Сапфир', value: '#0ea5e9' },
  { name: 'Бирюзовый Неон', value: '#06b6d4' },
  { name: 'Изумрудный', value: '#10b981' },
  { name: 'Фиолетовый Мистик', value: '#8b5cf6' },
  { name: 'Пурпурный Элит', value: '#a855f7' },
  { name: 'Янтарный / Золото', value: '#f59e0b' },
  { name: 'Огненный Рубин', value: '#ef4444' },
  { name: 'Розовый Кибер', value: '#ec4899' },
  { name: 'Серебряный Лед', value: '#94a3b8' },
];

export const TITLE_EFFECT_OPTIONS: { id: TitleVisualEffect; label: string; desc: string }[] = [
  { id: 'none', label: 'Чистый стиль', desc: 'Строгий плоский цвет без анимаций' },
  { id: 'glow', label: 'Мягкое сияние (Glow)', desc: 'Аура рассеянного неонового света' },
  { id: 'neon', label: 'Неоновый контур (Neon)', desc: 'Яркий пульсирующий контур и подсветка' },
  { id: 'shimmer', label: 'Мерцающий блик (Shimmer)', desc: 'Градиентный блик света, бегущий по титулу' },
];

export const AVAILABLE_ICONS = [
  'Crown',
  'Trophy',
  'Award',
  'Medal',
  'Sparkles',
  'Zap',
  'Flame',
  'ShieldCheck',
  'ShieldAlert',
  'Sword',
  'Star',
  'Gem',
  'Rocket',
  'Target',
  'Crosshair',
  'Brain',
  'Heart',
  'Compass',
  'Flag',
  'Sun',
  'Moon',
  'Eye',
  'Gift',
  'Activity',
  'Dumbbell',
  'Gamepad2',
  'Code2',
  'Terminal',
  'Cpu',
  'Binary',
  'Sigma',
  'Calculator',
  'BookOpen',
  'Music',
  'Layers',
  'Clock',
  'Calendar',
  'CheckCircle2',
  'Languages',
  'Coffee',
  'Pizza',
  'Film',
  'NotebookPen',
];
