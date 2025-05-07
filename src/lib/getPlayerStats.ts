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

    // Appeler la fonction get_player_stats
    const { data, error } = await supabase.rpc('get_player_stats', params);

    // Gestion détaillée des erreurs
    if (error) {
      console.error("Erreur RPC get_player_stats:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        params
      });

      // Si c'est une erreur de fonction non trouvée, on le log spécifiquement
      if (error.message?.includes("function") && error.message?.includes("does not exist")) {
        console.error("La fonction get_player_stats n'existe pas dans la base de données");
      }

      return [];
    }
    
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