import React from 'react';
import { TitleVisualEffect } from '../types';
import { DynamicIcon, DEFAULT_TITLE_COLOR } from './DynamicIcon';

interface TitleBadgeProps {
  title: string;
  icon?: string;
  color?: string;
  effect?: TitleVisualEffect;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  showIcon?: boolean;
}

export const TitleBadge: React.FC<TitleBadgeProps> = ({
  title,
  icon = 'Crown',
  color = DEFAULT_TITLE_COLOR,
  effect = 'none',
  size = 'sm',
  className = '',
  showIcon = true,
}) => {
  const safeColor = color || DEFAULT_TITLE_COLOR;

  // Size styling maps
  const sizeStyles = {
    xs: {
      container: 'px-2 py-0.5 text-[10px] gap-1 rounded-md',
      icon: 'w-2.5 h-2.5',
    },
    sm: {
      container: 'px-2.5 py-1 text-xs gap-1.5 rounded-lg',
      icon: 'w-3.5 h-3.5',
    },
    md: {
      container: 'px-3.5 py-1.5 text-sm gap-2 rounded-xl',
      icon: 'w-4 h-4',
    },
    lg: {
      container: 'px-4 py-2 text-base gap-2.5 rounded-2xl',
      icon: 'w-5 h-5',
    },
  };

  const selectedSize = sizeStyles[size] || sizeStyles.sm;

  // Effect-specific styles and inline effects
  let effectContainerClass = '';
  const inlineContainerStyle: React.CSSProperties = {
    color: safeColor,
    backgroundColor: `${safeColor}14`,
    borderColor: `${safeColor}45`,
  };

  if (effect === 'glow') {
    effectContainerClass = 'shadow-md';
    inlineContainerStyle.boxShadow = `0 0 16px ${safeColor}55, inset 0 0 8px ${safeColor}22`;
  } else if (effect === 'neon') {
    effectContainerClass = 'border-2';
    inlineContainerStyle.borderColor = safeColor;
    inlineContainerStyle.boxShadow = `0 0 12px ${safeColor}88, 0 0 24px ${safeColor}44`;
    inlineContainerStyle.textShadow = `0 0 8px ${safeColor}`;
  }

  return (
    <div
      className={`relative inline-flex items-center font-gamer font-bold uppercase tracking-wider border overflow-hidden transition-all duration-200 select-none ${selectedSize.container} ${effectContainerClass} ${className}`}
      style={inlineContainerStyle}
    >
      {/* Shimmer sweep animation overlay */}
      {effect === 'shimmer' && (
        <div
          className="absolute inset-0 pointer-events-none -translate-x-full animate-[shimmer_2.5s_infinite_linear]"
          style={{
            background: `linear-gradient(90deg, transparent, ${safeColor}40, rgba(255,255,255,0.4), ${safeColor}40, transparent)`,
          }}
        />
      )}

      {showIcon && (
        <DynamicIcon
          name={icon || 'Crown'}
          className={`${selectedSize.icon} shrink-0`}
          style={{ color: safeColor }}
        />
      )}

      <span className="truncate max-w-[220px] relative z-10">{title}</span>
    </div>
  );
};
