'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn('credentials', {
      redirect: false,
      identifier,
      password,
    });

    setLoading(false);

    if (result?.error) {
      setError('Invalid credentials');
      return;
    }

    router.push('/dashboard');
  };

  return (
    <main
      className="flex min-h-screen items-center justify-center px-4"
      style={{ background: 'rgb(var(--color-background))' }}
    >
      <form
        onSubmit={handleSubmit}
        className="edu-card w-full max-w-md space-y-4 shadow-lg"
        style={{
          background: 'rgb(var(--color-surface))',
          borderColor: 'rgb(var(--color-border))',
          borderRadius: 'var(--radius-large)',
        }}
      >
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'rgb(var(--color-text))' }}>
            Welcome back
          </h1>
          <p className="text-sm" style={{ color: 'rgb(var(--color-text-secondary))' }}>
            Sign in with your email or learner username.
          </p>
        </div>
        {error && (
          <p
            className="rounded p-3 text-sm"
            style={{
              background: 'rgb(var(--color-error) / 0.1)',
              borderColor: 'rgb(var(--color-error) / 0.6)',
              color: 'rgb(var(--color-error))',
            }}
          >
            {error}
          </p>
        )}
        <label className="block text-sm font-semibold" style={{ color: 'rgb(var(--color-text))' }}>
          Email or username
          <input
            className="input mt-1 w-full"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
          />
        </label>
        <label className="block text-sm font-semibold" style={{ color: 'rgb(var(--color-text))' }}>
          Password
          <input
            className="input mt-1 w-full"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="edu-btn w-full transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          style={{ borderRadius: 'var(--radius-large)' }}
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}
