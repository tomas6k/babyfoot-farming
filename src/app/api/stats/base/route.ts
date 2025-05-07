import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseClient();
    
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