export interface Partner {
  name: string;
  victories?: number;
  defeats?: number;
}

export interface PlayerStats {
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
  best_partner: Partner | null;
  worst_partner: Partner | null;
  best_victim: Partner | null;
  nemesis: Partner | null;
} 