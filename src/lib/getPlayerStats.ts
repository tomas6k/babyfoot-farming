import { getSupabaseClient } from '@/lib/supabaseClient';
import type { Database } from "@/types/supabase";

// Vérifier que les variables d'environnement sont définies
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL n'est pas défini");
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY n'est pas défini");
}

const supabase = getSupabaseClient();

export type PlayerStats = Database['public']['Functions']['get_player_stats']['Returns'][0];

export async function getPlayerStats(month?: string, playerId?: string): Promise<PlayerStats[]> {
  try {
    console.log("Début getPlayerStats avec params:", { month, playerId });

    // Formater la date si elle est fournie
    let formattedMonth: string | null = null;
    if (month) {
      const date = new Date(month + "-01");
      if (isNaN(date.getTime())) {
        console.warn("Format de date invalide:", month);
        return [];
      }
      formattedMonth = date.toISOString().split('T')[0];
      console.log("Date formatée:", formattedMonth);
    }

    // Préparer les paramètres
    const params = {
      p_player_id: playerId || null,
      p_month: formattedMonth
    };
    console.log("Appel RPC avec params:", params);

    // Désactiver le cache pour l'appel
    const timestamp = new Date().getTime();
    
    // Utiliser l'API fetch pour appeler la fonction RPC sans cache
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/get_player_stats?cacheBuster=${timestamp}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
      body: JSON.stringify(params),
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Erreur RPC get_player_stats:", errorData);
      return [];
    }

    const data = await response.json();
    
    // Vérification des données
    if (!data) {
      console.warn("Aucune donnée retournée par get_player_stats");
      return [];
    }

    if (!Array.isArray(data)) {
      console.error("Les données retournées ne sont pas un tableau:", data);
      return [];
    }

    console.log("Données reçues:", data.length, "joueurs");
    return data;
  } catch (error: unknown) {
    // Log détaillé de l'erreur
    if (error instanceof Error) {
      console.error("Erreur dans getPlayerStats:", {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    } else {
      console.error("Erreur inconnue dans getPlayerStats:", error);
    }
    
    return [];
  }
} 