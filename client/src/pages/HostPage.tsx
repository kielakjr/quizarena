import { useState } from 'react';
import { useParams, Link } from 'react-router';

const mockPlayers = [
  { nickname: 'Alex', joinedAt: '0:12' },
  { nickname: 'Maya', joinedAt: '0:18' },
  { nickname: 'Sam', joinedAt: '0:25' },
  { nickname: 'Jordan', joinedAt: '0:31' },
];

const HostPage = () => {
  const { id } = useParams();
  const [started, setStarted] = useState(false);

  const pin = '384921';

  if (started) {
    return (
      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center justify-between w-full">
          <h1 className="text-xl font-bold">JavaScript Basics</h1>
          <span className="text-sm text-text-muted">Game #{id}</span>
        </div>

        <div className="w-full bg-surface border border-border rounded-xl p-8 flex flex-col items-center gap-6">
          <div className="text-center">
            <p className="text-text-muted text-sm mb-2">Question 1 of 10</p>
            <h2 className="text-xl font-semibold">Which keyword declares a block-scoped variable in JavaScript?</h2>
          </div>

          <div className="w-full grid grid-cols-2 gap-3">
            {['var', 'let', 'both', 'neither'].map((opt, i) => (
              <div
                key={i}
                className="bg-background border border-border rounded-lg p-3 flex items-center justify-between"
              >
                <span className="text-sm font-medium">{opt}</span>
                <span className="text-xs text-text-muted">{i === 1 ? '3' : i === 0 ? '1' : '0'} answers</span>
              </div>
            ))}
          </div>

          <button className="bg-primary hover:bg-primary-hover text-white font-semibold px-6 py-2.5 rounded-lg transition cursor-pointer">
            Next question
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8 pt-8">
      <div className="text-center">
        <p className="text-text-muted text-sm mb-2">Join at quizarena.com with Game PIN:</p>
        <div className="text-6xl font-extrabold text-accent tracking-[0.3em] font-mono">
          {pin}
        </div>
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
              className="bg-background border border-border rounded-lg px-3 py-2 text-center text-sm font-medium text-text animate-fade-in"
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
            disabled={mockPlayers.length < 1}
            className="bg-correct hover:brightness-110 disabled:opacity-40 text-background font-bold px-8 py-3 rounded-lg transition cursor-pointer text-lg"
          >
            Start game!
          </button>
        </div>
      </div>
    </div>
  );
};

export default HostPage;
