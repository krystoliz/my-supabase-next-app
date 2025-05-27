// src/app/(main)/flashcards/[setId]/edit/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react'; // <-- Import useCallback
import { useParams, useRouter } from 'next/navigation';
import { api } from '../../../../../lib/api';
import { supabase } from '../../../../../lib/supabaseClient';
import Link from 'next/link';

// Define type for FlashcardSetDetail (from backend)
interface FlashcardSetDetail {
  id: string;
  title: string;
  description: string;
  visibility: 'private' | 'public';
  owner_id: string;
  created_at: string;
  updated_at?: string;
}

export default function EditFlashcardSetPage() {
  const params = useParams();
  const setId = params.setId as string;
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'public'>('private');
  const [loadingSet, setLoadingSet] = useState(true);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Data Fetching Logic (Wrapped in useCallback) ---
  const fetchSetDetails = useCallback(async () => {
    try {
      setLoadingSet(true);
      setError(null);
      const setDetail = await api.flashcards.getSetById(setId); // Fetch set details
      setTitle(setDetail.title);
      setDescription(setDetail.description || '');
      setVisibility(setDetail.visibility || 'private');
    } catch (err: unknown) { // <-- Changed from 'any' to 'unknown'
      console.error('Failed to fetch flashcard set for editing:', err);
      // Type Narrowing for unknown error
      if (err instanceof Error) {
        setError(err.message || 'Failed to load flashcard set for editing.');
      } else {
        setError('An unexpected error occurred while loading flashcard set for editing.');
      }
    } finally {
      setLoadingSet(false);
    }
  }, [setId]); // This function depends on setId

  // --- Authentication Check and Initial Set Data Fetching ---
  useEffect(() => {
    // Correctly type authListener
    let authListener: { subscription: { unsubscribe: () => void } } | null = null;

    const setupAuthAndFetch = async () => {
      const { data: { session }, error: getSessionError } = await supabase.auth.getSession();

      if (getSessionError || !session) {
        console.warn('No active session found, redirecting to login.');
        router.push('/login');
        setLoadingSet(false);
        return;
      }

      fetchSetDetails(); // Call the memoized function
    };

    const { data } = supabase.auth.onAuthStateChange(async (event, _session) => { // Use _session to ignore
      if (event === 'SIGNED_OUT') {
        router.push('/login');
      }
    });

    authListener = data;

    setupAuthAndFetch();

    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [setId, router, fetchSetDetails]); // <-- Add setId, router, and fetchSetDetails to dependencies

  // --- Handle Form Submission for Update ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingSubmit(true);
    setError(null);

    if (!title.trim()) {
      setError('Flashcard set title is required.');
      setLoadingSubmit(false);
      return;
    }

    try {
      const updatedSet = await api.flashcards.updateFlashcardSet(setId, { title, description, visibility });
      router.push(`/flashcards/${setId}`);
    } catch (err: unknown) { // <-- Changed from 'any' to 'unknown'
      console.error('Failed to update flashcard set:', err);
      // Type Narrowing for unknown error
      if (err instanceof Error) {
        setError(err.message || 'Failed to update flashcard set.');
      } else {
        setError('An unexpected error occurred while updating flashcard set.');
      }
    } finally {
      setLoadingSubmit(false);
    }
  };

  if (loadingSet) {
    return <div className="text-center p-8">Loading flashcard set for editing...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="max-w-xl mx-auto p-4 bg-white rounded-lg shadow-md">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Edit Flashcard Set</h1>

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
          <Link href={`/flashcards/${setId}`} className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-100 transition-colors">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loadingSubmit}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingSubmit ? 'Saving Changes...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}