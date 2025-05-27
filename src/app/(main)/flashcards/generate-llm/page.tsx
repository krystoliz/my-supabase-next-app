// src/app/(main)/flashcards/generate-llm/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../../lib/api';
import { supabase } from '../../../../lib/supabaseClient';
import Link from 'next/link';

// Define types for FlashcardSet (to populate dropdown) and generated Flashcard
interface FlashcardSet {
  id: string;
  title: string;
  description: string;
  // Add other properties if needed
}

interface GeneratedFlashcard {
  question: string;
  answer: string;
}

export default function GenerateFlashcardsPage() {
  const [prompt, setPrompt] = useState('');
  const [numCards, setNumCards] = useState(5); // Default to 5 cards
  const [selectedSetId, setSelectedSetId] = useState<string>('');
  const [userFlashcardSets, setUserFlashcardSets] = useState<FlashcardSet[]>([]);
  const [loadingSets, setLoadingSets] = useState(true);
  const [loadingGeneration, setLoadingGeneration] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedCards, setGeneratedCards] = useState<GeneratedFlashcard[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

  // --- Authentication Check and Fetch User's Flashcard Sets ---
  useEffect(() => {
    // Correctly type authListener
    let authListener: { subscription: { unsubscribe: () => void } } | null = null;

    const setupAuthAndFetchSets = async () => {
      const { data: { session }, error: getSessionError } = await supabase.auth.getSession();

      if (getSessionError || !session) {
        console.warn('No active session found, redirecting to login.');
        router.push('/login');
        setLoadingSets(false);
        return;
      }

      // Fetch user's flashcard sets to populate the dropdown
      try {
        setLoadingSets(true);
        setError(null);
        const sets = await api.flashcards.getSets();
        if (sets && sets.length > 0) {
          setUserFlashcardSets(sets);
          setSelectedSetId(String(sets[0].id)); // Auto-select the first set
        } else {
          setError('No flashcard sets found. Please create one first before generating cards.');
        }
      } catch (err: unknown) { // <-- Changed from 'any' to 'unknown'
        console.error('Failed to fetch user flashcard sets:', err);
        // Type Narrowing for unknown error
        if (err instanceof Error) {
          setError(err.message || 'Failed to load your flashcard sets.');
        } else {
          setError('An unexpected error occurred while loading your flashcard sets.');
        }
      } finally {
        setLoadingSets(false);
      }
    };

    const { data } = supabase.auth.onAuthStateChange(async (event, _session) => { // <-- Use _session
      if (event === 'SIGNED_OUT') {
        router.push('/login');
      }
    });

    authListener = data;

    setupAuthAndFetchSets();

    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [router]); // <-- Add router to dependencies

  // --- End: Authentication Check and Fetch User's Flashcard Sets ---


  // --- Handle LLM Flashcard Generation ---
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingGeneration(true);
    setError(null);
    setSuccessMessage(null);
    setGeneratedCards([]);

    if (!prompt.trim()) {
      setError('Please provide a prompt to generate flashcards.');
      setLoadingGeneration(false);
      return;
    }
    if (!selectedSetId) {
      setError('Please select a flashcard set to add cards to.');
      setLoadingGeneration(false);
      return;
    }
    if (numCards <= 0) {
      setError('Number of cards must be at least 1.');
      setLoadingGeneration(false);
      return;
    }

    try {
      const result = await api.llm.generateFlashcardsWithLLM(prompt, selectedSetId, numCards); // Call LLM API
      setGeneratedCards(result.flashcards || []);
      setSuccessMessage(result.message || `Successfully generated and saved ${result.flashcards?.length || 0} flashcards.`);
      setPrompt(''); // Clear prompt input
      // Optionally, refresh the set detail page after generation
      // router.push(`/flashcards/${selectedSetId}`);
    } catch (err: unknown) { // <-- Changed from 'any' to 'unknown'
      console.error('Flashcard generation failed:', err);
      // Type Narrowing for unknown error
      if (err instanceof Error) {
        setError(err.message || 'Failed to generate flashcards. Please try again.');
      } else {
        setError('An unexpected error occurred while generating flashcards. Please try again.');
      }
    } finally {
      setLoadingGeneration(false);
    }
  };
  // --- End: Handle LLM Flashcard Generation ---


  return (
    <div className="max-w-3xl mx-auto p-4 bg-white rounded-lg shadow-md">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Generate Flashcards with AI</h1>
      <p className="text-gray-600 mb-6">Let AI create flashcards for you based on any topic or text!</p>

      <form onSubmit={handleGenerate} className="space-y-6">
        <div>
          <label htmlFor="prompt" className="block text-lg font-semibold text-gray-700 mb-2">Prompt / Topic</label>
          <textarea
            id="prompt"
            placeholder="e.g., Explain the water cycle; Summarize key events of World War II; List 10 important biology terms"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            required
            rows={5}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          ></textarea>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="numCards" className="block text-lg font-semibold text-gray-700 mb-2">Number of Cards</label>
            <input
              id="numCards"
              type="number"
              value={numCards}
              onChange={(e) => setNumCards(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
              max="20"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="selectSet" className="block text-lg font-semibold text-gray-700 mb-2">Add to Flashcard Set</label>
            {loadingSets ? (
              <p className="text-gray-500">Loading sets...</p>
            ) : error && userFlashcardSets.length === 0 ? (
              <p className="text-red-500 text-sm">Error loading sets: {error}</p>
            ) : userFlashcardSets.length === 0 ? (
              <p className="text-gray-600 text-sm">You have no sets. <Link href="/flashcards/create" className="text-blue-600 hover:underline">Create one</Link> first!</p>
            ) : (
              <select
                id="selectSet"
                value={selectedSetId}
                onChange={(e) => setSelectedSetId(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {userFlashcardSets.map(set => (
                  <option key={set.id} value={set.id}>{set.title}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}
        {successMessage && <p className="text-green-600 text-sm">{successMessage}</p>}

        <button
          type="submit"
          disabled={loadingGeneration || loadingSets || userFlashcardSets.length === 0}
          className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loadingGeneration ? 'Generating...' : 'Generate Flashcards'}
        </button>
      </form>

      {generatedCards.length > 0 && (
        <section className="mt-10">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Generated Flashcards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {generatedCards.map((card, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="font-semibold text-gray-800 mb-1">Q: {card.question}</p>
                <p className="text-gray-600">A: {card.answer}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}