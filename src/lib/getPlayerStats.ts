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
      // Format attendu: YYYY-MM
      const regex = /^\d{4}-\d{2}$/;
      if (!regex.test(month)) {
        console.warn("Format de date invalide, format attendu YYYY-MM:", month);
        return [];
      }
      
      // Ajouter le jour 01 pour créer une date valide (YYYY-MM-01)
      formattedMonth = `${month}-01`;
      console.log("Date formatée:", formattedMonth);
    }

    // Préparer les paramètres
    const params = {
      p_player_id: playerId || null,
      p_month: formattedMonth
    };
    console.log("Appel RPC avec params:", params);

    // Essayer d'abord avec le client Supabase (méthode recommandée)
    try {
      const { data, error } = await supabase.rpc('get_player_stats', params);
      
      if (error) {
        console.error("Erreur avec client Supabase:", error);
        // On continuera avec la méthode fetch en cas d'échec
      } else if (data) {
        console.log("Données reçues via client Supabase:", data.length, "joueurs");
        return data;
      }
    } catch (supabaseError) {
      console.error("Exception avec client Supabase:", supabaseError);
      // On continuera avec la méthode fetch en cas d'échec
    }

    // Méthode alternative avec fetch direct (si la méthode précédente a échoué)
    console.log("Tentative avec fetch direct...");
    const timestamp = new Date().getTime();
    
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
      let errorText = "Erreur inconnue";
      try {
        const errorData = await response.json();
        console.error("Erreur RPC get_player_stats:", errorData);
        errorText = JSON.stringify(errorData);
      } catch (parseError) {
        errorText = await response.text();
        console.error("Erreur RPC get_player_stats (texte brut):", errorText);
      }
      
      console.error("Détails de la réponse d'erreur:", {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        error: errorText
      });
      
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

    console.log("Données reçues via fetch:", data.length, "joueurs");
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