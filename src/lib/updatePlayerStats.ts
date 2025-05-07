import { Database } from "@/types/supabase";
import { PostgrestError } from "@supabase/supabase-js";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";

interface Player {
  id: string;
  pseudo: string;
  exp: number;
  level: number;
  title: string;
  description: string;
  illustration_url: string;
  required_exp: number;
  exp_given: number;
  next_level_exp: number;
  progress: number;
  mana: number;
  hp: number;
  disable: boolean;
}

interface Match {
  white_attacker: string;
  white_defender: string;
  black_attacker: string;
  black_defender: string;
  score_white: number;
  score_black: number;
  added_by?: string;
}

interface Level {
  level: number;
  required_exp: number;
  exp_given: number;
}

interface PlayerUpdateResult {
  player_id: string;
  pseudo: string;
  old_exp: number;
  new_exp: number;
  old_mana: number;
  new_mana: number;
  old_hp: number;
  new_hp: number;
}

function isPostgrestError(error: unknown): error is PostgrestError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'details' in error
  );
}

export async function processMatch(match: Match): Promise<void> {
  try {
    // Validation des données d'entrée
    if (!match.white_attacker || !match.white_defender || !match.black_attacker || !match.black_defender) {
      throw new Error("Tous les joueurs doivent être spécifiés");
    }

    if (match.score_white < 0 || match.score_black < 0 || match.score_white > 10 || match.score_black > 10) {
      throw new Error("Les scores doivent être compris entre 0 et 10");
    }

    if (match.score_white !== 10 && match.score_black !== 10) {
      throw new Error("Un des scores doit être égal à 10");
    }

    if (match.score_white === match.score_black) {
      throw new Error("Il ne peut pas y avoir de match nul");
    }

    // Vérifier que les joueurs sont différents
    const players = new Set([match.white_attacker, match.white_defender, match.black_attacker, match.black_defender]);
    if (players.size !== 4) {
      throw new Error("Les 4 joueurs doivent être différents");
    }

    console.log("Envoi des données du match:", {
      p_white_attacker: match.white_attacker,
      p_white_defender: match.white_defender,
      p_black_attacker: match.black_attacker,
      p_black_defender: match.black_defender,
      p_score_white: match.score_white,
      p_score_black: match.score_black,
      p_added_by: match.added_by
    });

    // Appeler la fonction PostgreSQL avec les paramètres du match
    const { data: results, error } = await supabase.rpc('process_match', {
      p_white_attacker: match.white_attacker,
      p_white_defender: match.white_defender,
      p_black_attacker: match.black_attacker,
      p_black_defender: match.black_defender,
      p_score_white: match.score_white,
      p_score_black: match.score_black,
      p_added_by: match.added_by
    });

    // Log complet de la réponse pour le débogage
    console.log("Réponse Supabase complète:", { results, error });

    if (error) {
      // Log détaillé de l'erreur
      console.error("Erreur Supabase détectée:", {
        error,
        isPostgrestError: isPostgrestError(error),
        errorType: typeof error,
        errorKeys: Object.keys(error),
        errorStringified: JSON.stringify(error)
      });

      if (isPostgrestError(error)) {
        console.error("Détails de l'erreur Postgrest:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });

        // Messages d'erreur personnalisés selon le code
        if (error.code === "23505") {
          throw new Error("Ce match a déjà été enregistré");
        } else if (error.code === "23503") {
          throw new Error("Un des joueurs n'existe pas");
        } else if (error.code === "P0001") {
          throw new Error(error.message || "Erreur personnalisée de la base de données");
        }
      }

      // Si l'erreur n'est pas reconnue, on lance une erreur générique avec plus de contexte
      throw new Error(`Erreur lors du traitement du match: ${error.message || JSON.stringify(error)}`);
    }

    if (!results) {
      throw new Error("Aucun résultat retourné par la fonction");
    }

    if (!Array.isArray(results)) {
      console.error("Format de résultat invalide:", results);
      throw new Error("Format de réponse invalide");
    }

    if (results.length === 0) {
      throw new Error("Aucun joueur mis à jour");
    }

    // Afficher les résultats pour chaque joueur
    results.forEach((result: PlayerUpdateResult) => {
      if (!result || typeof result !== 'object') {
        console.warn("Résultat invalide ignoré:", result);
        return;
      }

      console.log(`Mise à jour des stats pour ${result.pseudo}:`, {
        exp: `${result.old_exp} → ${result.new_exp}`,
        mana: `${result.old_mana} → ${result.new_mana}`,
        hp: `${result.old_hp} → ${result.new_hp}`
      });

      // Afficher un message pour les gains d'EXP significatifs
      const expGain = result.new_exp - result.old_exp;
      if (expGain > 0) {
        toast.success(`${result.pseudo} gagne ${expGain} EXP !`);
      }
    });

    toast.success("Match enregistré avec succès !");

  } catch (error) {
    // Gestion détaillée des erreurs
    console.error("Erreur lors du traitement du match:", {
      error,
      type: typeof error,
      isError: error instanceof Error,
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      stringified: JSON.stringify(error)
    });

    // Afficher un message d'erreur approprié à l'utilisateur
    const errorMessage = error instanceof Error ? error.message : "Erreur lors de la mise à jour des statistiques";
    toast.error(errorMessage);
    
    throw error;
  }
} 