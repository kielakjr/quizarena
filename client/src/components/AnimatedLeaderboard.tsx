import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Avatar from './Avatar';
import type { LeaderboardEntry } from '../hooks/useGameSocket';

interface AnimatedLeaderboardProps {
  leaderboard: LeaderboardEntry[];
  previousLeaderboard: LeaderboardEntry[];
  currentNickname?: string;
}

function useAnimatedScore(target: number, duration = 800) {
  const [display, setDisplay] = useState(target);
  const rafRef = useRef(0);

  useEffect(() => {
    const start = display;
    const delta = target - start;
    if (delta === 0) return;

    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + delta * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return display;
}

const ScoreCell = ({ entry, previousScore }: { entry: LeaderboardEntry; previousScore: number }) => {
  const gained = entry.score - previousScore;
  const animatedScore = useAnimatedScore(entry.score);
  const [showGained, setShowGained] = useState(gained > 0);

  useEffect(() => {
    if (gained <= 0) return;
    setShowGained(true);
    const timer = setTimeout(() => setShowGained(false), 2000);
    return () => clearTimeout(timer);
  }, [gained]);

  return (
    <div className="flex items-center gap-2">
      <AnimatePresence>
        {showGained && gained > 0 && (
          <motion.span
            initial={{ opacity: 0, y: 8, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="text-xs font-bold text-correct"
          >
            +{gained}
          </motion.span>
        )}
      </AnimatePresence>
      <span className="font-bold text-accent tabular-nums">{animatedScore}</span>
    </div>
  );
};

const AnimatedLeaderboard = ({ leaderboard, previousLeaderboard, currentNickname }: AnimatedLeaderboardProps) => {
  const previousScoreMap = useRef<Map<string, number>>(new Map());

  // Build the previous score lookup on mount / when previous changes
  useEffect(() => {
    const map = new Map<string, number>();
    for (const entry of previousLeaderboard) {
      map.set(entry.nickname, entry.score);
    }
    previousScoreMap.current = map;
  }, [previousLeaderboard]);

  // Phase 1: show in old order, Phase 2: reorder
  const [sorted, setSorted] = useState<LeaderboardEntry[]>([]);
  const [phase, setPhase] = useState<'counting' | 'reordering'>('counting');

  useEffect(() => {
    // Start by showing players in their previous order (or new order if no previous)
    if (previousLeaderboard.length > 0) {
      // Build initial order: previous order, with new scores applied later via animation
      const prevOrder = previousLeaderboard.map((prev) => {
        const updated = leaderboard.find((e) => e.nickname === prev.nickname);
        return updated ?? prev;
      });
      // Add any new players that weren't in the previous leaderboard
      for (const entry of leaderboard) {
        if (!prevOrder.some((e) => e.nickname === entry.nickname)) {
          prevOrder.push(entry);
        }
      }
      setSorted(prevOrder);
      setPhase('counting');

      // After score animation, reorder to final positions
      const timer = setTimeout(() => {
        setSorted([...leaderboard]);
        setPhase('reordering');
      }, 1000);

      return () => clearTimeout(timer);
    } else {
      setSorted([...leaderboard]);
      setPhase('reordering');
    }
  }, [leaderboard, previousLeaderboard]);

  return (
    <div className="w-full space-y-2">
      {sorted.map((entry) => {
        const finalIndex = leaderboard.findIndex((e) => e.nickname === entry.nickname);
        const rank = finalIndex >= 0 ? finalIndex + 1 : sorted.indexOf(entry) + 1;
        const prevScore = previousScoreMap.current.get(entry.nickname) ?? 0;
        const isCurrent = entry.nickname === currentNickname;

        return (
          <motion.div
            key={entry.nickname}
            layout
            transition={
              phase === 'reordering'
                ? { type: 'spring', stiffness: 200, damping: 25 }
                : { duration: 0 }
            }
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex items-center justify-between px-4 py-3 rounded-lg ${
              isCurrent
                ? 'bg-primary/15 border border-primary/30'
                : 'bg-background border border-border'
            }`}
          >
            <span className="font-medium flex items-center gap-2">
              <motion.span
                key={`rank-${entry.nickname}-${rank}`}
                initial={{ scale: 1.3 }}
                animate={{ scale: 1 }}
                className={`font-bold min-w-6 ${rank === 1 ? 'text-accent' : 'text-text-muted'}`}
              >
                #{rank}
              </motion.span>
              <Avatar nickname={entry.nickname} size="sm" />
              {entry.nickname}
            </span>
            <ScoreCell entry={entry} previousScore={prevScore} />
          </motion.div>
        );
      })}
    </div>
  );
};

export default AnimatedLeaderboard;
