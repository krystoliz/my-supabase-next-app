// src/app/(main)/flashcards/[setId]/page.tsx
// src/app/(main)/flashcards/[setId]/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '../../../../lib/api';
import { supabase } from '../../../../lib/supabaseClient';
import Link from 'next/link';

interface Flashcard {
  id: string;
  set_id: string;
  question: string;
  answer: string;
  created_at: string;
  updated_at?: string;
}

interface FlashcardSetDetail {
  id: number;
  title: string;
  description: string;
  owner_id: string;
  visibility: string;
}

export default function FlashcardSetDetailPage() {
  const params = useParams();
  const setId = params.setId as string;
  const router = useRouter();

  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [flashcardSet, setFlashcardSet] = useState<FlashcardSetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [addingFlashcard, setAddingFlashcard] = useState(false);
  const [addFlashcardError, setAddFlashcardError] = useState<string | null>(null);

  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editedQuestion, setEditedQuestion] = useState('');
  const [editedAnswer, setEditedAnswer] = useState('');
  const [updatingFlashcard, setUpdatingFlashcard] = useState(false);
  const [updateFlashcardError, setUpdateFlashcardError] = useState<string | null>(null);

  // --- Data Fetching Function (No 'token' parameter) ---
  const fetchSetDetails = useCallback(async () => { // Parameter removed
    try {
      setLoading(true);
      setError(null);

      const setDetail = await api.flashcards.getSets().then(sets =>
        sets.find((s: { id: number; }) => s.id === parseInt(setId))
      );

      if (!setDetail) {
        setError('Flashcard set not found or not accessible.');
        setLoading(false);
        return;
      }
      setFlashcardSet(setDetail);

      const cards = await api.flashcards.getCardsInSet(setId);
      setFlashcards(cards);

    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Failed to fetch flashcard set or cards:', err);
        setError(err.message || 'Failed to load flashcard set.');
      } else {
        setError('An unexpected error occurred while loading flashcard set.');
      }
    } finally {
      setLoading(false);
    }
  }, [setId]);

  // --- Authentication and Initial Data Fetching ---
  useEffect(() => {
    let authListener: { data: { subscription: { unsubscribe: () => void } } } | null = null;

    const setupAuthAndFetch = async () => {
      const { data: { session }, error: getSessionError } = await supabase.auth.getSession();

      if (getSessionError || !session) {
        console.warn('No active session found, redirecting to login.');
        router.push('/login');
        setLoading(false);
        return;
      }

      fetchSetDetails(); // <--- REMOVED session.access_token
    };

    authListener = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session) {
          fetchSetDetails(); // <--- REMOVED session.access_token
        }
      } else if (event === 'SIGNED_OUT') {
        setFlashcards([]);
        setFlashcardSet(null);
        router.push('/login');
      }
    });

    setupAuthAndFetch();

    return () => {
      if (authListener && authListener.data && authListener.data.subscription) {
        authListener.data.subscription.unsubscribe();
      }
    };
  }, [setId, router, fetchSetDetails]); // Dependencies remain correct

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
      setFlashcards(prevCards => [...prevCards, createdCard]);
      setNewQuestion('');
      setNewAnswer('');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setAddFlashcardError(err.message || 'Failed to add flashcard.');
      } else {
        setAddFlashcardError('An unexpected error occurred while adding the flashcard.');
      }
      console.error('Failed to add flashcard:', err);
    } finally {
      setAddingFlashcard(false);
    }
  };

  // --- Handle Deleting Flashcard ---
  const handleDeleteFlashcard = async (cardId: string) => {
    if (!window.confirm('Are you sure you want to delete this flashcard? This action cannot be undone.')) {
      return;
    }

    try {
      await api.flashcards.deleteFlashcard(setId, cardId);
      setFlashcards(prevCards => prevCards.filter(card => card.id !== cardId));
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Failed to delete flashcard.');
      } else {
        setError('An unexpected error occurred while deleting the flashcard.');
      }
    }
  };

  // --- Handle Editing Flashcard ---
  const handleEditClick = (card: Flashcard) => {
    setEditingCardId(card.id);
    setEditedQuestion(card.question);
    setEditedAnswer(card.answer);
    setUpdateFlashcardError(null);
  };

  const handleCancelEdit = () => {
    setEditingCardId(null);
    setEditedQuestion('');
    setEditedAnswer('');
    setUpdateFlashcardError(null);
  };

  const handleSaveEdit = async (cardId: string) => {
    setUpdatingFlashcard(true);
    setUpdateFlashcardError(null);

    if (!editedQuestion.trim() || !editedAnswer.trim()) {
      setUpdateFlashcardError('Question and Answer cannot be empty.');
      setUpdatingFlashcard(false);
      return;
    }

    try {
      const updatedCard = await api.flashcards.updateFlashcard(
        setId,
        cardId,
        { question: editedQuestion, answer: editedAnswer }
      );
      setFlashcards(prevCards =>
        prevCards.map(card => (card.id === cardId ? { ...card, ...updatedCard } : card))
      );
      setEditingCardId(null);
      setEditedQuestion('');
      setEditedAnswer('');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setUpdateFlashcardError(err.message || 'Failed to update flashcard.');
      } else {
        setUpdateFlashcardError('An unexpected error occurred while updating the flashcard.');
      }
    } finally {
      setUpdatingFlashcard(false);
    }
  };

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
        <button className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors">
          Edit Set
        </button>
      </div>

      {/* Add New Flashcard Form */}
      <section className="bg-gray-100 p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-semibold mb-4">Add New Flashcard</h2>
        <form onSubmit={handleAddFlashcard} className="space-y-4">
          <div>
            <label htmlFor="new-question" className="sr-only">Question</label>
            <textarea
              id="new-question"
              placeholder="Question"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              required
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>
          <div>
            <label htmlFor="new-answer" className="sr-only">Answer</label>
            <textarea
              id="new-answer"
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
        {updateFlashcardError && <p className="text-red-500 text-sm mb-4">Error updating card: {updateFlashcardError}</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {flashcards.map((card) => (
            <div key={card.id} className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              {editingCardId === card.id ? (
                // Edit Mode
                <div className="space-y-3">
                  <div>
                    <label htmlFor={`edit-question-${card.id}`} className="sr-only">Question</label>
                    <textarea
                      id={`edit-question-${card.id}`}
                      value={editedQuestion}
                      onChange={(e) => setEditedQuestion(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    ></textarea>
                  </div>
                  <div>
                    <label htmlFor={`edit-answer-${card.id}`} className="sr-only">Answer</label>
                    <textarea
                      id={`edit-answer-${card.id}`}
                      value={editedAnswer}
                      onChange={(e) => setEditedAnswer(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    ></textarea>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
                      disabled={updatingFlashcard}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveEdit(card.id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={updatingFlashcard}
                    >
                      {updatingFlashcard ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{card.question}</h3>
                  <p className="text-gray-600 text-sm">{card.answer}</p>
                  <div className="mt-4 flex justify-end space-x-2">
                    <button
                      onClick={() => handleEditClick(card)}
                      className="text-blue-500 hover:text-blue-700 text-sm px-2 py-1 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteFlashcard(card.id)}
                      className="text-red-500 hover:text-red-700 text-sm px-2 py-1 rounded"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}