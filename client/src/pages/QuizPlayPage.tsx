import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router';
import api from '../api/axios';
import type { Quiz } from '../types/quiz';

const optionColors = [
  { bg: 'bg-red-500/15', border: 'border-red-500/40', hover: 'hover:border-red-500' },
  { bg: 'bg-blue-500/15', border: 'border-blue-500/40', hover: 'hover:border-blue-500' },
  { bg: 'bg-amber-500/15', border: 'border-amber-500/40', hover: 'hover:border-amber-500' },
  { bg: 'bg-emerald-500/15', border: 'border-emerald-500/40', hover: 'hover:border-emerald-500' },
];

const QuizPlayPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const nickname = searchParams.get('nickname') ?? 'Player';

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    api.get(`/quizzes/${id}`)
      .then((res) => setQuiz(res.data.quiz))
      .catch(() => setFetchError('Failed to load quiz'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <p className="text-text-muted animate-pulse">Loading quiz...</p>
      </main>
    );
  }

  if (fetchError || !quiz) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-wrong">{fetchError || 'Quiz not found'}</p>
        <Link to="/" className="text-primary hover:underline text-sm">Go home</Link>
      </main>
    );
  }

  const questions = quiz.questions;
  const question = questions[current];
  const total = questions.length;
  const progress = ((current + (revealed ? 1 : 0)) / total) * 100;

  const correctIndex = question.options.findIndex((o) => o.isCorrect);

  const handleSelect = (index: number) => {
    if (revealed) return;
    setSelected(index);
    setRevealed(true);
    if (question.options[index].isCorrect) {
      setScore((s) => s + question.points);
      setStreak((s) => s + 1);
    } else {
      setStreak(0);
    }
  };

  const handleNext = () => {
    if (current + 1 >= total) {
      setFinished(true);
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
      setRevealed(false);
    }
  };

  const optionStyle = (index: number) => {
    const color = optionColors[index];
    const base = 'w-full text-left px-5 py-4 rounded-xl border-2 transition cursor-pointer font-medium';

    if (!revealed) {
      return `${base} ${color.bg} ${color.border} ${color.hover}`;
    }
    if (question.options[index].isCorrect) {
      return `${base} border-correct bg-correct/20 text-correct`;
    }
    if (index === selected) {
      return `${base} border-wrong bg-wrong/20 text-wrong`;
    }
    return `${base} border-border bg-surface opacity-40`;
  };

  const maxScore = questions.reduce((sum, q) => sum + q.points, 0);

  if (finished) {
    const percentage = Math.round((score / maxScore) * 100);
    return (
      <main className="flex items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-md bg-surface border border-border rounded-2xl p-8 flex flex-col items-center gap-5 shadow-lg shadow-primary/10">
          <h1 className="text-2xl font-bold">Game over!</h1>

          <div className="flex flex-col items-center gap-1">
            <span className="text-text-muted text-sm">{nickname}</span>
            <div className={`text-7xl font-extrabold ${percentage >= 70 ? 'text-correct' : percentage >= 40 ? 'text-accent' : 'text-wrong'}`}>
              {percentage}%
            </div>
          </div>

          <div className="w-full grid grid-cols-2 gap-3">
            <div className="bg-background border border-border rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-primary">
                {questions.filter((_, i) => i < total).length > 0
                  ? `${Math.round(score / (maxScore / total))}/${total}`
                  : '0/0'}
              </div>
              <div className="text-xs text-text-muted mt-1">Correct</div>
            </div>
            <div className="bg-background border border-border rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-accent">{score}</div>
              <div className="text-xs text-text-muted mt-1">Points</div>
            </div>
          </div>

          <div className="flex gap-3 w-full mt-2">
            <Link
              to="/"
              className="flex-1 text-center border border-border hover:border-primary text-text text-sm font-semibold py-2.5 rounded-lg transition"
            >
              Home
            </Link>
            <button
              onClick={() => {
                setCurrent(0);
                setSelected(null);
                setRevealed(false);
                setScore(0);
                setStreak(0);
                setFinished(false);
              }}
              className="flex-1 bg-primary hover:bg-primary-hover text-white text-sm font-semibold py-2.5 rounded-lg transition cursor-pointer"
            >
              Play again
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col">
      {/* Top bar */}
      <div className="bg-surface border-b border-border px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold truncate max-w-48">{quiz.title}</span>
            {streak >= 2 && (
              <span className="text-xs bg-accent/15 text-accent font-semibold px-2 py-0.5 rounded-full">
                {streak} streak
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-text-muted">{nickname}</span>
            <span className="text-sm font-bold text-accent">{score} pts</span>
          </div>
        </div>
      </div>

      <div className="h-1 bg-border">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <span className="text-sm font-medium text-text-muted">{current + 1} of {total}</span>
          <span className="text-xs text-text-muted">{question.timeLimit}s &middot; {question.points} pts</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-center mb-8">{question.text}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-auto">
          {question.options.map((option, i) => (
            <button
              key={option._id ?? i}
              onClick={() => handleSelect(i)}
              disabled={revealed}
              className={optionStyle(i)}
            >
              <span className="opacity-60 mr-2 font-mono text-sm">
                {String.fromCharCode(65 + i)}
              </span>
              {option.text}
            </button>
          ))}
        </div>

        {revealed && (
          <div className="flex items-center justify-between mt-6">
            <span className={`text-sm font-semibold ${selected === correctIndex ? 'text-correct' : 'text-wrong'}`}>
              {selected === correctIndex ? `Correct! +${question.points} pts` : 'Wrong answer'}
            </span>
            <button
              onClick={handleNext}
              className="bg-primary hover:bg-primary-hover text-white font-semibold px-6 py-2.5 rounded-lg transition cursor-pointer"
            >
              {current + 1 >= total ? 'See results' : 'Next'}
            </button>
          </div>
        )}
      </div>
    </main>
  );
};

export default QuizPlayPage;
