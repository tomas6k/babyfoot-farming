export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      exp_decay_history: {
        Row: {
          decay_date: string | null
          exp_after: number | null
          exp_before: number | null
          id: string
          mana_added: number | null
          matches_played: number | null
          player_id: string | null
        }
        Insert: {
          decay_date?: string | null
          exp_after?: number | null
          exp_before?: number | null
          id?: string
          mana_added?: number | null
          matches_played?: number | null
          player_id?: string | null
        }
        Update: {
          decay_date?: string | null
          exp_after?: number | null
          exp_before?: number | null
          id?: string
          mana_added?: number | null
          matches_played?: number | null
          player_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exp_decay_history_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          }
        ]
      }
      game_config: {
        Row: {
          created_at: string
          description: string | null
          id: number
          key: string
          updated_at: string
          value: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          key: string
          updated_at?: string
          value: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          key?: string
          updated_at?: string
          value?: number
        }
        Relationships: []
      }
      levels: {
        Row: {
          description: string | null
          exp_given: number
          illustration: string | null
          level: number
          min_exp: number
          title: string | null
        }
        Insert: {
          description?: string | null
          exp_given: number
          illustration?: string | null
          level: number
          min_exp: number
          title?: string | null
        }
        Update: {
          description?: string | null
          exp_given?: number
          illustration?: string | null
          level?: number
          min_exp?: number
          title?: string | null
        }
        Relationships: []
      }
      matches: {
        Row: {
          added_by: string | null
          black_attacker: string
          black_attacker_exp_after: number | null
          black_attacker_exp_before: number | null
          black_attacker_hp_after: number | null
          black_attacker_hp_before: number | null
          black_attacker_mana_after: number | null
          black_attacker_mana_before: number | null
          black_defender: string
          black_defender_exp_after: number | null
          black_defender_exp_before: number | null
          black_defender_hp_after: number | null
          black_defender_hp_before: number | null
          black_defender_mana_after: number | null
          black_defender_mana_before: number | null
          created_at: string
          date: string
          id: string
          score_black: number
          score_white: number
          updated_at: string
          white_attacker: string
          white_attacker_exp_after: number | null
          white_attacker_exp_before: number | null
          white_attacker_hp_after: number | null
          white_attacker_hp_before: number | null
          white_attacker_mana_after: number | null
          white_attacker_mana_before: number | null
          white_defender: string
          white_defender_exp_after: number | null
          white_defender_exp_before: number | null
          white_defender_hp_after: number | null
          white_defender_hp_before: number | null
          white_defender_mana_after: number | null
          white_defender_mana_before: number | null
        }
        Insert: {
          added_by?: string | null
          black_attacker: string
          black_attacker_exp_after?: number | null
          black_attacker_exp_before?: number | null
          black_attacker_hp_after?: number | null
          black_attacker_hp_before?: number | null
          black_attacker_mana_after?: number | null
          black_attacker_mana_before?: number | null
          black_defender: string
          black_defender_exp_after?: number | null
          black_defender_exp_before?: number | null
          black_defender_hp_after?: number | null
          black_defender_hp_before?: number | null
          black_defender_mana_after?: number | null
          black_defender_mana_before?: number | null
          created_at?: string
          date?: string
          id?: string
          score_black: number
          score_white: number
          updated_at?: string
          white_attacker: string
          white_attacker_exp_after?: number | null
          white_attacker_exp_before?: number | null
          white_attacker_hp_after?: number | null
          white_attacker_hp_before?: number | null
          white_attacker_mana_after?: number | null
          white_attacker_mana_before?: number | null
          white_defender: string
          white_defender_exp_after?: number | null
          white_defender_exp_before?: number | null
          white_defender_hp_after?: number | null
          white_defender_hp_before?: number | null
          white_defender_mana_after?: number | null
          white_defender_mana_before?: number | null
        }
        Update: {
          added_by?: string | null
          black_attacker?: string
          black_attacker_exp_after?: number | null
          black_attacker_exp_before?: number | null
          black_attacker_hp_after?: number | null
          black_attacker_hp_before?: number | null
          black_attacker_mana_after?: number | null
          black_attacker_mana_before?: number | null
          black_defender?: string
          black_defender_exp_after?: number | null
          black_defender_exp_before?: number | null
          black_defender_hp_after?: number | null
          black_defender_hp_before?: number | null
          black_defender_mana_after?: number | null
          black_defender_mana_before?: number | null
          created_at?: string
          date?: string
          id?: string
          score_black?: number
          score_white?: number
          updated_at?: string
          white_attacker?: string
          white_attacker_exp_after?: number | null
          white_attacker_exp_before?: number | null
          white_attacker_hp_after?: number | null
          white_attacker_hp_before?: number | null
          white_attacker_mana_after?: number | null
          white_attacker_mana_before?: number | null
          white_defender?: string
          white_defender_exp_after?: number | null
          white_defender_exp_before?: number | null
          white_defender_hp_after?: number | null
          white_defender_hp_before?: number | null
          white_defender_mana_after?: number | null
          white_defender_mana_before?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_black_attacker_fkey"
            columns: ["black_attacker"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_black_defender_fkey"
            columns: ["black_defender"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_white_attacker_fkey"
            columns: ["white_attacker"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_white_defender_fkey"
            columns: ["white_defender"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          }
        ]
      }
      players: {
        Row: {
          created_at: string
          exp: number
          hp: number
          id: string
          mana: number
          pseudo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          exp?: number
          hp?: number
          id?: string
          mana?: number
          pseudo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          exp?: number
          hp?: number
          id?: string
          mana?: number
          pseudo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      test: {
        Row: {
          created_at: string
          id: number
          message: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          message?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          message?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      levels_with_info: {
        Row: {
          display_description: string | null
          display_illustration: string | null
          display_title: string | null
          exp_given: number | null
          level: number | null
          required_exp: number | null
          source_level: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      delete_game: {
        Args: { p_match_id: string; p_user_id: string }
        Returns: boolean
      }
      get_global_stats: {
        Args: { target_month?: string }
        Returns: Json
      }
      get_level_info: {
        Args: Record<PropertyKey, never> | { p_exp: number }
        Returns: {
          level: number
          required_exp: number
          exp_given: number
          display_title: string
          display_description: string
          display_illustration: string
        }[]
      }
      get_player_level: {
        Args: { p_player_id: string } | { player_exp: number }
        Returns: {
          level: number
          title: string
        }[]
      }
      get_player_stats: {
        Args: { p_month?: string; p_player_id?: string }
        Returns: {
          player_id: string
          pseudo: string
          exp: number
          victories: number
          defeats: number
          goals_for: number
          goals_against: number
          white_attacker_victories: number
          white_attacker_defeats: number
          white_attacker_goals_for: number
          white_attacker_goals_against: number
          white_defender_victories: number
          white_defender_defeats: number
          white_defender_goals_for: number
          white_defender_goals_against: number
          black_attacker_victories: number
          black_attacker_defeats: number
          black_attacker_goals_for: number
          black_attacker_goals_against: number
          black_defender_victories: number
          black_defender_defeats: number
          black_defender_goals_for: number
          black_defender_goals_against: number
          best_partner_id: string
          best_partner_pseudo: string
          best_partner_victories: number
          best_partner_defeats: number
          worst_partner_id: string
          worst_partner_pseudo: string
          worst_partner_victories: number
          worst_partner_defeats: number
          best_opponent_id: string
          best_opponent_pseudo: string
          best_opponent_victories: number
          best_opponent_defeats: number
          worst_opponent_id: string
          worst_opponent_pseudo: string
          worst_opponent_victories: number
          worst_opponent_defeats: number
          level: number
          title: string
        }[]
      }
      get_players_stats: {
        Args: { target_month: string }
        Returns: {
          player_id: string
          pseudo: string
          exp: number
          exp_gained: number
          victories: number
          defeats: number
          win_ratio: number
          goals_scored: number
          goals_conceded: number
          total_matches: number
          best_partner: Json
          worst_partner: Json
          best_victim: Json
          nemesis: Json
        }[]
      }
      get_replayability: {
        Args:
          | { p_player_id: string }
          | { player_id: string; partner_id: string }
        Returns: number
      }
      populate_levels: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      process_match: {
        Args: {
          p_white_attacker: string
          p_white_defender: string
          p_black_attacker: string
          p_black_defender: string
          p_score_white: number
          p_score_black: number
          p_added_by?: string
        }
        Returns: {
          player_id: string
          pseudo: string
          old_exp: number
          new_exp: number
          old_mana: number
          new_mana: number
          old_hp: number
          new_hp: number
        }[]
      }
      reset_hp_mana: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      weekly_decay: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      player_update_result: {
        player_id: string | null
        old_exp: number | null
        new_exp: number | null
        old_mana: number | null
        new_mana: number | null
        old_hp: number | null
        new_hp: number | null
        old_level: number | null
        new_level: number | null
      }
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const 