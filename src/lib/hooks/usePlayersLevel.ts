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
        // Utiliser fetch avec des en-têtes anti-cache pour éviter la mise en cache
        const timestamp = new Date().getTime();
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/get_players_level?cacheBuster=${timestamp}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
            'Pragma': 'no-cache',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
          body: JSON.stringify({}),
          cache: 'no-store'
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Failed to fetch players: ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        
        if (!data) {
          throw new Error('No data returned from get_players_level');
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
        console.error('Error fetching player levels:', err);
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