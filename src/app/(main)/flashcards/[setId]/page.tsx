// src/app/(main)/flashcards/[setId]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '../../../../lib/api'; // Adjust path if necessary
import { supabase } from '../../../../lib/supabaseClient'; // Adjust path if necessary
import Link from 'next/link';

// Define types for Flashcard and FlashcardSet (simplified for this page)
interface Flashcard {
  id: string;
  set_id: string;
  question: string;
  answer: string;
  created_at: string;
  updated_at?: string;
}

interface FlashcardSetDetail {
  id: string;
  title: string;
  description: string;
  owner_id: string;
  visibility: string;
}

export default function FlashcardSetDetailPage() {
  const params = useParams();
  const setId = params.setId as string; // Get the set ID from the URL
  const router = useRouter();

  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [flashcardSet, setFlashcardSet] = useState<FlashcardSetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [addingFlashcard, setAddingFlashcard] = useState(false);
  const [addFlashcardError, setAddFlashcardError] = useState<string | null>(null);

  // --- Authentication and Initial Data Fetching ---
  useEffect(() => {
    let authListener: any = null;

    const setupAuthAndFetch = async () => {
      const { data: { session }, error: getSessionError } = await supabase.auth.getSession();

      if (getSessionError || !session) {
        console.warn('No active session found, redirecting to login.');
        router.push('/login');
        setLoading(false);
        return;
      }
      
      // Fetch set details and then cards
      fetchSetDetails(session.access_token);
    };

    authListener = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session) {
          fetchSetDetails(session.access_token);
        }
      } else if (event === 'SIGNED_OUT') {
        setFlashcards([]);
        setFlashcardSet(null);
        router.push('/login');
      }
    });

    setupAuthAndFetch();

    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [setId, router]); // Re-run if setId changes

  const fetchSetDetails = async (token: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // First, fetch the specific set to ensure it exists and user has access
      // Note: Your backend's getSetById (router.get('/:setId')) is protected by owner_id
      // For public/shared sets, you might need a different backend endpoint or RLS policy.
      // For now, assuming current user is owner or has direct access based on RLS.
      const setDetail = await api.flashcards.getSets().then(sets => sets.find((s: any) => s.id === parseInt(setId))); // Crude way to find if only one set is fetched
      
      if (!setDetail) {
          setError('Flashcard set not found or not accessible.');
          setLoading(false);
          return;
      }
      setFlashcardSet(setDetail);

      // Now fetch cards within that set
      const cards = await api.flashcards.getCardsInSet(setId);
      setFlashcards(cards);

    } catch (err: any) {
      console.error('Failed to fetch flashcard set or cards:', err);
      setError(err.message || 'Failed to load flashcard set.');
    } finally {
      setLoading(false);
    }
  };
  // --- End: Authentication and Initial Data Fetching ---


  // --- Handle Adding New Flashcard ---
  const handleAddFlashcard = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingFlashcard(true);
    setAddFlashcardError(null);

    if (!newQuestion.trim() || !newAnswer.trim()) {
      setAddFlashcardError('Question and Answer cannot be empty.');
      setAddingFlashcard(false);
      return;
    }

    try {
      const createdCard = await api.flashcards.createFlashcard(setId, newQuestion, newAnswer);
      setFlashcards(prevCards => [...prevCards, createdCard]); // Add new card to state
      setNewQuestion(''); // Clear form
      setNewAnswer('');   // Clear form
    } catch (err: any) {
      console.error('Failed to add flashcard:', err);
      setAddFlashcardError(err.message || 'Failed to add flashcard.');
    } finally {
      setAddingFlashcard(false);
    }
  };
  // --- End: Handle Adding New Flashcard ---


  if (loading) {
    return <div className="text-center p-8">Loading set details and flashcards...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">Error: {error}</div>;
  }

  if (!flashcardSet) {
    return <div className="text-center p-8 text-gray-600">Flashcard set not found.</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-2">{flashcardSet.title}</h1>
      <p className="text-gray-600 mb-6">{flashcardSet.description}</p>

      {/* Action Buttons */}
      <div className="flex space-x-4 mb-8">
        <Link href={`/flashcards/${setId}/study`} className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Start Study Session
        </Link>
        {/* Placeholder for Edit Set button */}
        <button className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors">
          Edit Set
        </button>
      </div>

      {/* Add New Flashcard Form */}
      <section className="bg-gray-100 p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-semibold mb-4">Add New Flashcard</h2>
        <form onSubmit={handleAddFlashcard} className="space-y-4">
          <div>
            <label htmlFor="question" className="sr-only">Question</label>
            <textarea
              id="question"
              placeholder="Question"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              required
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>
          <div>
            <label htmlFor="answer" className="sr-only">Answer</label>
            <textarea
              id="answer"
              placeholder="Answer"
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              required
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>
          {addFlashcardError && <p className="text-red-500 text-sm">{addFlashcardError}</p>}
          <button
            type="submit"
            disabled={addingFlashcard}
            className="px-5 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {addingFlashcard ? 'Adding...' : 'Add Flashcard'}
          </button>
        </form>
      </section>

      {/* List of Flashcards in the Set */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Flashcards ({flashcards.length})</h2>
        {flashcards.length === 0 && !loading && <p className="text-gray-600">No flashcards in this set yet. Add one above!</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {flashcards.map((card) => (
            <div key={card.id} className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{card.question}</h3>
              <p className="text-gray-600 text-sm">{card.answer}</p>
              {/* Placeholder for Edit/Delete individual flashcards */}
              <div className="mt-4 flex justify-end space-x-2">
                <button className="text-blue-500 hover:text-blue-700 text-sm">Edit</button>
                <button className="text-red-500 hover:text-red-700 text-sm">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}