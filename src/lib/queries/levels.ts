import type { Database } from '@/types/supabase';

export type LevelWithInfo = Database['public']['Views']['levels_with_info']['Row'];

export async function getLevels() {
  try {
    console.log('Fetching levels...');
    const response = await fetch('/api/levels', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error response:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(errorData.error || 'Failed to fetch levels');
    }

    const data = await response.json();
    console.log('Fetched levels:', data);
    return data as LevelWithInfo[];
  } catch (error) {
    console.error('Error in getLevels:', error);
    throw error;
  }
} 