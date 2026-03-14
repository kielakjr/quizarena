import { useState, useEffect, useActionState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import api from '../api/axios';
import type { Option } from '../types/quiz';

interface QuestionForm {
  id: number;
  text: string;
  options: Option[];
  timeLimit: number;
  points: number;
}

const emptyQuestion = (id: number): QuestionForm => ({
  id,
  text: '',
  options: [
    { text: '', isCorrect: true },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ],
  timeLimit: 20,
  points: 1000,
});

const EditQuizPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState<QuestionForm[]>([]);
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [defaultTitle, setDefaultTitle] = useState('');
  const [defaultDescription, setDefaultDescription] = useState('');

  useEffect(() => {
    api.get(`/quizzes/${id}`)
      .then((res) => {
        const quiz = res.data.quiz;
        setDefaultTitle(quiz.title);
        setDefaultDescription(quiz.description ?? '');
        setIsPublic(quiz.isPublic);
        setQuestions(
          quiz.questions.map((q: { text: string; options: Option[]; timeLimit: number; points: number }, i: number) => ({
            id: i + 1,
            text: q.text,
            options: q.options.map((o: Option) => ({ text: o.text, isCorrect: o.isCorrect })),
            timeLimit: q.timeLimit,
            points: q.points,
          })),
        );
      })
      .catch(() => setFetchError('Failed to load quiz'))
      .finally(() => setLoading(false));
  }, [id]);

  const [error, submitAction, isPending] = useActionState<string | null, FormData>(
    async (_prev, formData) => {
      const title = formData.get('title') as string;
      const description = formData.get('description') as string;

      const payload = {
        title,
        description,
        isPublic,
        questions: questions.map((q) => ({
          text: q.text,
          options: q.options,
          timeLimit: q.timeLimit,
          points: q.points,
        })),
      };

      try {
        await api.put(`/quizzes/${id}`, payload);
        navigate('/dashboard');
        return null;
      } catch (err: unknown) {
        if (err && typeof err === 'object' && 'response' in err) {
          const axiosErr = err as { response?: { data?: { message?: string; errors?: { message: string }[] } } };
          return axiosErr.response?.data?.errors?.[0]?.message ?? axiosErr.response?.data?.message ?? 'Failed to update quiz';
        }
        return 'Something went wrong';
      }
    },
    null,
  );

  const addQuestion = () => {
    setQuestions((prev) => [...prev, emptyQuestion(prev.length + 1)]);
  };

  const removeQuestion = (qid: number) => {
    if (questions.length <= 1) return;
    setQuestions((prev) => prev.filter((q) => q.id !== qid));
  };

  const updateQuestion = (qid: number, field: string, value: string | number) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === qid ? { ...q, [field]: value } : q)),
    );
  };

  const updateOptionText = (questionId: number, optionIndex: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? { ...q, options: q.options.map((o, i) => (i === optionIndex ? { ...o, text: value } : o)) }
          : q,
      ),
    );
  };

  const setCorrectAnswer = (questionId: number, optionIndex: number) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? { ...q, options: q.options.map((o, i) => ({ ...o, isCorrect: i === optionIndex })) }
          : q,
      ),
    );
  };

  const inputClass =
    'bg-background border border-border rounded-lg px-4 py-2.5 text-text placeholder:text-text-muted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition w-full';

  if (loading) {
    return <p className="text-text-muted animate-pulse">Loading quiz...</p>;
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center gap-4 pt-16">
        <p className="text-wrong">{fetchError}</p>
        <Link to="/dashboard" className="text-primary hover:underline text-sm">Back to dashboard</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Edit quiz</h1>
        <Link to="/dashboard" className="text-sm text-text-muted hover:text-text transition">
          Cancel
        </Link>
      </div>

      {error && (
        <div className="bg-wrong/10 border border-wrong/30 text-wrong rounded-lg px-4 py-3 mb-6 text-sm">
          {error}
        </div>
      )}

      <form action={submitAction} className="flex flex-col gap-6">
        <div className="bg-surface border border-border rounded-xl p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="title" className="text-sm text-text-muted">Title</label>
            <input
              id="title"
              name="title"
              type="text"
              required
              maxLength={100}
              defaultValue={defaultTitle}
              placeholder="e.g. JavaScript Fundamentals"
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="description" className="text-sm text-text-muted">Description</label>
            <textarea
              id="description"
              name="description"
              maxLength={500}
              defaultValue={defaultDescription}
              placeholder="What is this quiz about?"
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="accent-primary w-4 h-4"
            />
            <span className="text-sm text-text-muted">Public quiz (visible to everyone)</span>
          </label>
        </div>

        <div className="flex flex-col gap-4">
          {questions.map((q, qi) => (
            <div
              key={q.id}
              className="bg-surface border border-border rounded-xl p-6 flex flex-col gap-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-primary">Question {qi + 1}</span>
                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQuestion(q.id)}
                    className="text-xs text-text-muted hover:text-wrong transition cursor-pointer"
                  >
                    Remove
                  </button>
                )}
              </div>

              <input
                type="text"
                required
                value={q.text}
                onChange={(e) => updateQuestion(q.id, 'text', e.target.value)}
                placeholder="Enter your question"
                className={inputClass}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {q.options.map((option, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCorrectAnswer(q.id, oi)}
                      className={`shrink-0 w-5 h-5 rounded-full border-2 transition cursor-pointer ${
                        option.isCorrect
                          ? 'border-correct bg-correct/20'
                          : 'border-border hover:border-text-muted'
                      }`}
                      title="Mark as correct answer"
                    />
                    <input
                      type="text"
                      required
                      value={option.text}
                      onChange={(e) => updateOptionText(q.id, oi, e.target.value)}
                      placeholder={`Option ${oi + 1}`}
                      className={inputClass}
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-xs text-text-muted">Time limit (s)</label>
                  <input
                    type="number"
                    min={5}
                    max={60}
                    value={q.timeLimit}
                    onChange={(e) => updateQuestion(q.id, 'timeLimit', Number(e.target.value))}
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-xs text-text-muted">Points</label>
                  <input
                    type="number"
                    min={100}
                    max={2000}
                    step={100}
                    value={q.points}
                    onChange={(e) => updateQuestion(q.id, 'points', Number(e.target.value))}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addQuestion}
          className="border border-dashed border-border hover:border-primary text-text-muted hover:text-primary py-3 rounded-xl transition cursor-pointer"
        >
          + Add question
        </button>

        <div className="flex items-center justify-between pt-2">
          <span className="text-sm text-text-muted">
            {questions.length} question{questions.length !== 1 && 's'}
          </span>
          <button
            type="submit"
            disabled={isPending}
            className="bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-lg transition cursor-pointer"
          >
            {isPending ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditQuizPage;
