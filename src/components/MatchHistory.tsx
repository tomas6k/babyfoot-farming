import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { createClient } from '@/utils/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePlayers } from '@/hooks/usePlayers';

const ITEMS_PER_PAGE = 10;

interface MatchHistoryItem {
  id: string;
  date: string;
  score_white: number;
  score_black: number;
  white_team_level: number;
  black_team_level: number;
  white_attacker_pseudo: string;
  white_attacker_level: number;
  white_attacker_exp_gained: number;
  white_defender_pseudo: string;
  white_defender_level: number;
  white_defender_exp_gained: number;
  black_attacker_pseudo: string;
  black_attacker_level: number;
  black_attacker_exp_gained: number;
  black_defender_pseudo: string;
  black_defender_level: number;
  black_defender_exp_gained: number;
}

const supabase = createClient();

export function MatchHistory() {
  const [matches, setMatches] = useState<MatchHistoryItem[]>([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  
  const { players, loading: playersLoading } = usePlayers();

  useEffect(() => {
    async function fetchMatches() {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('Fetching matches with params:', {
          p_player_id: selectedPlayer,
          p_page_number: currentPage,
          p_items_per_page: ITEMS_PER_PAGE
        });
        
        const { data, error: rpcError } = await supabase.rpc('get_match_history_with_levels', {
          p_player_id: selectedPlayer,
          p_page_number: currentPage,
          p_items_per_page: ITEMS_PER_PAGE
        });

        console.log('Response data:', data);
        console.log('Response error:', rpcError);

        if (rpcError) throw rpcError;
        
        if (data) {
          console.log('Setting matches:', data.matches);
          console.log('Setting total matches:', data.total_count);
          setMatches(data.matches || []);
          setTotalMatches(data.total_count || 0);
        }
      } catch (err) {
        console.error('Erreur détaillée lors du chargement des matchs:', err);
        setError(err instanceof Error ? err.message : "Une erreur est survenue lors du chargement des matchs");
      } finally {
        setIsLoading(false);
      }
    }

    fetchMatches();
  }, [currentPage, selectedPlayer]);

  const totalPages = Math.max(1, Math.ceil(totalMatches / ITEMS_PER_PAGE));

  const handlePageChange = (newPage: number) => {
    setCurrentPage(Math.max(1, Math.min(newPage, totalPages)));
  };

  if (error) {
    return (
      <div className="text-red-500 p-4 rounded-lg bg-red-50">
        <p className="font-semibold">Erreur:</p>
        <p>{error}</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => {
            setError(null);
            setCurrentPage(1);
          }}
        >
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-4 items-center">
        <Select
          value={selectedPlayer || 'all'}
          onValueChange={(value) => {
            setSelectedPlayer(value === 'all' ? null : value);
            setCurrentPage(1);
          }}
          disabled={playersLoading}
        >
          <SelectTrigger className="w-[275px]">
            <SelectValue placeholder="Filtrer par joueur" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les joueurs</SelectItem>
            {players?.map((player) => (
              <SelectItem key={player.id} value={player.id}>
                {player.pseudo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">Chargement de l'historique...</p>
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Aucun match trouvé
        </div>
      ) : (
        <>
          <div className="grid gap-6">
            {matches.map((match) => (
              <Card key={match.id} className="overflow-hidden">
                <CardHeader className="bg-muted">
                  <CardTitle className="flex justify-between items-center">
                    <span>
                      {format(new Date(match.date), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}
                    </span>
                    <span className="text-2xl font-bold">
                      {match.score_white} - {match.score_black}
                    </span>
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="grid md:grid-cols-2 gap-6 pt-6">
                  {/* Équipe Blanche */}
                  <div className={`p-4 rounded-lg ${match.score_white > match.score_black ? 'bg-green-500/10' : 'bg-gray-500/10'}`}>
                    <h3 className="text-lg font-semibold mb-4">Équipe Blanche (Niv. {match.white_team_level})</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-medium">⚔️ {match.white_attacker_pseudo}</span>
                          <span className="text-sm ml-2">Niv. {match.white_attacker_level}</span>
                        </div>
                        {match.white_attacker_exp_gained > 0 && (
                          <span className="text-green-500">+{match.white_attacker_exp_gained} EXP</span>
                        )}
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-medium">🛡️ {match.white_defender_pseudo}</span>
                          <span className="text-sm ml-2">Niv. {match.white_defender_level}</span>
                        </div>
                        {match.white_defender_exp_gained > 0 && (
                          <span className="text-green-500">+{match.white_defender_exp_gained} EXP</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Équipe Noire */}
                  <div className={`p-4 rounded-lg ${match.score_black > match.score_white ? 'bg-green-500/10' : 'bg-gray-500/10'}`}>
                    <h3 className="text-lg font-semibold mb-4">Équipe Noire (Niv. {match.black_team_level})</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-medium">⚔️ {match.black_attacker_pseudo}</span>
                          <span className="text-sm ml-2">Niv. {match.black_attacker_level}</span>
                        </div>
                        {match.black_attacker_exp_gained > 0 && (
                          <span className="text-green-500">+{match.black_attacker_exp_gained} EXP</span>
                        )}
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-medium">🛡️ {match.black_defender_pseudo}</span>
                          <span className="text-sm ml-2">Niv. {match.black_defender_level}</span>
                        </div>
                        {match.black_defender_exp_gained > 0 && (
                          <span className="text-green-500">+{match.black_defender_exp_gained} EXP</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Précédent
              </Button>
              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={page === currentPage ? "default" : "outline"}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Suivant
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
} 