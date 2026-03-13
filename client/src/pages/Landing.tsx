import { Link } from 'react-router';
import { useAuth } from '../context/AuthContext';

const Landing = () => {
  const { user, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <p className="text-text-muted animate-pulse">Loading...</p>
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4 gap-6">
      <div className="text-center">
        <h1 className="text-5xl font-extrabold mb-3">
          <span className="text-primary">Quiz</span>
          <span className="text-secondary">Arena</span>
        </h1>
        <p className="text-text-muted text-lg">Test your knowledge. Compete with friends.</p>
      </div>

      {user ? (
        <div className="flex flex-col items-center gap-4 bg-surface border border-border rounded-2xl p-8 w-full max-w-sm shadow-lg shadow-primary/10">
          <p className="text-lg">
            Hey, <span className="text-accent font-semibold">{user.username}</span>
          </p>
          <Link
            to="/quiz"
            className="w-full text-center bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg py-2.5 transition"
          >
            Play now
          </Link>
          <button
            onClick={logout}
            className="text-text-muted hover:text-wrong text-sm transition cursor-pointer"
          >
            Sign out
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 w-full max-w-sm">
          <Link
            to="/login"
            className="w-full text-center bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg py-2.5 transition"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="w-full text-center border border-border hover:border-primary text-text font-semibold rounded-lg py-2.5 transition"
          >
            Create account
          </Link>
        </div>
      )}
    </main>
  );
};

export default Landing;
