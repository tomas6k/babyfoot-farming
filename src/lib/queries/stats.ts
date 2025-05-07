import type { Database } from '@/types/supabase';
import { getSupabaseClient } from '@/lib/supabaseClient';

const supabase = getSupabaseClient();

export interface Partner {
  name: string;
  victories?: number;
  defeats?: number;
}

export interface PlayerStats {
  // Informations générales
  player_id: string;
  pseudo: string;
  exp: number;
  total_exp_gained: number;

  // Niveau et rang
  level: number;
  current_level_min_exp: number;
  next_level_exp: number;
  rank_title: string;
  rank_description: string;
  rank_illustration: string;

  // Statistiques globales
  total_matches: number;
  victories: number;
  defeats: number;
  goals_for: number;
  goals_against: number;

  // Statistiques par rôle
  total_matches_attacker: number;
  victories_attacker: number;
  defeats_attacker: number;
  goals_for_attacker: number;
  goals_against_attacker: number;
  total_matches_defender: number;
  victories_defender: number;
  defeats_defender: number;
  goals_for_defender: number;
  goals_against_defender: number;

  // Partenaires et adversaires
  best_partner_id: string | null;
  best_partner_pseudo: string | null;
  best_partner_matches: number;
  best_partner_victories: number;
  worst_partner_id: string | null;
  worst_partner_pseudo: string | null;
  worst_partner_matches: number;
  worst_partner_victories: number;
  best_opponent_id: string | null;
  best_opponent_pseudo: string | null;
  best_opponent_matches: number;
  best_opponent_victories: number;
  worst_opponent_id: string | null;
  worst_opponent_pseudo: string | null;
  worst_opponent_matches: number;
  worst_opponent_victories: number;
}

export async function getPlayerStats(month?: string): Promise<PlayerStats[]> {
  try {
    console.log("getPlayerStats called with month:", month);
    
    const url = new URL('/api/stats', window.location.origin);
    if (month) {
      url.searchParams.append('month', month);
    }
    
    console.log("Fetching stats from URL:", url.toString());

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch player stats');
    }

    const data = await response.json();
    console.log("Raw data received from API:", data);
    
    return data as PlayerStats[];
  } catch (error) {
    console.error('Error in getPlayerStats:', error);
    throw error;
  }
}

export async function getBaseMatchStats(month?: string) {
  try {
    let p_date = null;
    let p_date_start = null;
    let p_date_end = null;

    if (month) {
      p_date = new Date(month);
    }

    console.log('Calling get_base_match_stats with params:', { p_date, p_date_start, p_date_end });

    const { data, error } = await supabase
      .rpc('get_base_match_stats', {
        p_date,
        p_date_start,
        p_date_end
      });

    if (error) {
      console.error('Supabase RPC error in getBaseMatchStats:', error.message, error.details, error.hint);
      throw new Error(`Failed to fetch base match stats: ${error.message}`);
    }

    if (!data) {
      console.warn('No data returned from get_base_match_stats');
      return {
        perfect_wins: [],
        perfect_losses: [],
        close_wins: [],
        close_losses: [],
        activity: {
          most_active: [],
          least_active: []
        }
      };
    }

    return data;
  } catch (error) {
    console.error('Error in getBaseMatchStats:', error);
    throw error;
  }
}

export async function getComplexStats(month?: string) {
  try {
    let target_start_date = null;
    let target_end_date = null;
    let target_player_id = null;

    if (month) {
      target_start_date = new Date(month);
    }

    console.log('Calling get_complex_stats with params:', { target_start_date, target_end_date, target_player_id });

    const { data, error } = await supabase
      .rpc('get_complex_stats', {
        target_start_date,
        target_end_date,
        target_player_id
      });

    if (error) {
      console.error('Supabase RPC error in getComplexStats:', error.message, error.details, error.hint);
      throw new Error(`Failed to fetch complex stats: ${error.message}`);
    }

    if (!data) {
      console.warn('No data returned from get_complex_stats');
      return {
        streaks: {
          longest_win_streak: [],
          longest_lose_streak: []
        },
        positions: {
          attacker: { best: [], worst: [] },
          defender: { best: [], worst: [] }
        },
        pairs: {
          best: [],
          worst: []
        }
      };
    }

    return data;
  } catch (error) {
    console.error('Error in getComplexStats:', error);
    throw error;
  }
}

export async function getHistoricalStats(month?: string) {
  try {
    let target_start_date = null;
    let target_end_date = null;
    let target_player_id = null;

    if (month) {
      target_start_date = new Date(month);
    }

    console.log('Calling get_historical_stats with params:', { target_start_date, target_end_date, target_player_id });

    const { data, error } = await supabase
      .rpc('get_historical_stats', {
        target_start_date,
        target_end_date,
        target_player_id
      });

    if (error) {
      console.error('Supabase RPC error in getHistoricalStats:', error.message, error.details, error.hint);
      throw new Error(`Failed to fetch historical stats: ${error.message}`);
    }

    if (!data) {
      console.warn('No data returned from get_historical_stats');
      return {
        dessert: [],
        first_blood: [],
        monte_cristo: [],
        fidele: [],
        casanova: [],
        classicos: []
      };
    }

    // Log détaillé des données historiques
    console.log('Historical stats received:', {
      casanova: data.casanova || [],
      dessert: data.dessert || [],
      first_blood: data.first_blood || [],
      monte_cristo: data.monte_cristo || [],
      fidele: data.fidele || [],
      classicos: data.classicos || []
    });

    return data;
  } catch (error) {
    console.error('Error in getHistoricalStats:', error);
    throw error;
  }
} 