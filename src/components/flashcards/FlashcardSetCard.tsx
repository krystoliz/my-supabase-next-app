// src/components/flashcards/FlashcardSetCard.tsx
import Link from 'next/link';

// Define a type for your flashcard set data, assuming structure from your backend
interface FlashcardSet {
  id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at?: string; // Optional if not always present
  card_count?: number; // You might need to add a count in your backend query for this
  // Placeholder for progress if you later fetch it per set
  progress_mastered_percentage?: number;
}

interface FlashcardSetCardProps {
  set: FlashcardSet;
}

export default function FlashcardSetCard({ set }: FlashcardSetCardProps) {
  // Placeholder for number of cards, category, and progress
  const category = "General"; // Example: Could be part of set data
  const cardCount = set.card_count || 0;
  const masteredPercentage = set.progress_mastered_percentage || Math.floor(Math.random() * 100);

  return (
    <Link 
      href={`/flashcards/${set.id}`} // <--- CORRECTED LINE: Link to the set detail page
      className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 block"
    >
      <h3 className="text-xl font-bold text-gray-800">{set.title}</h3>
      <p className="text-gray-600 text-sm mt-2">{category} - {cardCount} cards</p>
      <div className="w-full bg-gray-200 h-2 rounded-full mt-4">
        <div
          className="bg-green-500 h-2 rounded-full"
          style={{ width: `${masteredPercentage}%` }}
        ></div>
      </div>
      <p className="text-right text-sm text-gray-500 mt-1">{masteredPercentage}% mastered</p>
    </Link>
  );
}