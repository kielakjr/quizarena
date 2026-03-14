import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useGameSocket } from '../hooks/useGameSocket';
import api, { imageUrl } from '../api/axios';
import type { Quiz } from '../types/quiz';

const HostTimerBar = ({ timeLimit, questionIndex }: { timeLimit: number; questionIndex: number }) => {
  const [percent, setPercent] = useState(100);
  const [timeLeft, setTimeLeft] = useState(timeLimit);

  useEffect(() => {
    const duration = timeLimit * 1000;
    const start = Date.now();
    setPercent(100);
    setTimeLeft(timeLimit);

    const frame = () => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 1 - elapsed / duration);
      setPercent(remaining * 100);
      setTimeLeft(Math.ceil((duration - elapsed) / 1000));
      if (remaining > 0) rafId = requestAnimationFrame(frame);
    };

    let rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, [timeLimit, questionIndex]);

  const color = percent <= 20 ? 'bg-wrong' : percent <= 50 ? 'bg-accent' : 'bg-primary';

  return (
    <div className="w-full flex items-center gap-3">
      <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-none rounded-full`} style={{ width: `${percent}%` }} />
      </div>
      <span className={`text-sm font-bold tabular-nums w-8 text-right ${timeLeft <= 5 ? 'text-wrong' : 'text-text-muted'}`}>
        {timeLeft}s
      </span>
    </div>
  );
};

const CountdownCircle = ({ seconds }: { seconds: number }) => {
  const [count, setCount] = useState(seconds);

  useEffect(() => {
    setCount(seconds);
    const interval = setInterval(() => {
      setCount((c) => {
        if (c <= 1) {
          clearInterval(interval);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [seconds]);

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 200 }}
      className="w-28 h-28 rounded-full border-4 border-primary flex items-center justify-center"
    >
      <AnimatePresence mode="popLayout">
        <motion.span
          key={count}
          initial={{ scale: 1.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="text-6xl font-extrabold text-primary"
        >
          {count || ''}
        </motion.span>
      </AnimatePresence>
    </motion.div>
  );
};

const HostPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { gameState, actions } = useGameSocket();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [pin, setPin] = useState(searchParams.get('pin') ?? '');
  const [creating, setCreating] = useState(false);
  const joinedAsHost = useRef(false);

  useEffect(() => {
    api.get(`/quizzes/${id}`)
      .then((res) => setQuiz(res.data.quiz))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!quiz || pin || creating) return;
    setCreating(true);
    api.post('/games/create', { quizId: id })
      .then((res) => {
        const newPin = res.data.pin;
        setPin(newPin);
        navigate(`/host/${id}?pin=${newPin}`, { replace: true });
      })
      .catch(() => {})
      .finally(() => setCreating(false));
  }, [quiz, pin, creating, id, navigate]);

  useEffect(() => {
    if (pin && token && !joinedAsHost.current) {
      joinedAsHost.current = true;
      actions.joinAsHost(pin, token);
    }
  }, [pin, token, actions]);

  if (loading) {
    return <p className="text-text-muted animate-pulse">Loading quiz...</p>;
  }

  if (!quiz) {
    return (
      <div className="flex flex-col items-center gap-4 pt-16">
        <p className="text-wrong">Quiz not found</p>
        <Link to="/dashboard" className="text-primary hover:underline text-sm">Back to dashboard</Link>
      </div>
    );
  }

  if (gameState.error) {
    return (
      <div className="flex flex-col items-center gap-4 pt-16">
        <p className="text-wrong">{gameState.error}</p>
        <Link to="/dashboard" className="text-primary hover:underline text-sm">Back to dashboard</Link>
      </div>
    );
  }

  if (gameState.phase === 'countdown') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center gap-6 pt-24"
      >
        <p className="text-text-muted text-lg font-medium">Game starting...</p>
        <CountdownCircle seconds={gameState.countdownSeconds} />
      </motion.div>
    );
  }

  if (gameState.phase === 'questionCountdown') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center gap-6 pt-24"
      >
        <p className="text-text-muted text-lg font-medium">Next question in...</p>
        <CountdownCircle seconds={gameState.countdownSeconds} />
      </motion.div>
    );
  }

  if (gameState.phase === 'finished') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-6 pt-8"
      >
        <h1 className="text-2xl font-bold">Game Over!</h1>
        <div className="w-full max-w-xl bg-surface border border-border rounded-2xl p-6">
          <h2 className="font-semibold mb-4">Final Leaderboard</h2>
          <div className="space-y-2">
            {gameState.leaderboard.map((entry, i) => (
              <motion.div
                key={entry.nickname}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center justify-between bg-background border border-border rounded-lg px-4 py-3"
              >
                <span className="font-medium">
                  <span className={`mr-2 font-bold ${i === 0 ? 'text-accent' : 'text-text-muted'}`}>#{i + 1}</span>
                  {entry.nickname}
                </span>
                <span className="font-bold text-accent">{entry.score} pts</span>
              </motion.div>
            ))}
          </div>
          <Link
            to="/dashboard"
            className="block text-center mt-6 bg-primary hover:bg-primary-hover text-white font-semibold px-6 py-2.5 rounded-lg transition"
          >
            Back to dashboard
          </Link>
        </div>
      </motion.div>
    );
  }

  if (gameState.phase === 'leaderboard') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-6 pt-8"
      >
        <h1 className="text-xl font-bold">Leaderboard</h1>
        <div className="w-full max-w-xl bg-surface border border-border rounded-2xl p-6">
          <div className="space-y-2 mb-6">
            {gameState.leaderboard.map((entry, i) => (
              <motion.div
                key={entry.nickname}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center justify-between bg-background border border-border rounded-lg px-4 py-3"
              >
                <span className="font-medium">
                  <span className={`mr-2 font-bold ${i === 0 ? 'text-accent' : 'text-text-muted'}`}>#{i + 1}</span>
                  {entry.nickname}
                </span>
                <span className="font-bold text-accent">{entry.score}</span>
              </motion.div>
            ))}
          </div>
          <motion.button
            onClick={() => actions.showNextQuestion(pin)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-primary hover:bg-primary-hover text-white font-semibold px-6 py-2.5 rounded-lg transition cursor-pointer"
          >
            Next question
          </motion.button>
        </div>
      </motion.div>
    );
  }

  if (gameState.phase === 'playing' || gameState.phase === 'results') {
    const { question, results } = gameState;
    if (!question) return null;

    return (
      <motion.div
        key={`question-${question.index}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-6"
      >
        <div className="flex items-center justify-between w-full">
          <h1 className="text-xl font-bold">{quiz.title}</h1>
          <span className="text-sm text-text-muted">
            Question {question.index + 1} of {question.total}
          </span>
        </div>

        {gameState.phase === 'playing' && (
          <HostTimerBar timeLimit={question.timeLimit} questionIndex={question.index} />
        )}

        <div className="w-full bg-surface border border-border rounded-xl p-8 flex flex-col items-center gap-6">
          <div className="text-center">
            <p className="text-text-muted text-xs mb-1">{question.points} pts</p>
            <h2 className="text-xl font-semibold">{question.text}</h2>
          </div>

          {question.imageUrl && (
            <img
              src={imageUrl(question.imageUrl)}
              alt="Question"
              className="max-h-80 w-full rounded-xl object-contain"
            />
          )}

          {gameState.phase === 'playing' && (
            <div className="text-sm text-text-muted">
              {gameState.answeredCount} / {gameState.totalPlayers || gameState.players.length} answered
            </div>
          )}

          {results && (
            <div className="w-full grid grid-cols-2 gap-3">
              {question.options.map((opt, i) => (
                <div
                  key={opt._id}
                  className={`rounded-lg p-3 flex items-center justify-between ${
                    i === results.correctIndex
                      ? 'bg-correct/10 border border-correct/30'
                      : 'bg-background border border-border'
                  }`}
                >
                  <span className="text-sm font-medium">{opt.text}</span>
                  <span className="text-xs text-text-muted">{results.distribution[i]} votes</span>
                </div>
              ))}
            </div>
          )}

          {!results && (
            <div className="w-full grid grid-cols-2 gap-3">
              {question.options.map((opt) => (
                <div
                  key={opt._id}
                  className="bg-background border border-border rounded-lg p-3"
                >
                  <span className="text-sm font-medium">{opt.text}</span>
                </div>
              ))}
            </div>
          )}

          {results && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => actions.nextQuestion(pin)}
              className="bg-primary hover:bg-primary-hover text-white font-semibold px-6 py-2.5 rounded-lg transition cursor-pointer"
            >
              {question.index + 1 >= question.total ? 'Show final results' : 'Next'}
            </motion.button>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center gap-8 pt-8"
    >
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-1">{quiz.title}</h1>
        <p className="text-text-muted text-sm">
          {quiz.questions.length} questions &middot; {quiz.isPublic ? 'Public' : 'Private'}
        </p>
      </div>

      {pin && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="bg-surface border border-border rounded-2xl px-8 py-4 text-center"
        >
          <span className="text-text-muted text-sm block mb-1">Game PIN</span>
          <span className="font-mono text-4xl font-extrabold text-accent tracking-widest">{pin}</span>
        </motion.div>
      )}

      <div className="w-full max-w-xl bg-surface border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Players</h2>
          <span className="text-sm text-text-muted">{gameState.players.length} joined</span>
        </div>

        {gameState.players.length === 0 ? (
          <p className="text-text-muted text-sm text-center py-4">Waiting for players to join...</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
            <AnimatePresence>
              {gameState.players.map((player, i) => (
                <motion.div
                  key={player.nickname}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-background border border-border rounded-lg px-3 py-2 text-center text-sm font-medium text-text"
                >
                  {player.nickname}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        <div className="flex items-center justify-between">
          <Link
            to="/dashboard"
            className="text-sm text-text-muted hover:text-wrong transition"
          >
            Cancel
          </Link>
          <motion.button
            onClick={() => actions.startGame(pin)}
            disabled={gameState.players.length === 0}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="bg-correct hover:brightness-110 disabled:opacity-40 text-background font-bold px-8 py-3 rounded-lg transition cursor-pointer text-lg"
          >
            Start game!
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default HostPage;
