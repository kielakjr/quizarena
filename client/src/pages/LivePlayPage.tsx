import { useEffect, useState } from 'react';
import { Link } from 'react-router';
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
    if (gameState.phase !== 'countdown') return;
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
        <div className="flex flex-col items-center gap-4">
          <p className="text-text-muted text-lg font-medium">Get ready!</p>
          <div className="w-28 h-28 rounded-full border-4 border-primary flex items-center justify-center animate-pulse">
            <span className="text-6xl font-extrabold text-primary">
              {countdown || ''}
            </span>
          </div>
        </div>
      </main>
    );
  }

  if (gameState.phase === 'finished') {
    const myRank = gameState.leaderboard.findIndex((p) => p.nickname === nickname) + 1;
    const myEntry = gameState.leaderboard.find((p) => p.nickname === nickname);

    return (
      <main className="flex items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-md bg-surface border border-border rounded-2xl p-8 flex flex-col items-center gap-5 shadow-lg shadow-primary/10">
          <h1 className="text-2xl font-bold">Game Over!</h1>

          <div className="flex flex-col items-center gap-1">
            <span className="text-text-muted text-sm">{nickname}</span>
            <div className="text-5xl font-extrabold text-accent">#{myRank}</div>
            <span className="text-lg font-semibold text-primary">{myEntry?.score ?? 0} pts</span>
          </div>

          <div className="w-full space-y-2">
            <h3 className="text-sm font-semibold text-text-muted">Leaderboard</h3>
            {gameState.leaderboard.map((entry, i) => (
              <div
                key={entry.nickname}
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
              </div>
            ))}
          </div>

          <Link
            to="/"
            className="w-full text-center bg-primary hover:bg-primary-hover text-white font-semibold py-2.5 rounded-lg transition mt-2"
          >
            Back to home
          </Link>
        </div>
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
          <div className={`text-center ${results.correct ? 'text-correct' : 'text-wrong'}`}>
            <div className="text-5xl font-extrabold mb-2">
              {results.correct ? 'Correct!' : 'Wrong!'}
            </div>
            {results.correct && (
              <p className="text-lg font-semibold">+{results.pointsEarned} points</p>
            )}
            {(results.streak ?? 0) >= 2 && (
              <p className="text-sm text-accent mt-1">{results.streak} streak!</p>
            )}
          </div>

          <p className="text-text-muted text-sm animate-pulse">Waiting for host...</p>
        </div>
      </main>
    );
  }

  if (gameState.phase === 'leaderboard') {
    return (
      <main className="flex items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-md flex flex-col items-center gap-6">
          <h2 className="text-xl font-bold">Leaderboard</h2>
          <div className="w-full space-y-2">
            {gameState.leaderboard.map((entry, i) => (
              <div
                key={entry.nickname}
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
              </div>
            ))}
          </div>
          <p className="text-text-muted text-sm animate-pulse">Next question coming up...</p>
        </div>
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

      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 py-8">
        <div className="text-center mb-2">
          <span className="text-xs text-text-muted">{question.points} pts</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-center mb-8">{question.text}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-auto">
          {question.options.map((option, i) => {
            const color = optionColors[i];
            const isSelected = selectedOption === i;
            const disabled = gameState.answered;

            return (
              <button
                key={option._id}
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
              </button>
            );
          })}
        </div>

        {gameState.answered && (
          <div className="text-center mt-6">
            <p className="text-text-muted text-sm animate-pulse">Answer submitted! Waiting for everyone...</p>
          </div>
        )}
      </div>
    </main>
  );
};

export default LivePlayPage;
