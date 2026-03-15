import { useActionState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';

interface FormState {
  error: string | null;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [state, submitAction, isPending] = useActionState<FormState, FormData>(
    async (_prev, formData) => {
      const username = formData.get('username') as string;
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;
      const confirmPassword = formData.get('confirmPassword') as string;

      if (password !== confirmPassword) {
        return { error: 'Passwords do not match', username, email, password, confirmPassword };
      }

      try {
        await register(username, email, password);
        navigate('/');
        return { error: null, username: '', email: '', password: '', confirmPassword: '' };
      } catch (err: unknown) {
        let message = 'Something went wrong';
        if (err && typeof err === 'object' && 'response' in err) {
          const axiosErr = err as { response?: { data?: { message?: string } } };
          message = axiosErr.response?.data?.message ?? 'Registration failed';
        }
        return { error: message, username, email, password, confirmPassword };
      }
    },
    { error: null, username: '', email: '', password: '', confirmPassword: '' },
  );

  return (
    <main className="flex items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-md bg-surface border border-border rounded-2xl p-8 shadow-lg shadow-primary/10">
        <h1 className="text-3xl font-bold text-center mb-2">Create account</h1>
        <p className="text-text-muted text-center mb-8">Join the quiz and start competing</p>

        {state.error && (
          <div className="bg-wrong/10 border border-wrong/30 text-wrong rounded-lg px-4 py-3 mb-6 text-sm">
            {state.error}
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); submitAction(new FormData(e.currentTarget)); }} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="username" className="text-sm text-text-muted">Username</label>
            <input
              key={`username-${state.username}`}
              id="username"
              name="username"
              type="text"
              required
              defaultValue={state.username}
              placeholder="Pick a username"
              className="bg-background border border-border rounded-lg px-4 py-2.5 text-text placeholder:text-text-muted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
            />
          </div>

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
              placeholder="Create a password"
              className="bg-background border border-border rounded-lg px-4 py-2.5 text-text placeholder:text-text-muted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirmPassword" className="text-sm text-text-muted">Confirm password</label>
            <input
              key={`confirmPassword-${state.confirmPassword}`}
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              defaultValue={state.confirmPassword}
              placeholder="Repeat your password"
              className="bg-background border border-border rounded-lg px-4 py-2.5 text-text placeholder:text-text-muted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-semibold rounded-lg py-2.5 transition cursor-pointer"
          >
            {isPending ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="text-text-muted text-sm text-center mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-secondary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
};

export default RegisterPage;
