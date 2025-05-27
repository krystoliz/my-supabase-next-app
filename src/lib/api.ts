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

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');

  let responseData;
  try {
    if (isJson) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }
  } catch (parseError) {
    console.error('Error parsing response body:', parseError, 'Response text:', await response.text());
    throw new Error(`Failed to parse response from server. Status: ${response.status}`);
  }

  if (!response.ok) {
    throw new Error(responseData.error || responseData || `API call failed with status ${response.status}`);
  }

  return responseData;
}

// Define API calls for flashcards
export const api = {
  flashcards: {
    getSets: async () => fetchWithAuth('/api/flashcards'),

    // --- ENSURE THIS NEW API FUNCTION IS PRESENT AND CORRECT ---
    getSetById: async (setId: string) => // Corresponds to GET /api/flashcards/:setId
      fetchWithAuth(`/api/flashcards/${setId}`),
    // --- END NEW API FUNCTION ---

    getCardsInSet: async (setId: string) =>
      fetchWithAuth(`/api/flashcards/${setId}/cards`),

    createFlashcard: async (setId: string, question: string, answer: string) =>
      fetchWithAuth(`/api/flashcards/${setId}/cards`, {
        method: 'POST',
        body: JSON.stringify({ question, answer }),
      }),

    updateFlashcard: async (setId: string, cardId: string, updates: { question?: string; answer?: string }) =>
      fetchWithAuth(`/api/flashcards/${setId}/cards/${cardId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      }),

    deleteFlashcard: async (setId: string, cardId: string) =>
      fetchWithAuth(`/api/flashcards/${setId}/cards/${cardId}`, {
        method: 'DELETE',
      }),

    createFlashcardSet: async (title: string, description: string, visibility: 'private' | 'public') =>
      fetchWithAuth('/api/flashcards', {
        method: 'POST',
        body: JSON.stringify({ title, description, visibility }),
      }),

    // --- NEW API FUNCTION BELOW ---
    updateFlashcardSet: async (setId: string, updates: { title?: string; description?: string; visibility?: 'private' | 'public' }) => // Corresponds to PUT /api/flashcards/:setId
      fetchWithAuth(`/api/flashcards/${setId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      }),
    // --- END NEW API FUNCTION ---
  },

  study: {
    getReviewCards: async (setId: string) =>
      fetchWithAuth(`/api/study/${setId}/review-cards`),

    recordReview: async (flashcard_id: string, quality_of_response: number) =>
      fetchWithAuth(`/api/study/record-review`, {
        method: 'POST',
        body: JSON.stringify({ flashcard_id, quality_of_response }),
      }),
  },

  // --- NEW API CATEGORY FOR LLM INTEGRATION ---
  llm: {
    generateFlashcardsWithLLM: async (prompt: string, setId: string, count: number) =>
      fetchWithAuth('/api/llm/generate-flashcards-with-llm', { // Corresponds to POST /api/llm/generate-flashcards-with-llm
        method: 'POST',
        body: JSON.stringify({ prompt, setId, count }),
      }),
  },
  // --- END NEW API CATEGORY ---
};