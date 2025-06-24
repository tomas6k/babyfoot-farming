import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePlayers } from '@/hooks/usePlayers';
import { Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

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

export function MatchHistory() {
  const [matches, setMatches] = useState<MatchHistoryItem[]>([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [matchToDelete, setMatchToDelete] = useState<string | null>(null);
  
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

  const handleDeleteMatch = async (matchId: string) => {
    try {
      setIsDeleting(true);
      const { data, error } = await supabase.rpc('delete_game', {
        p_match_id: matchId
      });

      if (error) throw error;

      toast.success("Match supprimé avec succès");
      // Recharger les matchs
      setCurrentPage(1);
    } catch (err) {
      console.error('Erreur lors de la suppression du match:', err);
      toast.error(err instanceof Error ? err.message : "Une erreur est survenue lors de la suppression du match");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setMatchToDelete(null);
    }
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
    <div className="space-y-4 w-full">
      <div className="flex flex-col sm:flex-row gap-2 items-center justify-between w-full">
        <Select
          value={selectedPlayer || 'all'}
          onValueChange={(value) => {
            setSelectedPlayer(value === 'all' ? null : value);
            setCurrentPage(1);
          }}
          disabled={playersLoading}
        >
          <SelectTrigger className="w-full sm:w-[275px]">
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
          <p className="mt-2 text-sm">Chargement de l'historique...</p>
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-sm">
          Aucun match trouvé
        </div>
      ) : (
        <>
          <div className="grid gap-4">
            {matches.map((match, index) => (
              <Card key={match.id} className="overflow-hidden w-full rounded-lg border bg-background shadow-sm">
                <CardHeader className="bg-muted px-3 py-2">
                  <CardTitle className="flex flex-col items-center gap-1 w-full">
                    <span className="text-2xl font-bold text-center w-full">
                      {match.score_white} - {match.score_black}
                    </span>
                    <span className="text-xs text-muted-foreground text-center w-full">
                      {format(new Date(match.date), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
                    </span>
                    {index === 0 && (
                      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => setMatchToDelete(match.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Supprimer le match</DialogTitle>
                            <DialogDescription>
                              Êtes-vous sûr de vouloir supprimer ce match ? Cette action restaurera les statistiques des joueurs à leur état avant le match.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button
                              variant="ghost"
                              onClick={() => setShowDeleteDialog(false)}
                              disabled={isDeleting}
                            >
                              Annuler
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => handleDeleteMatch(match.id)}
                              disabled={isDeleting}
                            >
                              {isDeleting ? "Suppression..." : "Supprimer"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 py-2 text-xs md:text-sm">
                  <div className="grid md:grid-cols-2 gap-6">
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
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {/* Pagination adaptée mobile */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-4">
              <Button
                variant="outline"
              size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              className="w-full sm:w-auto"
              >
                Précédent
              </Button>
            <span className="text-xs md:text-sm">
              Page {currentPage} / {totalPages}
            </span>
              <Button
                variant="outline"
              size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              className="w-full sm:w-auto"
              >
                Suivant
              </Button>
            </div>
        </>
      )}
    </div>
  );
} 