import { Database } from '../types/supabase';

type DBPlayerStats = Database['public']['Functions']['get_player_stats']['Returns'][0];

export interface LeaderboardPlayerStats {
  player_id: string;
  pseudo: string;
  exp: number;
  exp_gained: number;
  victories: number;
  defeats: number;
  win_ratio: number;
  goals_scored: number;
  goals_conceded: number;
  total_matches: number;
  best_partner: {
    name: string;
    victories: number;
  } | null;
  worst_partner: {
    name: string;
    defeats: number;
  } | null;
  best_victim: {
    name: string;
    victories: number;
  } | null;
  nemesis: {
    name: string;
    defeats: number;
  } | null;
}

export function adaptPlayerStats(stats: DBPlayerStats): LeaderboardPlayerStats {
  // Calculer le nombre total de matchs
  const total_matches = stats.victories + stats.defeats;
  
  // Calculer le ratio de victoires
  const win_ratio = total_matches > 0 ? (stats.victories / total_matches) * 100 : 0;

  // Pour l'instant, on utilise l'exp totale car on n'a pas l'historique
  const exp_gained = stats.exp;

  return {
    player_id: stats.player_id,
    pseudo: stats.pseudo,
    exp: stats.exp,
    exp_gained,
    victories: stats.victories,
    defeats: stats.defeats,
    win_ratio: Number(win_ratio.toFixed(2)),
    goals_scored: stats.goals_for,
    goals_conceded: stats.goals_against,
    total_matches,
    best_partner: stats.best_partner_pseudo ? {
      name: stats.best_partner_pseudo,
      victories: stats.best_partner_victories
    } : null,
    worst_partner: stats.worst_partner_pseudo ? {
      name: stats.worst_partner_pseudo,
      defeats: stats.worst_partner_victories
    } : null,
    best_victim: stats.best_opponent_pseudo ? {
      name: stats.best_opponent_pseudo,
      victories: stats.best_opponent_victories
    } : null,
    nemesis: stats.worst_opponent_pseudo ? {
      name: stats.worst_opponent_pseudo,
      defeats: stats.worst_opponent_victories
    } : null
  };
} 