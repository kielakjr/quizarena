import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import type { QuizSummary } from '../types/quiz';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5003';

const DashboardPage = () => {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/quizzes')
      .then((res) => setQuizzes(res.data.quizzes))
      .catch(() => setError('Failed to load quizzes'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/quizzes/${id}`);
      setQuizzes((prev) => prev.filter((q) => q._id !== id));
    } catch {
      setError('Failed to delete quiz');
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome back, <span className="text-accent">{user?.username}</span>
          </h1>
          <p className="text-text-muted mt-1">Manage your quizzes and host games</p>
        </div>
        <Link
          to="/create"
          className="bg-primary hover:bg-primary-hover text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
        >
          + Create quiz
        </Link>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Quizzes created', value: String(quizzes.length), color: 'text-primary' },
          { label: 'Total plays', value: String(quizzes.reduce((sum, q) => sum + q.timesPlayed, 0)), color: 'text-secondary' },
          { label: 'Public quizzes', value: String(quizzes.filter((q) => q.isPublic).length), color: 'text-accent' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-1"
          >
            <span className="text-text-muted text-sm">{stat.label}</span>
            <span className={`text-3xl font-bold ${stat.color}`}>{stat.value}</span>
          </div>
        ))}
      </section>

      {error && (
        <div className="bg-wrong/10 border border-wrong/30 text-wrong rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-4">Your quizzes</h2>

        {loading ? (
          <p className="text-text-muted animate-pulse">Loading quizzes...</p>
        ) : quizzes.length === 0 ? (
          <div className="bg-surface border border-border rounded-xl p-8 text-center">
            <p className="text-text-muted mb-3">You haven't created any quizzes yet.</p>
            <Link
              to="/create"
              className="text-primary hover:underline text-sm font-medium"
            >
              Create your first quiz
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {quizzes.map((quiz) => (
              <div
                key={quiz._id}
                className="bg-surface border border-border rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-primary/50 transition"
              >
                <div className="flex items-start gap-4">
                  {quiz.coverImage ? (
                    <img
                      src={`${API_URL}${quiz.coverImage}`}
                      alt={quiz.title}
                      className="w-14 h-14 object-cover rounded-lg border border-border shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 bg-background border border-border rounded-lg flex items-center justify-center shrink-0">
                      <span className="text-text-muted text-lg">?</span>
                    </div>
                  )}
                  <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{quiz.title}</h3>
                    {quiz.isPublic ? (
                      <span className="text-[10px] bg-correct/15 text-correct font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">Public</span>
                    ) : (
                      <span className="text-[10px] bg-text-muted/15 text-text-muted font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">Private</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-text-muted">
                    {quiz.description && <span>{quiz.description}</span>}
                    <span>{quiz.timesPlayed} plays</span>
                  </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    to={`/host/${quiz._id}`}
                    className="text-sm bg-primary hover:bg-primary-hover text-white font-semibold px-4 py-1.5 rounded-lg transition"
                  >
                    Host
                  </Link>
                  <Link
                    to={`/edit/${quiz._id}`}
                    className="text-sm border border-border text-text-muted hover:text-text hover:border-primary/50 px-3 py-1.5 rounded-lg transition"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(quiz._id)}
                    className="text-sm border border-border text-text-muted hover:text-wrong hover:border-wrong/50 px-3 py-1.5 rounded-lg transition cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default DashboardPage;
