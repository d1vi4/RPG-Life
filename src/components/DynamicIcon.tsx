import React from 'react';
import * as LucideIcons from 'lucide-react';
import { LucideProps } from 'lucide-react';

interface DynamicIconProps extends LucideProps {
  name: string;
}

export const DynamicIcon: React.FC<DynamicIconProps> = ({ name, ...props }) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const IconComponent = (LucideIcons as any)[name] || LucideIcons.Sparkles;
  return <IconComponent {...props} />;
};

export const AVAILABLE_ICONS = [
  'Code2',
  'Terminal',
  'Cpu',
  'Binary',
  'Sigma',
  'Calculator',
  'Activity',
  'Dumbbell',
  'Trophy',
  'Award',
  'Crown',
  'Zap',
  'ShieldAlert',
  'ShieldCheck',
  'Sparkles',
  'Gamepad2',
  'Pizza',
  'Coffee',
  'Film',
  'BookOpen',
  'Music',
  'Layers',
  'Rocket',
  'Target',
  'Crosshair',
  'Brain',
  'Compass',
  'Star',
  'Gem',
  'Calendar',
  'CheckCircle2',
  'Clock',
  'Flame',
  'Languages',
  'NotebookPen',
];
