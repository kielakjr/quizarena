import { useState, useEffect, useActionState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import api, { imageUrl } from '../api/axios';
import type { Option } from '../types/quiz';

interface QuestionForm {
  id: number;
  text: string;
  options: Option[];
  timeLimit: number;
  points: number;
  image: File | null;
  existingImageUrl: string | null;
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
  image: null,
  existingImageUrl: null,
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
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [existingCoverImage, setExistingCoverImage] = useState<string | null>(null);

  useEffect(() => {
    api.get(`/quizzes/${id}`)
      .then((res) => {
        const quiz = res.data.quiz;
        setDefaultTitle(quiz.title);
        setDefaultDescription(quiz.description ?? '');
        setIsPublic(quiz.isPublic);
        if (quiz.coverImage) {
          setExistingCoverImage(quiz.coverImage);
          setCoverPreview(imageUrl(quiz.coverImage));
        }
        setQuestions(
          quiz.questions.map((q: { text: string; imageUrl?: string; options: Option[]; timeLimit: number; points: number }, i: number) => ({
            id: i + 1,
            text: q.text,
            options: q.options.map((o: Option) => ({ text: o.text, isCorrect: o.isCorrect })),
            timeLimit: q.timeLimit,
            points: q.points,
            image: null,
            existingImageUrl: q.imageUrl || null,
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

      const data = new FormData();
      data.append('title', title);
      data.append('description', description);
      data.append('isPublic', String(isPublic));
      data.append(
        'questions',
        JSON.stringify(
          questions.map((q) => ({
            text: q.text,
            options: q.options,
            timeLimit: q.timeLimit,
            points: q.points,
            imageUrl: q.existingImageUrl || undefined,
          })),
        ),
      );

      if (coverImage) {
        data.append('coverImage', coverImage);
      }

      const questionImageMap: Record<string, number> = {};
      let fileIndex = 0;
      for (let i = 0; i < questions.length; i++) {
        if (questions[i].image) {
          data.append('questionImages', questions[i].image!);
          questionImageMap[String(fileIndex)] = i;
          fileIndex++;
        }
      }
      if (fileIndex > 0) {
        data.append('questionImageMap', JSON.stringify(questionImageMap));
      }

      try {
        await api.put(`/quizzes/${id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        navigate('/dashboard');
        return null;
      } catch (err: unknown) {
        if (err && typeof err === 'object' && 'response' in err) {
          const axiosErr = err as { response?: { data?: { message?: string; errors?: string[] } } };
          return axiosErr.response?.data?.errors?.[0] ?? axiosErr.response?.data?.message ?? 'Failed to update quiz';
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

  const handleCoverImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setCoverImage(file);
    setExistingCoverImage(null);
    if (file) {
      setCoverPreview(URL.createObjectURL(file));
    } else {
      setCoverPreview(null);
    }
  };

  const handleQuestionImage = (questionId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, image: file, existingImageUrl: null } : q)),
    );
  };

  const getQuestionImagePreview = (q: QuestionForm): string | null => {
    if (q.image) return URL.createObjectURL(q.image);
    if (q.existingImageUrl) return imageUrl(q.existingImageUrl);
    return null;
  };

  const inputClass =
    'bg-background border border-border rounded-lg px-4 py-2.5 text-text placeholder:text-text-muted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition w-full';

  if (loading) {
    return <p className="text-text-muted animate-pulse">Loading quiz...</p>;
  }

  if (fetchError) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center gap-4 pt-16"
      >
        <p className="text-wrong">{fetchError}</p>
        <Link to="/dashboard" className="text-primary hover:underline text-sm">Back to dashboard</Link>
      </motion.div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <h1 className="text-2xl font-bold">Edit quiz</h1>
        <Link to="/dashboard" className="text-sm text-text-muted hover:text-text transition">
          Cancel
        </Link>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-wrong/10 border border-wrong/30 text-wrong rounded-lg px-4 py-3 mb-6 text-sm"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <form action={submitAction} className="flex flex-col gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface border border-border rounded-xl p-6 flex flex-col gap-4"
        >
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

          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-text-muted">Cover image</label>
            <div className="flex items-center gap-4">
              <AnimatePresence>
                {coverPreview && (
                  <motion.img
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    src={coverPreview}
                    alt="Cover preview"
                    className="w-20 h-20 object-cover rounded-lg border border-border"
                  />
                )}
              </AnimatePresence>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleCoverImage}
                  className="hidden"
                />
                <span className="text-sm border border-border hover:border-primary rounded-lg px-3 py-1.5 text-text-muted hover:text-primary transition">
                  {coverPreview ? 'Change image' : 'Upload image'}
                </span>
              </label>
              {coverPreview && (
                <button
                  type="button"
                  onClick={() => { setCoverImage(null); setCoverPreview(null); setExistingCoverImage(null); }}
                  className="text-xs text-text-muted hover:text-wrong transition cursor-pointer"
                >
                  Remove
                </button>
              )}
            </div>
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
        </motion.div>

        <div className="flex flex-col gap-4">
          <AnimatePresence mode="popLayout">
            {questions.map((q, qi) => {
              const imgPreview = getQuestionImagePreview(q);
              return (
                <motion.div
                  key={q.id}
                  layout
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100, transition: { duration: 0.2 } }}
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

                  <div className="flex items-center gap-3">
                    <AnimatePresence>
                      {imgPreview && (
                        <motion.img
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          src={imgPreview}
                          alt="Question image"
                          className="w-16 h-16 object-cover rounded-lg border border-border"
                        />
                      )}
                    </AnimatePresence>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={(e) => handleQuestionImage(q.id, e)}
                        className="hidden"
                      />
                      <span className="text-xs border border-border hover:border-primary rounded-lg px-2.5 py-1 text-text-muted hover:text-primary transition">
                        {imgPreview ? 'Change image' : 'Add image'}
                      </span>
                    </label>
                    {imgPreview && (
                      <button
                        type="button"
                        onClick={() => setQuestions((prev) => prev.map((qq) => (qq.id === q.id ? { ...qq, image: null, existingImageUrl: null } : qq)))}
                        className="text-xs text-text-muted hover:text-wrong transition cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>

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
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        <motion.button
          type="button"
          onClick={addQuestion}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="border border-dashed border-border hover:border-primary text-text-muted hover:text-primary py-3 rounded-xl transition cursor-pointer"
        >
          + Add question
        </motion.button>

        <div className="flex items-center justify-between pt-2">
          <span className="text-sm text-text-muted">
            {questions.length} question{questions.length !== 1 && 's'}
          </span>
          <motion.button
            type="submit"
            disabled={isPending}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-lg transition cursor-pointer"
          >
            {isPending ? 'Saving...' : 'Save changes'}
          </motion.button>
        </div>
      </form>
    </div>
  );
};

export default EditQuizPage;
