import { useEffect, useRef, useActionState, useState } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router';
import { useGameSocket } from '../hooks/useGameSocket';
import Avatar from '../components/Avatar';
import LivePlayPage from './LivePlayPage';

const LobbyPage = () => {
  const { pin } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialNickname = searchParams.get('nickname') ?? 'Player';
  const [nickname, setNickname] = useState(initialNickname);
  const { gameState, actions } = useGameSocket();
  const joined = useRef(false);

  useEffect(() => {
    if (pin && !joined.current) {
      joined.current = true;
      actions.joinAsPlayer(pin, initialNickname);
    }
  }, [pin, initialNickname, actions]);

  const isNicknameError = gameState.error?.toLowerCase().includes('nickname');

  const [, retryAction, retrying] = useActionState(
    async (_prev: null, formData: FormData) => {
      const newNickname = (formData.get('nickname') as string).trim();
      if (!newNickname || !pin) return null;
      actions.clearError();
      setNickname(newNickname);
      navigate(`/lobby/${pin}?nickname=${encodeURIComponent(newNickname)}`, { replace: true });
      actions.joinAsPlayer(pin, newNickname);
      return null;
    },
    null,
  );

  if (gameState.error && !isNicknameError) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen px-4 gap-4">
        <p className="text-wrong text-lg font-semibold">{gameState.error}</p>
        <Link to="/" className="text-primary hover:underline text-sm">Go home</Link>
      </main>
    );
  }

  if (isNicknameError) {
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

        <div className="w-full max-w-sm bg-surface border border-border rounded-2xl p-8 shadow-lg shadow-primary/10">
          <div className="bg-wrong/10 border border-wrong/30 text-wrong rounded-lg px-4 py-3 mb-6 text-sm">
            {gameState.error}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); retryAction(new FormData(e.currentTarget)); }} className="flex flex-col gap-4">
            <input
              type="text"
              name="nickname"
              placeholder="Choose a different nickname"
              autoFocus
              maxLength={20}
              defaultValue=""
              className="bg-background border border-border rounded-lg px-4 py-4 text-xl text-center font-semibold text-text placeholder:text-text-muted/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
            />
            <button
              type="submit"
              disabled={retrying}
              className="bg-accent hover:brightness-110 disabled:opacity-40 text-background text-lg font-bold rounded-lg py-3 transition cursor-pointer"
            >
              {retrying ? 'Joining...' : 'Try again'}
            </button>
          </form>

          <Link
            to="/"
            className="block text-center text-xs text-text-muted hover:text-wrong transition mt-4"
          >
            Leave game
          </Link>
        </div>
      </main>
    );
  }

  if (gameState.phase !== 'connecting' && gameState.phase !== 'lobby') {
    return (
      <LivePlayPage
        pin={pin!}
        nickname={nickname}
        gameState={gameState}
        actions={actions}
      />
    );
  }

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
            <span className="text-xs text-text-muted">{gameState.players.length} joined</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {gameState.players.map((player) => (
              <div
                key={player.nickname}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                  player.nickname === nickname
                    ? 'bg-primary/15 text-primary border border-primary/30'
                    : 'bg-background border border-border text-text-muted'
                }`}
              >
                <Avatar nickname={player.nickname} size="sm" />
                {player.nickname}
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
