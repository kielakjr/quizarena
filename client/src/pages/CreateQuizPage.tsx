import { useState } from 'react';
import { Link } from 'react-router';

interface Question {
  id: number;
  text: string;
  options: string[];
  correctIndex: number;
}

const emptyQuestion = (id: number): Question => ({
  id,
  text: '',
  options: ['', '', '', ''],
  correctIndex: 0,
});

const CreateQuizPage = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<Question[]>([emptyQuestion(1)]);
  const [published, setPublished] = useState(false);

  const addQuestion = () => {
    setQuestions((prev) => [...prev, emptyQuestion(prev.length + 1)]);
  };

  const removeQuestion = (id: number) => {
    if (questions.length <= 1) return;
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const updateQuestion = (id: number, field: string, value: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, [field]: value } : q)),
    );
  };

  const updateOption = (questionId: number, optionIndex: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? { ...q, options: q.options.map((o, i) => (i === optionIndex ? value : o)) }
          : q,
      ),
    );
  };

  const setCorrectAnswer = (questionId: number, optionIndex: number) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, correctIndex: optionIndex } : q)),
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ title, description, questions });
    setPublished(true);
  };

  const inputClass =
    'bg-background border border-border rounded-lg px-4 py-2.5 text-text placeholder:text-text-muted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition w-full';

  if (published) {
    const mockPin = String(Math.floor(100000 + Math.random() * 900000));
    return (
      <div className="max-w-md mx-auto flex flex-col items-center gap-6 pt-16">
        <div className="bg-surface border border-border rounded-2xl p-8 w-full flex flex-col items-center gap-5 shadow-lg shadow-primary/10">
          <div className="w-12 h-12 bg-correct/15 text-correct rounded-full flex items-center justify-center text-2xl">
            &#10003;
          </div>
          <h1 className="text-2xl font-bold">Quiz created!</h1>
          <p className="text-text-muted text-sm text-center">
            Share this Game PIN with your players:
          </p>
          <div className="text-5xl font-extrabold text-accent tracking-[0.3em] font-mono">
            {mockPin}
          </div>
          <div className="flex gap-3 w-full mt-2">
            <Link
              to="/dashboard"
              className="flex-1 text-center border border-border hover:border-primary text-text text-sm font-semibold py-2.5 rounded-lg transition"
            >
              Dashboard
            </Link>
            <Link
              to={`/host/new`}
              className="flex-1 text-center bg-primary hover:bg-primary-hover text-white text-sm font-semibold py-2.5 rounded-lg transition"
            >
              Start game
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create a quiz</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="bg-surface border border-border rounded-xl p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="title" className="text-sm text-text-muted">Title</label>
            <input
              id="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. JavaScript Fundamentals"
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="description" className="text-sm text-text-muted">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this quiz about?"
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>
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
                        q.correctIndex === oi
                          ? 'border-correct bg-correct/20'
                          : 'border-border hover:border-text-muted'
                      }`}
                      title="Mark as correct answer"
                    />
                    <input
                      type="text"
                      required
                      value={option}
                      onChange={(e) => updateOption(q.id, oi, e.target.value)}
                      placeholder={`Option ${oi + 1}`}
                      className={inputClass}
                    />
                  </div>
                ))}
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
            className="bg-primary hover:bg-primary-hover text-white font-semibold px-6 py-2.5 rounded-lg transition cursor-pointer"
          >
            Publish quiz
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateQuizPage;
