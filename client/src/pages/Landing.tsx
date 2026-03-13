import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';

const Landing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pin, setPin] = useState('');
  const [nickname, setNickname] = useState('');
  const [step, setStep] = useState<'pin' | 'nickname'>('pin');

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length >= 4) {
      setStep('nickname');
    }
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (nickname.trim()) {
      navigate(`/lobby/${pin}?nickname=${encodeURIComponent(nickname.trim())}`);
    }
  };

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
          <form onSubmit={handlePinSubmit} className="flex flex-col gap-4">
            <input
              type="text"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Game PIN"
              autoFocus
              className="bg-background border border-border rounded-lg px-4 py-4 text-2xl text-center font-bold text-text placeholder:text-text-muted/40 tracking-[0.3em] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
            />
            <button
              type="submit"
              disabled={pin.length < 4}
              className="bg-primary hover:bg-primary-hover disabled:opacity-40 text-white text-lg font-bold rounded-lg py-3 transition cursor-pointer"
            >
              Enter
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="flex flex-col gap-4">
            <button
              type="button"
              onClick={() => setStep('pin')}
              className="self-start text-xs text-text-muted hover:text-text transition cursor-pointer"
            >
              &larr; Back
            </button>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value.slice(0, 20))}
              placeholder="Nickname"
              autoFocus
              maxLength={20}
              className="bg-background border border-border rounded-lg px-4 py-4 text-xl text-center font-semibold text-text placeholder:text-text-muted/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
            />
            <button
              type="submit"
              disabled={!nickname.trim()}
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
