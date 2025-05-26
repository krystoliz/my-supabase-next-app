// src/lib/api.ts
import { supabase } from './supabaseClient';

const API_BASE_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000').replace(/\/+$/, '');

async function fetchWithAuth(endpoint: string, options?: RequestInit) {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session) {
    console.error('No active session or session error:', sessionError?.message);
    throw new Error('User not authenticated.');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
    ...(options?.headers || {}),
  };

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  const response = await fetch(`${API_BASE_URL}${cleanEndpoint}`, {
    ...options,
    headers,
  });

   // --- MODIFIED LOGIC BELOW ---

  // For 204 No Content, no body is expected, so return null or an empty object directly
  if (response.status === 204) {
    return null; 
  }

  // Check if response has a body and is JSON before parsing
  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');

  let responseData;
  try {
    // Only attempt to parse as JSON if it's JSON content type and not 204
    if (isJson) {
      responseData = await response.json();
    } else {
      // For non-JSON responses (e.g., plain text errors), read as text
      responseData = await response.text();
    }
  } catch (parseError) {
    // Handle cases where response is not empty but also not parseable as JSON
    console.error('Error parsing response body:', parseError, 'Response text:', await response.text());
    throw new Error(`Failed to parse response from server. Status: ${response.status}`);
  }

  if (!response.ok) {
    // If response is not OK, throw an error with the response data
    throw new Error(responseData.error || responseData || `API call failed with status ${response.status}`);
  }

  return responseData; // Return the parsed data (or text if non-JSON)
}

  
// Define API calls for flashcards
export const api = {
  flashcards: {
    getSets: async () => fetchWithAuth('/api/flashcards'), // Corresponds to GET /api/flashcards
    // Add other flashcard API calls here as needed
    // --- NEW API FUNCTIONS BELOW ---
    getCardsInSet: async (setId: string) => // Corresponds to GET /api/flashcards/:setId/cards
      fetchWithAuth(`/api/flashcards/${setId}/cards`),

    createFlashcard: async (setId: string, question: string, answer: string) => // Corresponds to POST /api/flashcards/:setId/cards
      fetchWithAuth(`/api/flashcards/${setId}/cards`, {
        method: 'POST',
        body: JSON.stringify({ question, answer }),
      }),
    // --- END NEW API FUNCTIONS ---
    // --- NEW API FUNCTIONS BELOW ---
    updateFlashcard: async (setId: string, cardId: string, updates: { question?: string; answer?: string }) => // Corresponds to PUT /api/flashcards/:setId/cards/:cardId
      fetchWithAuth(`/api/flashcards/${setId}/cards/${cardId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      }),

    deleteFlashcard: async (setId: string, cardId: string) => // Corresponds to DELETE /api/flashcards/:setId/cards/:cardId
      fetchWithAuth(`/api/flashcards/${setId}/cards/${cardId}`, {
        method: 'DELETE',
      }),
    // --- END NEW API FUNCTIONS ---
  },

   // --- NEW API CATEGORY AND FUNCTIONS BELOW ---
  study: {
    getReviewCards: async (setId: string) => // Corresponds to GET /api/study/:setId/review-cards
      fetchWithAuth(`/api/study/${setId}/review-cards`),

    recordReview: async (flashcard_id: string, quality_of_response: number) => // Corresponds to POST /api/study/record-review
      fetchWithAuth(`/api/study/record-review`, {
        method: 'POST',
        body: JSON.stringify({ flashcard_id, quality_of_response }),
      }),
  },
  // --- END NEW API CATEGORY AND FUNCTIONS ---
  
  // Add other API categories (e.g., users, study) here
};