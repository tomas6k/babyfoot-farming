import { usePlayers, Player } from './usePlayers';
import { useEffect, useState } from 'react';

export interface PlayerWithLevel extends Player {
  level: number;
  mana: number;
  hp: number;
}

export function usePlayersLevel() {
  const { players, loading: playersLoading, error: playersError } = usePlayers();
  const [playersWithLevel, setPlayersWithLevel] = useState<PlayerWithLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (playersLoading || playersError) {
      setLoading(playersLoading);
      setError(playersError);
      return;
    }

    const calculatePlayerStats = (player: Player): PlayerWithLevel => {
      // Algorithme simple pour calculer le niveau basé sur la date de création
      const daysSinceCreation = Math.floor(
        (Date.now() - new Date(player.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      const level = Math.min(100, Math.floor(daysSinceCreation / 7) + 1);
      const mana = Math.floor(level * 1.5);
      const hp = level * 2;

      return {
        ...player,
        level,
        mana,
        hp
      };
    };

    const enhancedPlayers = players.map(calculatePlayerStats);
    setPlayersWithLevel(enhancedPlayers);
    setLoading(false);
  }, [players, playersLoading, playersError]);

  return { players: playersWithLevel, loading, error };
} 