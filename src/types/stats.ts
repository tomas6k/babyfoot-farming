export interface BaseMatchStats {
  perfect_wins: Array<{
    player_id: string;
    pseudo: string;
    count: number;
  }>;
  perfect_losses: Array<{
    player_id: string;
    pseudo: string;
    count: number;
  }>;
  close_wins: Array<{
    player_id: string;
    pseudo: string;
    count: number;
  }>;
  close_losses: Array<{
    player_id: string;
    pseudo: string;
    count: number;
  }>;
  activity: {
    most_active: Array<{
      player_id: string;
      pseudo: string;
      match_count: number;
    }>;
    least_active: Array<{
      player_id: string;
      pseudo: string;
      match_count: number;
    }>;
  };
}

export interface ComplexStats {
  streaks: {
    longest_win_streak: Array<{
      player_id: string;
      pseudo: string;
      streak_length: number;
      start_date: string;
      end_date: string;
    }>;
    longest_lose_streak: Array<{
      player_id: string;
      pseudo: string;
      streak_length: number;
      start_date: string;
      end_date: string;
    }>;
  };
  positions: {
    attacker: {
      best: Array<{
        player_id: string;
        pseudo: string;
        wins: number;
        total_matches: number;
        win_rate: number;
      }>;
      worst: Array<{
        player_id: string;
        pseudo: string;
        defeats: number;
        total_matches: number;
        loss_rate: number;
      }>;
    };
    defender: {
      best: Array<{
        player_id: string;
        pseudo: string;
        wins: number;
        total_matches: number;
        win_rate: number;
      }>;
      worst: Array<{
        player_id: string;
        pseudo: string;
        defeats: number;
        total_matches: number;
        loss_rate: number;
      }>;
    };
  };
  pairs: {
    best: Array<{
      player1_id: string;
      player2_id: string;
      player1_pseudo: string;
      player2_pseudo: string;
      wins: number;
      total_matches: number;
      win_rate: number;
    }>;
    worst: Array<{
      player1_id: string;
      player2_id: string;
      player1_pseudo: string;
      player2_pseudo: string;
      defeats: number;
      total_matches: number;
      loss_rate: number;
    }>;
  };
}

export interface HistoricalStats {
  dessert: Array<{
    player_id: string;
    pseudo: string;
    total_matches: number;
    victories: number;
    win_rate: number;
  }>;
  dessert_looser: Array<{
    player_id: string;
    pseudo: string;
    total_matches: number;
    defeats: number;
    loss_rate: number;
  }>;
  first_blood: Array<{
    player_id: string;
    pseudo: string;
    match_count: number;
    victories: number;
    win_rate: number;
  }>;
  monte_cristo: Array<{
    player_id: string;
    pseudo: string;
    revenge_wins: number;
    revenge_opportunities: number;
    revenge_rate: number;
  }>;
  fidele: Array<{
    player_id: string;
    pseudo: string;
    favorite_partner_id: string;
    favorite_partner_pseudo: string;
    matches_together: number;
    victories_together: number;
    total_matches: number;
    fidelity_rate: number;
  }>;
  casanova: Array<{
    player_id: string;
    pseudo: string;
    distinct_partners: number;
    total_matches: number;
    partner_change_rate: number;
  }>;
  classicos: Array<{
    team1: {
      player1_id: string;
      player2_id: string;
      player1_pseudo: string;
      player2_pseudo: string;
      victories: number;
    };
    team2: {
      player1_id: string;
      player2_id: string;
      player1_pseudo: string;
      player2_pseudo: string;
      victories: number;
    };
    total_matches: number;
  }>;
} 