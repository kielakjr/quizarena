import { useState, useActionState } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import type { Option } from '../types/quiz';

interface QuestionForm {
  id: number;
  text: string;
  options: Option[];
  timeLimit: number;
  points: number;
  image: File | null;
}

interface FormState {
  error: string | null;
  createdId: string | null;
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
});

const CreateQuizPage = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<QuestionForm[]>([emptyQuestion(1)]);
  const [isPublic, setIsPublic] = useState(true);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const [state, submitAction, isPending] = useActionState<FormState, FormData>(
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
        const res = await api.post('/quizzes', data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return { error: null, createdId: res.data.quiz._id };
      } catch (err: unknown) {
        if (err && typeof err === 'object' && 'response' in err) {
          const axiosErr = err as { response?: { data?: { message?: string; errors?: string[] } } };
          const msg = axiosErr.response?.data?.errors?.[0] ?? axiosErr.response?.data?.message ?? 'Failed to create quiz';
          return { error: msg, createdId: null };
        }
        return { error: 'Something went wrong', createdId: null };
      }
    },
    { error: null, createdId: null },
  );

  const addQuestion = () => {
    setQuestions((prev) => [...prev, emptyQuestion(prev.length + 1)]);
  };

  const removeQuestion = (id: number) => {
    if (questions.length <= 1) return;
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const updateQuestion = (id: number, field: string, value: string | number) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, [field]: value } : q)),
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
    if (file) {
      setCoverPreview(URL.createObjectURL(file));
    } else {
      setCoverPreview(null);
    }
  };

  const handleQuestionImage = (questionId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, image: file } : q)),
    );
  };

  const inputClass =
    'bg-background border border-border rounded-lg px-4 py-2.5 text-text placeholder:text-text-muted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition w-full';

  if (state.createdId) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto flex flex-col items-center gap-6 pt-16"
      >
        <div className="bg-surface border border-border rounded-2xl p-8 w-full flex flex-col items-center gap-5 shadow-lg shadow-primary/10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="w-12 h-12 bg-correct/15 text-correct rounded-full flex items-center justify-center text-2xl"
          >
            &#10003;
          </motion.div>
          <h1 className="text-2xl font-bold">Quiz created!</h1>
          <p className="text-text-muted text-sm text-center">
            Your quiz is ready. Share it with players or start hosting.
          </p>
          <div className="flex gap-3 w-full mt-2">
            <Link
              to="/dashboard"
              className="flex-1 text-center border border-border hover:border-primary text-text text-sm font-semibold py-2.5 rounded-lg transition"
            >
              Dashboard
            </Link>
            <button
              onClick={() => navigate(`/host/${state.createdId}`)}
              className="flex-1 bg-primary hover:bg-primary-hover text-white text-sm font-semibold py-2.5 rounded-lg transition cursor-pointer"
            >
              Host game
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold mb-6"
      >
        Create a quiz
      </motion.h1>

      <AnimatePresence>
        {state.error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-wrong/10 border border-wrong/30 text-wrong rounded-lg px-4 py-3 mb-6 text-sm"
          >
            {state.error}
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
              <label className="flex items-center gap-2 text-sm text-primary hover:text-primary-hover cursor-pointer transition">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleCoverImage}
                  className="hidden"
                />
                <span className="border border-border hover:border-primary rounded-lg px-3 py-1.5 text-text-muted hover:text-primary transition">
                  {coverImage ? 'Change image' : 'Upload image'}
                </span>
              </label>
              {coverImage && (
                <button
                  type="button"
                  onClick={() => { setCoverImage(null); setCoverPreview(null); }}
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
            {questions.map((q, qi) => (
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
                    {q.image && (
                      <motion.img
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        src={URL.createObjectURL(q.image)}
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
                      {q.image ? 'Change image' : 'Add image'}
                    </span>
                  </label>
                  {q.image && (
                    <button
                      type="button"
                      onClick={() => setQuestions((prev) => prev.map((qq) => (qq.id === q.id ? { ...qq, image: null } : qq)))}
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
            ))}
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
            {isPending ? 'Publishing...' : 'Publish quiz'}
          </motion.button>
        </div>
      </form>
    </div>
  );
};

export default CreateQuizPage;
