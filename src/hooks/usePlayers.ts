import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface Player {
  id: string;
  pseudo: string;
  created_at: string;
}

export function usePlayers() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const { data, error } = await supabase
          .from('players')
          .select('*')
          .order('pseudo');

        if (error) throw error;
        setPlayers(data || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Une erreur est survenue'));
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, []);

  return { players, loading, error };
} 