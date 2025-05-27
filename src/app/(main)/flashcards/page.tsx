// src/app/(main)/flashcards/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react'; // <-- Import useCallback
import Link from 'next/link';
import { api } from '../../../lib/api';
import { supabase } from '../../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import FlashcardSetCard from '../../../components/flashcards/FlashcardSetCard';

interface FlashcardSet {
  id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at?: string;
  card_count?: number;
  progress_mastered_percentage?: number;
}

export default function FlashcardSetsPage() {
  const [flashcardSets, setFlashcardSets] = useState<FlashcardSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  // --- Data Fetching Logic (Wrapped in useCallback) ---
  const fetchFlashcardSets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.flashcards.getSets();
      setFlashcardSets(data);
    } catch (err: unknown) { // <-- Changed from 'any' to 'unknown'
      console.error('Failed to fetch flashcard sets:', err);
      // Type Narrowing for unknown error
      if (err instanceof Error) {
        setError(err.message || 'Failed to load flashcard sets.');
      } else {
        setError('An unexpected error occurred while loading flashcard sets.');
      }
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies for fetchFlashcardSets itself, as it doesn't use props/state directly

  // --- Authentication and Initial Data Fetching Logic ---
  useEffect(() => {
    // Type authListener correctly
    let authListener: { data: { subscription: { unsubscribe: () => void } } } | null = null;

    const setupAuthAndFetch = async () => {
      const { data: { session }, error: getSessionError } = await supabase.auth.getSession();

      if (getSessionError || !session) {
        console.warn('No active session found on flashcards page load, redirecting to login.');
        router.push('/login');
        setLoading(false);
        return;
      }
      fetchFlashcardSets(); // fetchFlashcardSets is now stable
    };

    authListener = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session) {
          fetchFlashcardSets();
        }
      } else if (event === 'SIGNED_OUT') {
        setFlashcardSets([]);
        router.push('/login');
      }
    });

    setupAuthAndFetch();

    return () => {
      if (authListener && authListener.data && authListener.data.subscription) {
        authListener.data.subscription.unsubscribe();
      }
    };
  }, [router, fetchFlashcardSets]); // <-- Added router and fetchFlashcardSets to dependencies

  // Filter sets based on search term
  const filteredSets = flashcardSets.filter(set =>
    set.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    set.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Search Bar and Create New Class Button */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 space-y-4 md:space-y-0">
        <div className="relative w-full md:w-2/3">
          <input
            type="text"
            placeholder="Search flashcards..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {/* Search icon */}
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>
        <Link href="/flashcards/create" className="px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full md:w-auto text-center">
          + Create New Class
        </Link>
      </div>

      {/* List of Flashcard Sets */}
      <h2 className="text-2xl font-semibold mb-4">Daftar Class</h2>
      {loading && <p>Loading flashcard sets...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      {!loading && !error && filteredSets.length === 0 && (
        <p className="text-gray-600">
          No flashcard sets found. {searchTerm ? `Try a different search term.` : `Click "Create New Class" to add one!`}</p>
      )}
      {!loading && !error && filteredSets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSets.map((set) => (
            <FlashcardSetCard key={set.id} set={set} />
          ))}
        </div>
      )}
    </div>
  );
}