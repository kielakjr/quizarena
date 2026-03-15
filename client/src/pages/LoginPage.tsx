import { useActionState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';

interface FormState {
  error: string | null;
  email: string;
  password: string;
}

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [state, submitAction, isPending] = useActionState<FormState, FormData>(
    async (_prev, formData) => {
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;

      try {
        await login(email, password);
        navigate('/');
        return { error: null, email: '', password: '' };
      } catch (err: unknown) {
        let message = 'Something went wrong';
        if (err && typeof err === 'object' && 'response' in err) {
          const axiosErr = err as { response?: { data?: { message?: string } } };
          message = axiosErr.response?.data?.message ?? 'Login failed';
        }
        return { error: message, email, password };
      }
    },
    { error: null, email: '', password: '' },
  );

  return (
    <main className="flex items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-md bg-surface border border-border rounded-2xl p-8 shadow-lg shadow-primary/10">
        <h1 className="text-3xl font-bold text-center mb-2">Welcome back</h1>
        <p className="text-text-muted text-center mb-8">Sign in to continue your quiz journey</p>

        {state.error && (
          <div className="bg-wrong/10 border border-wrong/30 text-wrong rounded-lg px-4 py-3 mb-6 text-sm">
            {state.error}
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); submitAction(new FormData(e.currentTarget)); }} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm text-text-muted">Email</label>
            <input
              key={`email-${state.email}`}
              id="email"
              name="email"
              type="email"
              required
              defaultValue={state.email}
              placeholder="you@example.com"
              className="bg-background border border-border rounded-lg px-4 py-2.5 text-text placeholder:text-text-muted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm text-text-muted">Password</label>
            <input
              key={`password-${state.password}`}
              id="password"
              name="password"
              type="password"
              required
              defaultValue={state.password}
              placeholder="Enter your password"
              className="bg-background border border-border rounded-lg px-4 py-2.5 text-text placeholder:text-text-muted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-semibold rounded-lg py-2.5 transition cursor-pointer"
          >
            {isPending ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="text-text-muted text-sm text-center mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-secondary hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
};

export default LoginPage;
