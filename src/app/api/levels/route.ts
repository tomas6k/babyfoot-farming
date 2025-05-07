import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabaseClient';

export async function GET() {
  console.log('API Route: /api/levels called');
  
  try {
    console.log('Fetching levels from Supabase...');
    const supabase = getSupabaseClient();
    
    // Récupérer les données depuis la vue levels_with_info
    const { data, error } = await supabase
      .from('levels_with_info')
      .select('*')
      .order('level');

    if (error) {
      console.error('Error fetching levels from Supabase:', error);
      return new NextResponse(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (!data || data.length === 0) {
      console.log('No levels found in database');
      return new NextResponse(
        JSON.stringify([]),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    console.log(`Successfully fetched ${data.length} levels:`, data);
    return new NextResponse(
      JSON.stringify(data),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
  } catch (err) {
    console.error('Unexpected error in levels API route:', err);
    return new NextResponse(
      JSON.stringify({ 
        error: 'Internal Server Error',
        details: err instanceof Error ? err.message : String(err)
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
} 