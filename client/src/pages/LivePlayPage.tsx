import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { imageUrl } from '../api/axios';
import type { GameState } from '../hooks/useGameSocket';

interface GameActions {
  submitAnswer: (pin: string, optionIndex: number) => void;
}

interface LivePlayPageProps {
  pin: string;
  nickname: string;
  gameState: GameState;
  actions: GameActions;
}

const optionColors = [
  { bg: 'bg-red-500/15', border: 'border-red-500/40', selected: 'border-red-500 bg-red-500/30' },
  { bg: 'bg-blue-500/15', border: 'border-blue-500/40', selected: 'border-blue-500 bg-blue-500/30' },
  { bg: 'bg-amber-500/15', border: 'border-amber-500/40', selected: 'border-amber-500 bg-amber-500/30' },
  { bg: 'bg-emerald-500/15', border: 'border-emerald-500/40', selected: 'border-emerald-500 bg-emerald-500/30' },
];

const LivePlayPage = ({ pin, nickname, gameState, actions }: LivePlayPageProps) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [timerPercent, setTimerPercent] = useState(100);
  const [timeLeft, setTimeLeft] = useState(0);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (gameState.phase !== 'countdown' && gameState.phase !== 'questionCountdown') return;
    setCountdown(gameState.countdownSeconds);

    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState.phase, gameState.countdownSeconds]);

  useEffect(() => {
    if (gameState.phase !== 'playing' || !gameState.question) return;
    const duration = gameState.question.timeLimit * 1000;
    const start = Date.now();
    setTimerPercent(100);
    setTimeLeft(gameState.question.timeLimit);
    setSelectedOption(null);

    const frame = () => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 1 - elapsed / duration);
      setTimerPercent(remaining * 100);
      setTimeLeft(Math.ceil((duration - elapsed) / 1000));
      if (remaining > 0) rafId = requestAnimationFrame(frame);
    };

    let rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, [gameState.phase, gameState.question?.index]);

  const handleAnswer = (optionIndex: number) => {
    if (gameState.answered) return;
    setSelectedOption(optionIndex);
    actions.submitAnswer(pin, optionIndex);
  };

  if (gameState.error) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen px-4 gap-4">
        <p className="text-wrong text-lg font-semibold">{gameState.error}</p>
        <Link to="/" className="text-primary hover:underline text-sm">Go home</Link>
      </main>
    );
  }

  if (gameState.phase === 'countdown') {
    return (
      <main className="flex items-center justify-center min-h-screen px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <p className="text-text-muted text-lg font-medium">Get ready!</p>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="w-28 h-28 rounded-full border-4 border-primary flex items-center justify-center"
          >
            <AnimatePresence mode="popLayout">
              <motion.span
                key={countdown}
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="text-6xl font-extrabold text-primary"
              >
                {countdown || ''}
              </motion.span>
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </main>
    );
  }

  if (gameState.phase === 'questionCountdown') {
    return (
      <main className="flex items-center justify-center min-h-screen px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <p className="text-text-muted text-lg font-medium">Next question in...</p>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="w-28 h-28 rounded-full border-4 border-primary flex items-center justify-center"
          >
            <AnimatePresence mode="popLayout">
              <motion.span
                key={countdown}
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="text-6xl font-extrabold text-primary"
              >
                {countdown || ''}
              </motion.span>
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </main>
    );
  }

  if (gameState.phase === 'finished') {
    const myRank = gameState.leaderboard.findIndex((p) => p.nickname === nickname) + 1;
    const myEntry = gameState.leaderboard.find((p) => p.nickname === nickname);

    return (
      <main className="flex items-center justify-center min-h-screen px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-surface border border-border rounded-2xl p-8 flex flex-col items-center gap-5 shadow-lg shadow-primary/10"
        >
          <h1 className="text-2xl font-bold">Game Over!</h1>

          <div className="flex flex-col items-center gap-1">
            <span className="text-text-muted text-sm">{nickname}</span>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="text-5xl font-extrabold text-accent"
            >
              #{myRank}
            </motion.div>
            <span className="text-lg font-semibold text-primary">{myEntry?.score ?? 0} pts</span>
          </div>

          <div className="w-full space-y-2">
            <h3 className="text-sm font-semibold text-text-muted">Leaderboard</h3>
            {gameState.leaderboard.map((entry, i) => (
              <motion.div
                key={entry.nickname}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className={`flex items-center justify-between px-4 py-2 rounded-lg ${
                  entry.nickname === nickname
                    ? 'bg-primary/15 border border-primary/30'
                    : 'bg-background border border-border'
                }`}
              >
                <span className="text-sm font-medium">
                  <span className="text-text-muted mr-2">#{i + 1}</span>
                  {entry.nickname}
                </span>
                <span className="text-sm font-bold text-accent">{entry.score}</span>
              </motion.div>
            ))}
          </div>

          <Link
            to="/"
            className="w-full text-center bg-primary hover:bg-primary-hover text-white font-semibold py-2.5 rounded-lg transition mt-2"
          >
            Back to home
          </Link>
        </motion.div>
      </main>
    );
  }

  const { question, results } = gameState;
  if (!question) return null;

  if (gameState.phase === 'results' && results) {
    return (
      <main className="min-h-screen flex flex-col">
        <div className="bg-surface border-b border-border px-4 py-3">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <span className="text-sm font-semibold">
              Question {question.index + 1} of {question.total}
            </span>
            <span className="text-sm font-bold text-accent">{results.totalScore ?? 0} pts</span>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-4 gap-6">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className={`text-center ${results.correct ? 'text-correct' : 'text-wrong'}`}
          >
            <div className="text-5xl font-extrabold mb-2">
              {results.correct ? 'Correct!' : 'Wrong!'}
            </div>
            {results.correct && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg font-semibold"
              >
                +{results.pointsEarned} points
              </motion.p>
            )}
            {(results.streak ?? 0) >= 2 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-sm text-accent mt-1"
              >
                {results.streak} streak!
              </motion.p>
            )}
          </motion.div>

          <p className="text-text-muted text-sm animate-pulse">Waiting for host...</p>
        </div>
      </main>
    );
  }

  if (gameState.phase === 'leaderboard') {
    return (
      <main className="flex items-center justify-center min-h-screen px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md flex flex-col items-center gap-6"
        >
          <h2 className="text-xl font-bold">Leaderboard</h2>
          <div className="w-full space-y-2">
            {gameState.leaderboard.map((entry, i) => (
              <motion.div
                key={entry.nickname}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`flex items-center justify-between px-4 py-3 rounded-lg ${
                  entry.nickname === nickname
                    ? 'bg-primary/15 border border-primary/30'
                    : 'bg-surface border border-border'
                }`}
              >
                <span className="font-medium">
                  <span className="text-text-muted mr-2">#{i + 1}</span>
                  {entry.nickname}
                </span>
                <span className="font-bold text-accent">{entry.score}</span>
              </motion.div>
            ))}
          </div>
          <p className="text-text-muted text-sm animate-pulse">Next question coming up...</p>
        </motion.div>
      </main>
    );
  }

  const questionProgress = ((question.index + (gameState.answered ? 1 : 0)) / question.total) * 100;
  const timerColor = timerPercent <= 20 ? 'bg-wrong' : timerPercent <= 50 ? 'bg-accent' : 'bg-primary';

  return (
    <main className="min-h-screen flex flex-col">
      <div className="bg-surface border-b border-border px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold">
              {question.index + 1} of {question.total}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-text-muted">{nickname}</span>
            <span className={`text-sm font-bold tabular-nums ${timeLeft <= 5 ? 'text-wrong' : 'text-accent'}`}>
              {timeLeft}s
            </span>
          </div>
        </div>
      </div>

      <div className="h-1.5 bg-border">
        <div
          className={`h-full ${timerColor} transition-none`}
          style={{ width: `${timerPercent}%` }}
        />
      </div>

      <div className="h-0.5 bg-border">
        <div
          className="h-full bg-text-muted/30 transition-all duration-500"
          style={{ width: `${questionProgress}%` }}
        />
      </div>

      <motion.div
        key={`q-${question.index}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 py-8"
      >
        <div className="text-center mb-2">
          <span className="text-xs text-text-muted">{question.points} pts</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-center mb-4">{question.text}</h2>

        {question.imageUrl && (
          <img
            src={imageUrl(question.imageUrl)}
            alt="Question"
            className="max-h-72 w-full rounded-xl object-contain mx-auto mb-4"
          />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-auto">
          {question.options.map((option, i) => {
            const color = optionColors[i];
            const isSelected = selectedOption === i;
            const disabled = gameState.answered;

            return (
              <motion.button
                key={option._id}
                whileHover={!disabled ? { scale: 1.02 } : undefined}
                whileTap={!disabled ? { scale: 0.97 } : undefined}
                onClick={() => handleAnswer(i)}
                disabled={disabled}
                className={`w-full text-left px-5 py-4 rounded-xl border-2 transition font-medium ${
                  isSelected
                    ? color.selected
                    : disabled
                    ? `${color.bg} ${color.border} opacity-40`
                    : `${color.bg} ${color.border} hover:brightness-110 cursor-pointer`
                }`}
              >
                <span className="opacity-60 mr-2 font-mono text-sm">
                  {String.fromCharCode(65 + i)}
                </span>
                {option.text}
              </motion.button>
            );
          })}
        </div>

        <AnimatePresence>
          {gameState.answered && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mt-6"
            >
              <p className="text-text-muted text-sm animate-pulse">Answer submitted! Waiting for everyone...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </main>
  );
};

export default LivePlayPage;
