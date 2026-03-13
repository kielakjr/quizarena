import { Link, Outlet, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';

const navLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/create', label: 'Create' },
];

const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-surface border-b border-border">
        <nav className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold">
            <span className="text-primary">Quiz</span>
            <span className="text-secondary">Arena</span>
          </Link>

          <div className="flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`text-sm font-medium transition ${
                  location.pathname === link.to
                    ? 'text-primary'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                {link.label}
              </Link>
            ))}

            <div className="flex items-center gap-3 ml-2 pl-4 border-l border-border">
              <span className="text-sm text-accent font-medium">{user?.username}</span>
              <button
                onClick={logout}
                className="text-xs text-text-muted hover:text-wrong transition cursor-pointer"
              >
                Sign out
              </button>
            </div>
          </div>
        </nav>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
