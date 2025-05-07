export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      players: {
        Row: {
          id: string
          user_id: string | null
          pseudo: string
          exp: number
          mana: number
          hp: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          pseudo: string
          exp?: number
          mana?: number
          hp?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          pseudo?: string
          exp?: number
          mana?: number
          hp?: number
          created_at?: string
          updated_at?: string
        }
      }
      levels: {
        Row: {
          description: string | null
          exp_given: number
          illustration: string | null
          level: number
          required_exp: number
          title: string | null
        }
        Insert: {
          description?: string | null
          exp_given: number
          illustration?: string | null
          level: number
          required_exp: number
          title?: string | null
        }
        Update: {
          description?: string | null
          exp_given?: number
          illustration?: string | null
          level?: number
          required_exp?: number
          title?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      levels_with_info: {
        Row: {
          display_description: string | null
          display_title: string | null
          display_illustration: string | null
          exp_given: number
          level: number
          required_exp: number
        }
        Relationships: []
      }
    }
    Functions: {
      get_player_stats: {
        Args: {
          p_player_id: string | null
          p_month: string | null
        }
        Returns: {
          player_id: string
          pseudo: string
          exp: number
          total_matches: number
          victories: number
          defeats: number
          goals_for: number
          goals_against: number
          total_matches_attacker: number
          victories_attacker: number
          defeats_attacker: number
          goals_for_attacker: number
          goals_against_attacker: number
          total_matches_defender: number
          victories_defender: number
          defeats_defender: number
          goals_for_defender: number
          goals_against_defender: number
          best_partner_id: string | null
          best_partner_pseudo: string | null
          best_partner_matches: number
          best_partner_victories: number
          worst_partner_id: string | null
          worst_partner_pseudo: string | null
          worst_partner_matches: number
          worst_partner_victories: number
          best_opponent_id: string | null
          best_opponent_pseudo: string | null
          best_opponent_matches: number
          best_opponent_victories: number
          worst_opponent_id: string | null
          worst_opponent_pseudo: string | null
          worst_opponent_matches: number
          worst_opponent_victories: number
        }[]
      }
      get_level_info: {
        Args: Record<PropertyKey, never>
        Returns: {
          level: number
          required_exp: number
          exp_given: number
          display_title: string
          display_description: string
          display_illustration: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
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