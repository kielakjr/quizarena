import { useParams, useSearchParams, Link } from 'react-router';

const mockPlayers = ['You', 'Alex', 'Maya', 'Sam'];

const LobbyPage = () => {
  const { pin } = useParams();
  const [searchParams] = useSearchParams();
  const nickname = searchParams.get('nickname') ?? 'Player';

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4 gap-6">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold mb-1">
          <span className="text-primary">Quiz</span>
          <span className="text-secondary">Arena</span>
        </h1>
        <div className="flex items-center justify-center gap-2 mt-3">
          <span className="text-text-muted text-sm">Game PIN:</span>
          <span className="font-mono text-lg font-bold text-accent tracking-widest">{pin}</span>
        </div>
      </div>

      <div className="w-full max-w-md bg-surface border border-border rounded-2xl p-8 shadow-lg shadow-primary/10 flex flex-col items-center gap-6">
        <p className="text-text-muted text-sm">
          You joined as <span className="text-accent font-semibold">{nickname}</span>
        </p>

        <div className="w-full">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-text-muted">Players</span>
            <span className="text-xs text-text-muted">{mockPlayers.length} joined</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {mockPlayers.map((player, i) => (
              <div
                key={i}
                className={`rounded-lg px-3 py-2 text-sm font-medium text-center ${
                  player === 'You'
                    ? 'bg-primary/15 text-primary border border-primary/30'
                    : 'bg-background border border-border text-text-muted'
                }`}
              >
                {player === 'You' ? nickname : player}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <p className="text-text-muted text-sm">Waiting for host to start...</p>
        </div>

        <Link
          to="/"
          className="text-xs text-text-muted hover:text-wrong transition"
        >
          Leave game
        </Link>
      </div>
    </main>
  );
};

export default LobbyPage;
