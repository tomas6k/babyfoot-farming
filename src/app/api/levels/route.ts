import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Vérifier que les variables d'environnement sont définies
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
}
if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

console.log('Initializing Supabase client with URL:', supabaseUrl);

const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);

export async function GET() {
  console.log('API Route: /api/levels called');
  
  try {
    console.log('Fetching levels from Supabase...');
    
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