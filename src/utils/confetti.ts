import confetti from 'canvas-confetti';

export const triggerLevelUpConfetti = () => {
  const duration = 3 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 70, zIndex: 9999 };

  const interval: ReturnType<typeof setInterval> = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 40 * (timeLeft / duration);

    confetti({
      ...defaults,
      particleCount,
      origin: { x: 0.15, y: 0.7 },
      colors: ['#10b981', '#a855f7', '#f59e0b', '#38bdf8', '#ec4899', '#ffffff'],
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: 0.85, y: 0.7 },
      colors: ['#10b981', '#a855f7', '#f59e0b', '#38bdf8', '#ec4899', '#ffffff'],
    });
  }, 250);
};

export const triggerTaskCompleteConfetti = (event?: { clientX: number; clientY: number }) => {
  let origin = { x: 0.5, y: 0.6 };
  if (event && event.clientX && event.clientY && typeof window !== 'undefined') {
    origin = {
      x: event.clientX / window.innerWidth,
      y: event.clientY / window.innerHeight,
    };
  }

  confetti({
    particleCount: 25,
    spread: 60,
    startVelocity: 25,
    origin,
    zIndex: 9999,
    colors: ['#10b981', '#34d399', '#a855f7', '#38bdf8', '#fbbf24'],
  });
};

export const triggerPurchaseConfetti = () => {
  confetti({
    particleCount: 45,
    spread: 80,
    origin: { y: 0.65 },
    zIndex: 9999,
    colors: ['#fbbf24', '#f59e0b', '#a855f7', '#ec4899', '#10b981'],
  });
};
