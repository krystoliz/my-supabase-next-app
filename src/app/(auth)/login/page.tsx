// src/app/(auth)/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient'; // Adjust path if necessary
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
      } else {
        // Redirect to dashboard on successful login
        router.push('/');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'An unexpected error occurred.');
      } else {
        setError('An unexpected error occurred.');
      }
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Masuk</h1> {/* Login Title */}
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label htmlFor="email" className="sr-only">Email</label>
          <input
            id="email"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="password" className="sr-only">Password</label>
          <input
            id="password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gray-800 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Logging in...' : 'Masuk'}
        </button>
      </form>
      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-blue-600 hover:underline">
            Daftar
          </Link>
        </p>
      </div>
    </div>
  );
}