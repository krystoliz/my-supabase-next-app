// src/app/(main)/page.tsx
import Link from 'next/link';

export default function DashboardPage() {
  // Placeholder for user name, will be fetched dynamically later
  const userName = "Anne";

  return (
    <div className="max-w-7xl mx-auto">
      {/* Welcome Section */}
      <section className="bg-gray-100 p-6 rounded-lg shadow-md mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Welcome, {userName}!</h1>
          <p className="text-gray-600">Your learning journey starts here. Explore your decks and improve your knowledge.</p>
          <div className="mt-4 space-x-4">
            <Link href="/flashcards/create" className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Create New Flashcard Set
            </Link>
            {/* Sign Out Button (will integrate with auth later) */}
            <button className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors">
              Sign Out
            </button>
          </div>
        </div>
        {/* Learning Progress Visualization Placeholder */}
        <div className="w-1/3 bg-blue-700 text-white p-4 rounded-lg flex items-center justify-center h-40">
          Learning Progress Visualization
        </div>
      </section>

      {/* Key Statistics Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Your Progress at a Glance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Stat Card 1 */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-gray-800">7 Days Streak</h3>
            <p className="text-gray-600 mt-2">Continue your learning</p>
          </div>
          {/* Stat Card 2 */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-gray-800">156 Cards Reviewed</h3>
            <p className="text-gray-600 mt-2">Overall cards reviewed</p>
          </div>
          {/* Stat Card 3 */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-gray-800">125h Study Time</h3>
            <p className="text-gray-600 mt-2">Total hours spent learning</p>
          </div>
          {/* Stat Card 4 */}
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
          {/* Placeholder Flashcard Set Card 1 */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-gray-800">Cellular Respiration</h3>
            <p className="text-gray-600 text-sm mt-2">Biology - 15 cards</p>
            <div className="w-full bg-gray-200 h-2 rounded-full mt-4">
              <div className="bg-green-500 h-2 rounded-full w-[80%]"></div> {/* Example progress */}
            </div>
            <p className="text-right text-sm text-gray-500 mt-1">80% mastered</p>
          </div>
          {/* Placeholder Flashcard Set Card 2 */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-gray-800">Mahabharata Inggris</h3>
            <p className="text-gray-600 text-sm mt-2">History - 10 cards</p>
            <div className="w-full bg-gray-200 h-2 rounded-full mt-4">
              <div className="bg-green-500 h-2 rounded-full w-[60%]"></div> {/* Example progress */}
            </div>
            <p className="text-right text-sm text-gray-500 mt-1">60% mastered</p>
          </div>
          {/* Placeholder Flashcard Set Card 3 */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-gray-800">Aljabar Linear</h3>
            <p className="text-gray-600 text-sm mt-2">Mathematics - 20 cards</p>
            <div className="w-full bg-gray-200 h-2 rounded-full mt-4">
              <div className="bg-green-500 h-2 rounded-full w-[75%]"></div> {/* Example progress */}
            </div>
            <p className="text-right text-sm text-gray-500 mt-1">75% mastered</p>
          </div>
        </div>
      </section>
    </div>
  );
}