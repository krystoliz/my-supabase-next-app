// src/app/(main)/flashcards/[setId]/study/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '../../../../../lib/api';
import { supabase } from '../../../../../lib/supabaseClient';
import Link from 'next/link';

interface FlashcardForReview {
  id: string;
  set_id: string;
  question: string;
  answer: string;
  created_at: string;
  updated_at?: string;
  studyProgress?: {
    ease_factor: number;
    repetitions: number;
    interval: number;
    next_review_date: string;
    last_reviewed: string;
    user_id: string;
  } | null;
}

export default function StudyModePage() {
  const params = useParams();
  const setId = params.setId as string;
  const router = useRouter();

  const [cardsToReview, setCardsToReview] = useState<FlashcardForReview[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [cardsReviewedCount, setCardsReviewedCount] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);

  const fetchCardsForStudy = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const cards = await api.study.getReviewCards(setId);
      if (cards && cards.length > 0) {
        setCardsToReview(cards);
        setSessionStartTime(Date.now());
      } else {
        setSessionCompleted(true);
        setError('No cards due for review in this set, or set is empty.');
      }
    } catch (err: unknown) { // Use unknown
      console.error('Failed to fetch review cards:', err);
      // Type Narrowing: Check if err is an instance of Error
      if (err instanceof Error) {
        setError(err.message || 'Failed to load study session cards.');
      } else {
        // Fallback for non-Error types (e.g., if a string or raw object was thrown)
        setError('An unexpected error occurred while loading study session cards.');
      }
    } finally {
      setLoading(false);
    }
  }, [setId]);

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

      fetchCardsForStudy();
    };

    authListener = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session) {
          fetchCardsForStudy();
        }
      } else if (event === 'SIGNED_OUT') {
        setCardsToReview([]);
        router.push('/login');
      }
    });

    setupAuthAndFetch();

    return () => {
      if (authListener && authListener.data && authListener.data.subscription) {
        authListener.data.subscription.unsubscribe();
      }
    };
  }, [setId, router, fetchCardsForStudy]);

  const currentCard = cardsToReview[currentCardIndex];

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleReview = async (qualityOfResponse: number) => {
    if (!currentCard) return;

    setReviewError(null);
    try {
      await api.study.recordReview(currentCard.id, qualityOfResponse);
      setCardsReviewedCount(prev => prev + 1);
      setIsFlipped(false);

      const nextIndex = currentCardIndex + 1;
      if (nextIndex < cardsToReview.length) {
        setCurrentCardIndex(nextIndex);
      } else {
        setSessionCompleted(true);
        if (sessionStartTime) {
          setTimeSpent(Math.round((Date.now() - sessionStartTime) / 1000));
        }
      }
    } catch (err: unknown) { // Use unknown
      console.error('Failed to record review:', err);
      // Type Narrowing: Check if err is an instance of Error
      if (err instanceof Error) {
        setReviewError(err.message || 'Failed to record review.');
      } else {
        // Fallback for non-Error types
        setReviewError('An unexpected error occurred while recording review.');
      }
    }
  };

  // --- UI Rendering ---
  if (loading) {
    return <div className="text-center p-8 text-gray-600">Loading study session...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">Error: {error}</div>;
  }

  if (sessionCompleted) {
    return (
      <div className="max-w-xl mx-auto p-8 bg-white rounded-lg shadow-lg text-center flex flex-col items-center justify-center min-h-[calc(100vh-150px)]">
        <h1 className="text-4xl font-bold text-green-600 mb-6">Selamat! Anda telah meninjau semua kartu.</h1>
        <p className="text-gray-700 text-lg mb-4">Waktu anda {Math.floor(timeSpent / 60)} menit {timeSpent % 60} detik</p>
        
        <div className="flex items-center text-gray-800 text-xl font-semibold mb-6">
          <svg className="w-8 h-8 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          Selesai: {cardsReviewedCount}
        </div>

        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Langkah Selanjutnya</h2>
        <Link href={`/flashcards/${setId}`} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg">
          Back to Set Details
        </Link>
        <Link href="/" className="mt-4 text-blue-600 hover:underline">
          Go to Dashboard
        </Link>
      </div>
    );
  }

  if (!currentCard) {
    return <div className="text-center p-8 text-gray-600">No cards available for study.</div>;
  }

  return (
    <div className="max-w-xl mx-auto p-4 flex flex-col items-center justify-center min-h-[calc(100vh-150px)]">
      {/* Flashcard Counter */}
      <div className="flex justify-between w-full mb-4 px-4">
        <Link href={`/flashcards/${setId}`} className="text-gray-500 hover:text-gray-800">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </Link>
        <span className="text-gray-600 text-lg">
          {currentCardIndex + 1}/{cardsToReview.length}
        </span>
        <div className="flex space-x-2 text-gray-500">
            <svg className="w-6 h-6 cursor-pointer hover:text-gray-800" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v16a1 1 0 01-1.707.707L6 14H3a1 1 0 01-1-1v-2a1 1 0 011-1h3l-4.707-4.707a1 1 0 01.707-1.707l10-10z" clipRule="evenodd"></path></svg>
            <svg className="w-6 h-6 cursor-pointer hover:text-gray-800" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
        </div>
      </div>

      {/* Flashcard Card Area */}
      <div
        className="bg-white p-8 rounded-lg shadow-lg w-full min-h-[250px] flex items-center justify-center cursor-pointer transform transition-transform duration-300"
        onClick={handleFlip}
        style={{
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          backfaceVisibility: 'hidden',
          transition: 'transform 0.6s'
        }}
      >
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Question Side */}
          <div
            className="absolute w-full h-full flex items-center justify-center"
            style={{
              backfaceVisibility: 'hidden',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            <p className="text-4xl font-semibold text-gray-800 break-words text-center px-4">{currentCard.question}</p>
          </div>
          {/* Answer Side */}
          <div
            className="absolute w-full h-full flex items-center justify-center"
            style={{
              backfaceVisibility: 'hidden',
              transform: isFlipped ? 'rotateY(0deg)' : 'rotateY(180deg)',
            }}
          >
            <p className="text-4xl font-semibold text-gray-800 break-words text-center px-4">{currentCard.answer}</p>
          </div>
        </div>
      </div>

      {reviewError && <p className="text-red-500 text-sm mt-4">{reviewError}</p>}

      {/* Quality of Response Buttons */}
      {isFlipped && (
        <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 w-full">
          {[0, 1, 2, 3, 4, 5].map((quality) => (
            <button
              key={quality}
              onClick={() => handleReview(quality)}
              disabled={reviewError !== null}
              className={`px-4 py-3 rounded-lg font-semibold transition-colors duration-200 
                ${quality >= 3
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-red-500 hover:bg-red-600 text-white'
                } 
                ${quality === 0 && 'bg-red-700 hover:bg-red-800'} 
                ${quality === 1 && 'bg-orange-500 hover:bg-orange-600'} 
                ${quality === 2 && 'bg-yellow-500 hover:bg-yellow-600'}
                ${quality === 3 && 'bg-green-500 hover:bg-green-600'}
                ${quality === 4 && 'bg-blue-500 hover:bg-blue-600'}
                ${quality === 5 && 'bg-purple-500 hover:bg-purple-600'}
                disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {quality === 0 ? 'Again' : quality === 1 ? 'Hard' : quality === 2 ? 'Good' : quality === 3 ? 'Easy' : quality === 4 ? 'Very Easy' : 'Perfect'}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}