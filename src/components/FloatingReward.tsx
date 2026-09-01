import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Zap } from 'lucide-react';

export interface FloatingRewardItem {
  id: string;
  xp: number;
  uxp: number;
  x?: number;
  y?: number;
}

interface FloatingRewardProps {
  rewards: FloatingRewardItem[];
  onComplete: (id: string) => void;
}

export const FloatingReward: React.FC<FloatingRewardProps> = ({ rewards, onComplete }) => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-visible z-50 flex items-center justify-center">
      <AnimatePresence>
        {rewards.map((reward) => (
          <motion.div
            key={reward.id}
            initial={{ opacity: 0, y: 0, scale: 0.6 }}
            animate={{
              opacity: [0, 1, 1, 0],
              y: -60,
              scale: [0.6, 1.15, 1, 0.9],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4, ease: 'easeOut' }}
            onAnimationComplete={() => onComplete(reward.id)}
            className="absolute flex items-center gap-2 bg-[#0d111c]/95 border border-green-500/50 px-4 py-2 rounded-full shadow-2xl backdrop-blur-md whitespace-nowrap"
            style={
              reward.x && reward.y
                ? { left: `${reward.x}px`, top: `${reward.y}px`, transform: 'translate(-50%, -50%)' }
                : undefined
            }
          >
            <div className="flex items-center gap-1 text-green-400 font-gamer font-bold text-sm sm:text-base">
              <Zap className="w-4 h-4 fill-green-400" />
              <span>+{reward.xp} XP</span>
            </div>
            {reward.uxp > 0 && (
              <div className="flex items-center gap-1 text-purple-300 font-gamer font-bold text-sm sm:text-base border-l border-white/20 pl-2">
                <Sparkles className="w-4 h-4 text-purple-400 fill-purple-400" />
                <span>+{reward.uxp} UXP</span>
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
