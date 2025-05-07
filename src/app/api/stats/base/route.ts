import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is required');
}

if (!supabaseAnonKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(request: Request) {
  try {
    // Récupération des statistiques de base et complexes
    const [baseStats, complexStats] = await Promise.all([
      supabase.rpc('get_base_match_stats'),
      supabase.rpc('get_complex_stats')
    ]);

    if (baseStats.error) throw baseStats.error;
    if (complexStats.error) throw complexStats.error;

    // Fusion des statistiques
    const mergedStats = {
      ...baseStats.data,
      ...complexStats.data
    };

    return NextResponse.json(mergedStats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
} 