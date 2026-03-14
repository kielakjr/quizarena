import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import api from '../api/axios';
import type { Quiz } from '../types/quiz';

const mockPlayers = [
  { nickname: 'Alex' },
  { nickname: 'Maya' },
  { nickname: 'Sam' },
  { nickname: 'Jordan' },
];

const HostPage = () => {
  const { id } = useParams();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);

  useEffect(() => {
    api.get(`/quizzes/${id}`)
      .then((res) => setQuiz(res.data.quiz))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

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

  if (started) {
    const question = quiz.questions[currentQ];
    const isLast = currentQ + 1 >= quiz.questions.length;

    return (
      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center justify-between w-full">
          <h1 className="text-xl font-bold">{quiz.title}</h1>
          <span className="text-sm text-text-muted">
            Question {currentQ + 1} of {quiz.questions.length}
          </span>
        </div>

        <div className="w-full bg-surface border border-border rounded-xl p-8 flex flex-col items-center gap-6">
          <div className="text-center">
            <p className="text-text-muted text-xs mb-1">{question.timeLimit}s &middot; {question.points} pts</p>
            <h2 className="text-xl font-semibold">{question.text}</h2>
          </div>

          <div className="w-full grid grid-cols-2 gap-3">
            {question.options.map((opt) => (
              <div
                key={opt._id}
                className={`rounded-lg p-3 flex items-center justify-between ${
                  opt.isCorrect
                    ? 'bg-correct/10 border border-correct/30'
                    : 'bg-background border border-border'
                }`}
              >
                <span className="text-sm font-medium">{opt.text}</span>
                {opt.isCorrect && (
                  <span className="text-xs text-correct font-semibold">Correct</span>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              if (isLast) {
                setStarted(false);
                setCurrentQ(0);
              } else {
                setCurrentQ((c) => c + 1);
              }
            }}
            className="bg-primary hover:bg-primary-hover text-white font-semibold px-6 py-2.5 rounded-lg transition cursor-pointer"
          >
            {isLast ? 'End game' : 'Next question'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8 pt-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-1">{quiz.title}</h1>
        <p className="text-text-muted text-sm">
          {quiz.questions.length} questions &middot; {quiz.isPublic ? 'Public' : 'Private'}
        </p>
      </div>

      <div className="w-full max-w-xl bg-surface border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Players</h2>
          <span className="text-sm text-text-muted">{mockPlayers.length} joined</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
          {mockPlayers.map((player, i) => (
            <div
              key={i}
              className="bg-background border border-border rounded-lg px-3 py-2 text-center text-sm font-medium text-text"
            >
              {player.nickname}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <Link
            to="/dashboard"
            className="text-sm text-text-muted hover:text-wrong transition"
          >
            Cancel
          </Link>
          <button
            onClick={() => setStarted(true)}
            className="bg-correct hover:brightness-110 text-background font-bold px-8 py-3 rounded-lg transition cursor-pointer text-lg"
          >
            Start game!
          </button>
        </div>
      </div>
    </div>
  );
};

export default HostPage;
