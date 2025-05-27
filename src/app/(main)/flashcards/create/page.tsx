// src/app/(main)/flashcards/create/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../../lib/api';
import { supabase } from '../../../../lib/supabaseClient';
import Link from 'next/link';

export default function CreateFlashcardSetPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'public'>('private'); // Default to private
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // --- Authentication Check ---
  useEffect(() => {
    // Correctly type authListener
    let authListener: { subscription: { unsubscribe: () => void } } | null = null;

    const setupAuth = async () => {
      const { data: { session }, error: getSessionError } = await supabase.auth.getSession();

      if (getSessionError || !session) {
        console.warn('No active session found, redirecting to login.');
        router.push('/login');
      }
      setLoading(false); // Stop loading state after auth check
    };

    const { data } = supabase.auth.onAuthStateChange(async (event, _session) => {
      if (event === 'SIGNED_OUT') {
        router.push('/login'); // Redirect to login on sign out
      }
    });

    authListener = data; // Assign the data object (which contains the subscription)

    setupAuth();

    return () => {
      // Access subscription directly from authListener
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [router]); // <-- Add router to dependencies

  // --- End: Authentication Check ---


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!title.trim()) {
      setError('Flashcard set title is required.');
      setLoading(false);
      return;
    }

    try {
      const newSet = await api.flashcards.createFlashcardSet(title, description, visibility);

      // Redirect to the newly created set's detail page or flashcards list
      router.push(`/flashcards/${newSet.id}`);
    } catch (err: unknown) { // <-- Changed from 'any' to 'unknown'
      console.error('Failed to create flashcard set:', err);
      // Type Narrowing for unknown error
      if (err instanceof Error) {
        setError(err.message || 'Failed to create flashcard set.');
      } else {
        setError('An unexpected error occurred while creating flashcard set.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 bg-white rounded-lg shadow-md">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Create New Flashcard Set</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-lg font-semibold text-gray-700 mb-2">Title</label>
          <input
            id="title"
            type="text"
            placeholder="e.g., Biology Terms, Spanish Vocabulary"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-lg font-semibold text-gray-700 mb-2">Description (Optional)</label>
          <textarea
            id="description"
            placeholder="A brief description of this set..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          ></textarea>
        </div>

        <div>
          <label htmlFor="visibility" className="block text-lg font-semibold text-gray-700 mb-2">Visibility</label>
          <select
            id="visibility"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as 'private' | 'public')}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="private">Private (Only you can see)</option>
            <option value="public">Public (Anyone can see and study)</option>
          </select>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex justify-end space-x-4">
          <Link href="/flashcards" className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-100 transition-colors">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Set'}
          </button>
        </div>
      </form>
    </div>
  );
}