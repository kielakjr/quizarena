import { useActionState, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';

const Landing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<'pin' | 'nickname'>('pin');
  const [pin, setPin] = useState('');

  const [, submitPin, pinPending] = useActionState(
    async (_prev: null, formData: FormData) => {
      const value = (formData.get('pin') as string).replace(/\D/g, '').slice(0, 6);
      if (value.length >= 4) {
        setPin(value);
        setStep('nickname');
      }
      return null;
    },
    null,
  );

  const [, submitNickname, nicknamePending] = useActionState(
    async (_prev: null, formData: FormData) => {
      const nickname = (formData.get('nickname') as string).trim();
      if (nickname) {
        navigate(`/lobby/${pin}?nickname=${encodeURIComponent(nickname)}`);
      }
      return null;
    },
    null,
  );

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4 gap-8">
      <div className="text-center">
        <h1 className="text-6xl font-extrabold mb-2">
          <span className="text-primary">Quiz</span>
          <span className="text-secondary">Arena</span>
        </h1>
      </div>

      <div className="w-full max-w-sm bg-surface border border-border rounded-2xl p-8 shadow-lg shadow-primary/10">
        {step === 'pin' ? (
          <form onSubmit={(e) => { e.preventDefault(); submitPin(new FormData(e.currentTarget)); }} className="flex flex-col gap-4">
            <input
              type="text"
              name="pin"
              inputMode="numeric"
              defaultValue={pin}
              onChange={(e) => e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6)}
              placeholder="Game PIN"
              autoFocus
              className="bg-background border border-border rounded-lg px-4 py-4 text-2xl text-center font-bold text-text placeholder:text-text-muted/40 tracking-[0.3em] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
            />
            <button
              type="submit"
              disabled={pinPending}
              className="bg-primary hover:bg-primary-hover disabled:opacity-40 text-white text-lg font-bold rounded-lg py-3 transition cursor-pointer"
            >
              Enter
            </button>
          </form>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); submitNickname(new FormData(e.currentTarget)); }} className="flex flex-col gap-4">
            <button
              type="button"
              onClick={() => setStep('pin')}
              className="self-start text-xs text-text-muted hover:text-text transition cursor-pointer"
            >
              &larr; Back
            </button>
            <input
              type="text"
              name="nickname"
              placeholder="Nickname"
              autoFocus
              maxLength={20}
              className="bg-background border border-border rounded-lg px-4 py-4 text-xl text-center font-semibold text-text placeholder:text-text-muted/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
            />
            <button
              type="submit"
              disabled={nicknamePending}
              className="bg-accent hover:brightness-110 disabled:opacity-40 text-background text-lg font-bold rounded-lg py-3 transition cursor-pointer"
            >
              Join game!
            </button>
          </form>
        )}
      </div>

      <div className="text-center text-sm text-text-muted">
        {user ? (
          <Link to="/dashboard" className="text-primary hover:underline">
            Go to your dashboard
          </Link>
        ) : (
          <>
            Want to host a quiz?{' '}
            <Link to="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </>
        )}
      </div>
    </main>
  );
};

export default Landing;
