import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api, { imageUrl } from '../api/axios';
import type { QuizSummary } from '../types/quiz';

const DashboardPage = () => {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

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
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <motion.section
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
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
      </motion.section>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Quizzes created', value: String(quizzes.length), color: 'text-primary' },
          { label: 'Total plays', value: String(quizzes.reduce((sum, q) => sum + q.timesPlayed, 0)), color: 'text-secondary' },
          { label: 'Public quizzes', value: String(quizzes.filter((q) => q.isPublic).length), color: 'text-accent' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-1"
          >
            <span className="text-text-muted text-sm">{stat.label}</span>
            <span className={`text-3xl font-bold ${stat.color}`}>{stat.value}</span>
          </motion.div>
        ))}
      </section>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-wrong/10 border border-wrong/30 text-wrong rounded-lg px-4 py-3 text-sm"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <section>
        <h2 className="text-lg font-semibold mb-4">Your quizzes</h2>

        {loading ? (
          <p className="text-text-muted animate-pulse">Loading quizzes...</p>
        ) : quizzes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-surface border border-border rounded-xl p-8 text-center"
          >
            <p className="text-text-muted mb-3">You haven't created any quizzes yet.</p>
            <Link
              to="/create"
              className="text-primary hover:underline text-sm font-medium"
            >
              Create your first quiz
            </Link>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-3">
            <AnimatePresence mode="popLayout">
              {quizzes.map((quiz, i) => (
                <motion.div
                  key={quiz._id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100, transition: { duration: 0.2 } }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-surface border border-border rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {quiz.coverImage ? (
                      <img
                        src={imageUrl(quiz.coverImage)}
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
                      onClick={() => setDeleteId(quiz._id)}
                      className="text-sm border border-border text-text-muted hover:text-wrong hover:border-wrong/50 px-3 py-1.5 rounded-lg transition cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      <AnimatePresence>
        {deleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4"
            onClick={() => setDeleteId(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-surface border border-border rounded-xl p-6 max-w-sm w-full flex flex-col gap-4 shadow-xl"
            >
              <h3 className="text-lg font-semibold">Delete quiz?</h3>
              <p className="text-text-muted text-sm">This action cannot be undone. The quiz and all its data will be permanently removed.</p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteId(null)}
                  className="text-sm border border-border text-text-muted hover:text-text px-4 py-2 rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteId)}
                  className="text-sm bg-wrong hover:brightness-110 text-white font-semibold px-4 py-2 rounded-lg transition cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DashboardPage;
