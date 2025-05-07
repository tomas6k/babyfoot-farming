import { getSupabaseClient } from '@/lib/supabaseClient';
import { NextResponse } from 'next/server';

// Vérifier que les variables d'environnement sont définies
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!supabaseServiceKey || !supabaseUrl) {
  throw new Error('Missing required environment variables');
}

const supabase = getSupabaseClient();

export async function GET(request: Request) {
  try {
    // Récupérer le mois en paramètre de l'URL
    const { searchParams } = new URL(request.url);
    const targetMonth = searchParams.get('month');

    console.log('API: Received request for month:', targetMonth);
    
    // Formater la date correctement (premier jour du mois)
    const formattedDate = targetMonth ? `${targetMonth}-01` : null;
    console.log('API: Formatted date:', formattedDate);
    
    // Appeler la fonction get_players_stats avec le mois en paramètre
    console.log('API: Calling get_players_stats with params:', { target_month: formattedDate });
    const { data, error } = await supabase.rpc(
      'get_players_stats',
      { target_month: formattedDate }
    );

    if (error) {
      console.error('API: Error fetching player stats:', error);
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

    if (!data) {
      console.log('API: No stats found');
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

    console.log('API: Successfully fetched stats:', data);
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
    console.error('API: Unexpected error in stats API route:', err);
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