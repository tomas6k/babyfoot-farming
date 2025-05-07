import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabaseClient';

const supabase = getSupabaseClient();

export interface PlayerLevel {
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

export function usePlayersLevel() {
  const [players, setPlayers] = useState<PlayerLevel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchPlayers() {
      try {
        const { data, error } = await supabase.rpc('get_players_level');
        
        if (error) {
          throw error;
        }

        // Trier les joueurs par niveau puis par expérience
        const sortedPlayers = (data as PlayerLevel[]).sort((a: PlayerLevel, b: PlayerLevel) => {
          if (a.level !== b.level) {
            return b.level - a.level;
          }
          return b.exp - a.exp;
        });

        setPlayers(sortedPlayers);
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch players'));
        setIsLoading(false);
      }
    }

    fetchPlayers();

    // Mettre en place une souscription pour les mises à jour en temps réel
    const playersSubscription = supabase
      .channel('players_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'players'
      }, () => {
        // Actualiser les données quand il y a des changements
        fetchPlayers();
      })
      .subscribe();

    return () => {
      playersSubscription.unsubscribe();
    };
  }, []);

  return { players, isLoading, error };
} 