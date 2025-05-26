// src/app/(main)/page.tsx
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter
import { api } from '../../lib/api';
import { supabase } from '../../lib/supabaseClient'; // Import supabase client
import FlashcardSetCard from '../../components/flashcards/FlashcardSetCard';

interface FlashcardSet {
  id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at?: string;
  card_count?: number;
  progress_mastered_percentage?: number;
}

export default function DashboardPage() {
  const [userName, setUserName] = useState("Loading...");
  const [flashcardSets, setFlashcardSets] = useState<FlashcardSet[]>([]);
  const [loadingSets, setLoadingSets] = useState(true);
  const [errorSets, setErrorSets] = useState<string | null>(null);
  const router = useRouter(); // Initialize router

  // --- Start: User Authentication and Data Fetching Logic ---
  useEffect(() => {
    let authListener: any = null; // Declare a variable for the auth listener

    const setupAuthAndFetch = async () => {
      const { data: { session }, error: getSessionError } = await supabase.auth.getSession();

      if (getSessionError || !session) {
        console.warn('No active session found on dashboard load, redirecting to login.');
        router.push('/login');
        setLoadingSets(false);
        return;
      }

      setUserName(session.user.email || 'User');
      fetchFlashcardSets();
    };

    // Listen for auth state changes
    // Destructure the subscription object directly here for clarity
    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event);
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session) {
          setUserName(session.user.email || 'User');
          fetchFlashcardSets();
        }
      } else if (event === 'SIGNED_OUT') {
        setUserName('Guest');
        setFlashcardSets([]);
        router.push('/login');
      }
    });

    // Assign the data object to authListener for cleanup
    authListener = data;

    setupAuthAndFetch(); // Run on component mount

    // Cleanup the listener on component unmount
    return () => {
      // Correctly access the unsubscribe method on the subscription object
      if (authListener && authListener.subscription) { // Check for authListener.subscription
        authListener.subscription.unsubscribe(); // <--- CORRECTED LINE
      }
    };
  }, []); // Run once on component mount

  const fetchFlashcardSets = async () => {
    try {
      setLoadingSets(true);
      setErrorSets(null);
      const data = await api.flashcards.getSets();
      const sortedSets = data.sort((a: FlashcardSet, b: FlashcardSet) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setFlashcardSets(sortedSets.slice(0, 3));
    } catch (err: any) {
      console.error('Failed to fetch flashcard sets:', err);
      setErrorSets(err.message || 'Failed to load flashcard sets.');
    } finally {
      setLoadingSets(false);
    }
  };
  // --- End: User Authentication and Data Fetching Logic ---


  // --- Logout Functionality ---
  const handleSignOut = async () => {
    try {
      setLoadingSets(true); // Can use a separate loading state for logout
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        console.error('Error signing out:', signOutError.message);
        setErrorSets(signOutError.message);
      } else {
        router.push('/login'); // Redirect to login page after successful sign out
      }
    } catch (err: any) {
      console.error('Unexpected error during sign out:', err);
      setErrorSets('An unexpected error occurred during sign out.');
    } finally {
      setLoadingSets(false);
    }
  };
  // --- End: Logout Functionality ---


  return (
    <div className="max-w-7xl mx-auto">
      {/* Welcome Section */}
      <section className="bg-gray-100 p-6 rounded-lg shadow-md mb-8 flex flex-col md:flex-row justify-between items-center">
        <div className="md:w-2/3">
          <h1 className="text-3xl font-bold mb-2">Welcome, {userName}!</h1>
          <p className="text-gray-600">Your learning journey starts here. Explore your decks and improve your knowledge.</p>
          <div className="mt-4 space-x-4 flex">
            <Link href="/flashcards/create" className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Create New Flashcard Set
            </Link>
            <button
              onClick={handleSignOut} // Use the new logout function
              className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              disabled={loadingSets} // Disable button while loading (e.g. during logout)
            >
              Sign Out
            </button>
          </div>
        </div>
        {/* Learning Progress Visualization Placeholder */}
        <div className="md:w-1/3 bg-blue-700 text-white p-4 rounded-lg flex items-center justify-center h-40 mt-4 md:mt-0 md:ml-4">
          Learning Progress Visualization
        </div>
      </section>

      {/* Key Statistics Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Your Progress at a Glance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* These will remain placeholders until backend endpoints are available */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-gray-800">7 Days Streak</h3>
            <p className="text-gray-600 mt-2">Continue your learning</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-gray-800">156 Cards Reviewed</h3>
            <p className="text-gray-600 mt-2">Overall cards reviewed</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-gray-800">125h Study Time</h3>
            <p className="text-gray-600 mt-2">Total hours spent learning</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-gray-800">75% Avg. Score</h3>
            <p className="text-gray-600 mt-2">Average review accuracy</p>
          </div>
        </div>
      </section>

      {/* Recently Opened Decks Section */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Recently Opened Decks</h2>
          <Link href="/flashcards" className="text-blue-600 hover:underline">View All</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loadingSets && <p>Loading flashcard sets...</p>}
          {errorSets && <p className="col-span-full text-red-500">Error: {errorSets}</p>}
          {!loadingSets && !errorSets && flashcardSets.length === 0 && (
            <p className="col-span-full text-gray-600">No flashcard sets found for this account. <Link href="/flashcards/create" className="text-blue-600 hover:underline">Create one!</Link></p>
          )}
          {!loadingSets && !errorSets && flashcardSets.map((set) => (
            <FlashcardSetCard key={set.id} set={set} />
          ))}
        </div>
      </section>
    </div>
  );
}