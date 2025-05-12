import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Image from "next/image";
import { BaseMatchStats, ComplexStats, HistoricalStats } from "@/types/stats";
import { useEffect, useState } from "react";
import { getBaseMatchStats, getComplexStats, getHistoricalStats } from "@/lib/queries/stats";
import { Button } from "./ui/button";
import { RefreshCcw } from "lucide-react";

interface SeasonTitlesProps {
  month?: string;
}

interface Pair {
  player1_pseudo: string;
  player2_pseudo: string;
}

// Fonction utilitaire pour construire une carte de titre
function TitleCard({ 
  badge, 
  title, 
  description, 
  holders, 
  statValue, 
  statTooltip,
  hasHolder = true
}: { 
  badge: string,
  title: string, 
  description: string, 
  holders: string | string[], 
  statValue: string, 
  statTooltip: string,
  hasHolder?: boolean
}) {
  return (
    <Card className="overflow-hidden border-4 border-[#8B7355] dark:border-white">
      <div className="flex flex-col items-center p-4">
        {/* Image/Badge avec tooltip */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="mb-3 text-center">
                <div className="flex justify-center items-center h-20 w-20 mb-2">
                  <Image 
                    src={`/assets/badges/${badge}.png`} 
                    alt={title} 
                    width={80} 
                    height={80} 
                    className={`object-contain ${!hasHolder ? 'grayscale' : ''}`}
                  />
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{hasHolder ? description : '...'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {/* Nom du titre avec tooltip */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <h3 className="text-lg font-bold mb-2 text-center w-full">{title}</h3>
            </TooltipTrigger>
            <TooltipContent>
              <p>{hasHolder ? description : '...'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {/* Tenants du titre */}
        <div className="text-center font-medium mb-3">
          {hasHolder ? (
            Array.isArray(holders) ? (
              holders.map((holder, index) => (
                <div key={index}>
                  {holder}
                  {index < holders.length - 1 && <span className="mx-1">&</span>}
                </div>
              ))
            ) : (
              <p>{holders}</p>
            )
          ) : (
            <p>???</p>
          )}
        </div>
        
        {/* Statistique - seulement affichée s'il y a un détenteur */}
        {hasHolder && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-muted/50 px-3 py-1 rounded-full text-sm text-center">
                  {statValue}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{statTooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </Card>
  );
}

export function SeasonTitles({ month }: SeasonTitlesProps) {
  const [baseStats, setBaseStats] = useState<BaseMatchStats | null>(null);
  const [complexStats, setComplexStats] = useState<ComplexStats | null>(null);
  const [historicalStats, setHistoricalStats] = useState<HistoricalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        setError(null);

        // Convertir le mois au format Date
        const monthDate = month ? new Date(month + '-01') : undefined;
        
        // Obtenir le premier jour du mois suivant pour l'utiliser comme date de fin
        let nextMonthDate;
        if (monthDate) {
          nextMonthDate = new Date(monthDate);
          nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
        }

        // Récupérer les statistiques avec les nouvelles dates
        const historicalData = await getHistoricalStats(
          undefined, // Pas de joueur spécifique
          monthDate,  // Premier jour du mois comme date de début
          nextMonthDate // Premier jour du mois suivant comme date de fin
        );
        setHistoricalStats(historicalData);

        const baseData = await getBaseMatchStats(month);
        setBaseStats(baseData);

        const complexData = await getComplexStats(month);
        setComplexStats(complexData);
      } catch (err) {
        console.error("Erreur lors du chargement des statistiques:", err);
        setError(err instanceof Error ? err : new Error("Une erreur est survenue"));
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [month, refreshCounter]);

  const handleRefresh = () => {
    setRefreshCounter(prev => prev + 1);
  };

  if (loading) {
    return <div className="text-center">Chargement des statistiques en cours...</div>;
  }

  if (error) {
    return (
      <div className="text-center">
        <div className="text-red-500 mb-2">{error.message}</div>
        <div className="text-sm text-gray-500">
          Veuillez réessayer plus tard ou contacter l'administrateur si le problème persiste.
        </div>
      </div>
    );
  }

  if (!baseStats || !complexStats || !historicalStats) {
    return (
      <div className="text-center">
        Aucune statistique n'est disponible pour le moment
        <Button variant="outline" onClick={handleRefresh} className="mt-4 ml-4">
          <RefreshCcw className="mr-2 h-4 w-4" /> Réessayer
        </Button>
      </div>
    );
  }

  // Logs de débogage
  console.log('Stats:', { baseStats, complexStats, historicalStats });

  // Fonction utilitaire pour formater les statistiques
  const formatStatValue = (stat: number | undefined, type: 'percentage' | 'count'): string => {
    if (stat === undefined) return 'N/A';
    if (type === 'percentage') {
      return `${stat.toFixed(1)}%`;
    }
    return stat.toString();
  };

  // Fonction utilitaire pour extraire les pseudos des joueurs
  const getPlayerPseudos = (players: any[]): string[] => {
    if (!players || !Array.isArray(players) || players.length === 0) return [];
    return players.map(player => player?.pseudo || 'Inconnu');
  };

  // Fonction utilitaire pour vérifier si une paire est valide
  const isValidPair = (pair: any[]): boolean => {
    return Array.isArray(pair) && pair.length > 0 && pair[0]?.player1_pseudo && pair[0]?.player2_pseudo;
  };

  // Ajout de fonctions utilitaires pour vérifier si les données existent
  const hasValidTeamTitles = () => {
    return (
      (complexStats?.pairs?.best?.length > 0) || 
      (complexStats?.pairs?.worst?.length > 0) || 
      (historicalStats?.classicos?.length > 0)
    );
  };

  const hasValidPositionTitles = () => {
    return (
      (complexStats?.positions?.attacker?.best?.length > 0) || 
      (complexStats?.positions?.attacker?.worst?.length > 0) || 
      (complexStats?.positions?.defender?.best?.length > 0) || 
      (complexStats?.positions?.defender?.worst?.length > 0)
    );
  };

  const hasValidIndividualTitles = () => {
    return (
      (baseStats?.perfect_wins?.length > 0) ||
      (baseStats?.perfect_losses?.length > 0) ||
      (baseStats?.close_wins?.length > 0) ||
      (baseStats?.close_losses?.length > 0) ||
      (complexStats?.streaks?.longest_win_streak?.length > 0) ||
      (complexStats?.streaks?.longest_lose_streak?.length > 0) ||
      (baseStats?.activity?.most_active?.length > 0) ||
      (baseStats?.activity?.least_active?.length > 0) ||
      (historicalStats?.dessert?.length > 0) ||
      (historicalStats?.dessert_looser?.length > 0) ||
      (historicalStats?.first_blood?.length > 0) ||
      (historicalStats?.monte_cristo?.length > 0) ||
      (historicalStats?.fidele?.length > 0) ||
      (historicalStats?.casanova?.length > 0)
    );
  };

  return (
    <div className="retro-container retro-section">
      <div className="flex justify-between items-center mb-4">
        <h2 className="retro-section-title text-left">Titres de la saison</h2>
        <Button variant="outline" onClick={handleRefresh} size="sm">
          <RefreshCcw className="mr-2 h-4 w-4" /> Rafraîchir
        </Button>
      </div>
      
      <div className="space-y-8">
        {/* Titres d'équipe - toujours afficher */}
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-left">Titres d'équipe</h3>
          <div className="retro-grid-2">
            {/* La Royauté */}
            <TitleCard
              badge="royaute"
              title="La Royauté"
              description="Meilleure paire de la saison"
              holders={complexStats?.pairs?.best?.length > 0 ? 
                complexStats.pairs.best.map(pair => `${pair.player1_pseudo} & ${pair.player2_pseudo}`) : 
                []
              }
              statValue={
                complexStats?.pairs?.best?.length > 0 
                  ? `${formatStatValue(complexStats.pairs.best[0].win_rate, 'percentage')} taux B de réussite`
                  : ''
              }
              statTooltip={
                complexStats?.pairs?.best?.length > 0 
                  ? `${complexStats.pairs.best[0].wins} victoires sur ${complexStats.pairs.best[0].total_matches} matchs`
                  : ''
              }
              hasHolder={complexStats?.pairs?.best?.length > 0}
            />

            {/* Les Gueux */}
            <TitleCard
              badge="gueux"
              title="Les Gueux"
              description="Pire paire de la saison"
              holders={complexStats?.pairs?.worst?.length > 0 ? 
                complexStats.pairs.worst.map(pair => `${pair.player1_pseudo} & ${pair.player2_pseudo}`) :
                []
              }
              statValue={
                complexStats?.pairs?.worst?.length > 0 
                  ? `${formatStatValue(complexStats.pairs.worst[0].loss_rate, 'percentage')} taux B d'échec`
                  : ''
              }
              statTooltip={
                complexStats?.pairs?.worst?.length > 0 
                  ? `${complexStats.pairs.worst[0].defeats} défaites sur ${complexStats.pairs.worst[0].total_matches} matchs`
                  : ''
              }
              hasHolder={complexStats?.pairs?.worst?.length > 0}
            />
          </div>
        </div>

        {/* Titres par position - toujours afficher */}
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-left">Titres par position</h3>
          <div className="retro-grid-4">
            {/* Messire */}
            <TitleCard
              badge="messire"
              title="Messire"
              description="Meilleur attaquant de la saison"
              holders={complexStats?.positions?.attacker?.best?.length > 0 ? getPlayerPseudos(complexStats.positions.attacker.best) : []}
              statValue={
                complexStats?.positions?.attacker?.best?.length > 0 
                  ? `${formatStatValue(complexStats.positions.attacker.best[0].win_rate, 'percentage')} taux B de réussite`
                  : ''
              }
              statTooltip={
                complexStats?.positions?.attacker?.best?.length > 0 
                  ? `${complexStats.positions.attacker.best[0].wins} victoires sur ${complexStats.positions.attacker.best[0].total_matches} matchs`
                  : ''
              }
              hasHolder={complexStats?.positions?.attacker?.best?.length > 0}
            />

            {/* Le Charpentier */}
            <TitleCard
              badge="charpentier"
              title="Le Charpentier"
              description="Pire attaquant de la saison"
              holders={complexStats?.positions?.attacker?.worst?.length > 0 ? getPlayerPseudos(complexStats.positions.attacker.worst) : []}
              statValue={
                complexStats?.positions?.attacker?.worst?.length > 0 
                  ? `${formatStatValue(complexStats.positions.attacker.worst[0].loss_rate, 'percentage')} taux B d'échec`
                  : ''
              }
              statTooltip={
                complexStats?.positions?.attacker?.worst?.length > 0 
                  ? `${complexStats.positions.attacker.worst[0].defeats} défaites sur ${complexStats.positions.attacker.worst[0].total_matches} matchs`
                  : ''
              }
              hasHolder={complexStats?.positions?.attacker?.worst?.length > 0}
            />

            {/* Monseigneur */}
            <TitleCard
              badge="monseigneur"
              title="Monseigneur"
              description="Meilleur défenseur de la saison"
              holders={complexStats?.positions?.defender?.best?.length > 0 ? getPlayerPseudos(complexStats.positions.defender.best) : []}
              statValue={
                complexStats?.positions?.defender?.best?.length > 0 
                  ? `${formatStatValue(complexStats.positions.defender.best[0].win_rate, 'percentage')} taux B de réussite`
                  : ''
              }
              statTooltip={
                complexStats?.positions?.defender?.best?.length > 0 
                  ? `${complexStats.positions.defender.best[0].wins} victoires sur ${complexStats.positions.defender.best[0].total_matches} matchs`
                  : ''
              }
              hasHolder={complexStats?.positions?.defender?.best?.length > 0}
            />

            {/* Le Boulanger */}
            <TitleCard
              badge="boulanger"
              title="Le Boulanger"
              description="Pire défenseur de la saison"
              holders={complexStats?.positions?.defender?.worst?.length > 0 ? getPlayerPseudos(complexStats.positions.defender.worst) : []}
              statValue={
                complexStats?.positions?.defender?.worst?.length > 0 
                  ? `${formatStatValue(complexStats.positions.defender.worst[0].loss_rate, 'percentage')} taux B d'échec`
                  : ''
              }
              statTooltip={
                complexStats?.positions?.defender?.worst?.length > 0 
                  ? `${complexStats.positions.defender.worst[0].defeats} défaites sur ${complexStats.positions.defender.worst[0].total_matches} matchs`
                  : ''
              }
              hasHolder={complexStats?.positions?.defender?.worst?.length > 0}
            />
          </div>
        </div>

        {/* Titres individuels - toujours afficher */}
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-left">Titres individuels</h3>
          <div className="retro-grid-4">
            {/* L'Excalibur */}
            <TitleCard
              badge="excalibur"
              title="L'Excalibur"
              description="Victoires 10-0 les plus fréquentes"
              holders={baseStats?.perfect_wins?.length > 0 ? getPlayerPseudos(baseStats.perfect_wins) : []}
              statValue={
                baseStats?.perfect_wins?.length > 0 
                  ? `${baseStats.perfect_wins[0].count} victoires parfaites`
                  : ''
              }
              statTooltip="Nombre de matchs gagnés 10-0"
              hasHolder={baseStats?.perfect_wins?.length > 0}
            />

            {/* Le Bâton du Paysan */}
            <TitleCard
              badge="baton"
              title="Le Bâton du Paysan"
              description="Défaites 10-0 les plus fréquentes"
              holders={baseStats?.perfect_losses?.length > 0 ? getPlayerPseudos(baseStats.perfect_losses) : []}
              statValue={
                baseStats?.perfect_losses?.length > 0 
                  ? `${baseStats.perfect_losses[0].count} défaites parfaites`
                  : ''
              }
              statTooltip="Nombre de matchs perdus 0-10"
              hasHolder={baseStats?.perfect_losses?.length > 0}
            />

            {/* Touché par la Grâce */}
            <TitleCard
              badge="grace"
              title="Touché par la Grâce"
              description="Victoires 10-9 les plus fréquentes"
              holders={baseStats?.close_wins?.length > 0 ? getPlayerPseudos(baseStats.close_wins) : []}
              statValue={
                baseStats?.close_wins?.length > 0 
                  ? `${baseStats.close_wins[0].count} victoires serrées`
                  : ''
              }
              statTooltip="Nombre de matchs gagnés 10-9"
              hasHolder={baseStats?.close_wins?.length > 0}
            />

            {/* Le Damné */}
            <TitleCard
              badge="damne"
              title="Le Damné"
              description="Défaites 10-9 les plus fréquentes"
              holders={baseStats?.close_losses?.length > 0 ? getPlayerPseudos(baseStats.close_losses) : []}
              statValue={
                baseStats?.close_losses?.length > 0 
                  ? `${baseStats.close_losses[0].count} défaites serrées`
                  : ''
              }
              statTooltip="Nombre de matchs perdus 9-10"
              hasHolder={baseStats?.close_losses?.length > 0}
            />

            {/* La Dynastie */}
            <TitleCard
              badge="dynastie"
              title="La Dynastie"
              description="Plus longue série de victoires"
              holders={complexStats?.streaks?.longest_win_streak?.length > 0 ? getPlayerPseudos(complexStats.streaks.longest_win_streak) : []}
              statValue={
                complexStats?.streaks?.longest_win_streak?.length > 0 
                  ? `${complexStats.streaks.longest_win_streak[0].streak_length} victoires d'affilées`
                  : ''
              }
              statTooltip={
                complexStats?.streaks?.longest_win_streak?.length > 0 
                  ? `Du ${new Date(complexStats.streaks.longest_win_streak[0].start_date).toLocaleDateString()} au ${new Date(complexStats.streaks.longest_win_streak[0].end_date).toLocaleDateString()}`
                  : ''
              }
              hasHolder={complexStats?.streaks?.longest_win_streak?.length > 0}
            />

            {/* Le Bouffon du Roi */}
            <TitleCard
              badge="bouffon"
              title="Le Bouffon du Roi"
              description="Plus longue série de défaites"
              holders={complexStats?.streaks?.longest_lose_streak?.length > 0 ? getPlayerPseudos(complexStats.streaks.longest_lose_streak) : []}
              statValue={
                complexStats?.streaks?.longest_lose_streak?.length > 0 
                  ? `${complexStats.streaks.longest_lose_streak[0].streak_length} défaites d'affilées`
                  : ''
              }
              statTooltip={
                complexStats?.streaks?.longest_lose_streak?.length > 0 
                  ? `Du ${new Date(complexStats.streaks.longest_lose_streak[0].start_date).toLocaleDateString()} au ${new Date(complexStats.streaks.longest_lose_streak[0].end_date).toLocaleDateString()}`
                  : ''
              }
              hasHolder={complexStats?.streaks?.longest_lose_streak?.length > 0}
            />

            {/* Le Précheur */}
            <TitleCard
              badge="precheur"
              title="Le Précheur"
              description="Joueur le plus actif"
              holders={baseStats?.activity?.most_active?.length > 0 ? getPlayerPseudos(baseStats.activity.most_active) : []}
              statValue={
                baseStats?.activity?.most_active?.length > 0 
                  ? `${baseStats.activity.most_active[0].match_count} matchs`
                  : ''
              }
              statTooltip="Nombre total de matchs joués"
              hasHolder={baseStats?.activity?.most_active?.length > 0}
            />

            {/* Le Fantôme */}
            <TitleCard
              badge="fantome"
              title="Le Fantôme"
              description="Joueur le moins actif"
              holders={baseStats?.activity?.least_active?.length > 0 ? getPlayerPseudos(baseStats.activity.least_active) : []}
              statValue={
                baseStats?.activity?.least_active?.length > 0 
                  ? `${baseStats.activity.least_active[0].match_count} matchs`
                  : ''
              }
              statTooltip="Nombre total de matchs joués"
              hasHolder={baseStats?.activity?.least_active?.length > 0}
            />

            {/* Karadoc */}
            <TitleCard
              badge="karadoc"
              title="Karadoc"
              description="Champion des matchs entre 12h et 14h30"
              holders={historicalStats?.dessert?.length > 0 ? getPlayerPseudos(historicalStats.dessert) : []}
              statValue={
                historicalStats?.dessert?.length > 0 
                  ? `${formatStatValue(historicalStats.dessert[0].win_rate, 'percentage')} taux B de réussite`
                  : ''
              }
              statTooltip={
                historicalStats?.dessert?.length > 0 
                  ? `${historicalStats.dessert[0].victories} victoires sur ${historicalStats.dessert[0].total_matches} matchs`
                  : ''
              }
              hasHolder={historicalStats?.dessert?.length > 0}
            />

            {/* Le Dessert */}
            <TitleCard
              badge="dessert"
              title="Le Dessert"
              description="Perdant des matchs entre 12h et 14h30"
              holders={historicalStats?.dessert_looser?.length > 0 ? getPlayerPseudos(historicalStats.dessert_looser) : []}
              statValue={
                historicalStats?.dessert_looser?.length > 0 
                  ? `${formatStatValue(historicalStats.dessert_looser[0].loss_rate, 'percentage')} taux B d'échec`
                  : ''
              }
              statTooltip={
                historicalStats?.dessert_looser?.length > 0 
                  ? `${historicalStats.dessert_looser[0].defeats} défaites sur ${historicalStats.dessert_looser[0].total_matches} matchs`
                  : ''
              }
              hasHolder={historicalStats?.dessert_looser?.length > 0}
            />

            {/* Le Premier Sang */}
            <TitleCard
              badge="premier-sang"
              title="Le Premier Sang"
              description="Première victoire du lundi"
              holders={historicalStats?.first_blood?.length > 0 ? getPlayerPseudos(historicalStats.first_blood) : []}
              statValue={
                historicalStats?.first_blood?.length > 0 
                  ? formatStatValue(historicalStats.first_blood[0].win_rate, 'percentage')
                  : ''
              }
              statTooltip={
                historicalStats?.first_blood?.length > 0 
                  ? `${historicalStats.first_blood[0].victories} victoires sur ${historicalStats.first_blood[0].total_first_matches} matchs`
                  : ''
              }
              hasHolder={historicalStats?.first_blood?.length > 0}
            />

            {/* Le Comte de Monte-Cristo */}
            <TitleCard
              badge="monte-cristo"
              title="Le Comte de Monte-Cristo"
              description="Meilleur vengeur"
              holders={historicalStats?.monte_cristo?.length > 0 ? getPlayerPseudos(historicalStats.monte_cristo) : []}
              statValue={
                historicalStats?.monte_cristo?.length > 0 
                  ? `${historicalStats.monte_cristo[0].revenge_wins}/${historicalStats.monte_cristo[0].revenge_opportunities} vengeances`
                  : ''
              }
              statTooltip={
                historicalStats?.monte_cristo?.length > 0 
                  ? `Taux de vengeance : ${formatStatValue(historicalStats.monte_cristo[0].revenge_rate, 'percentage')}`
                  : ''
              }
              hasHolder={historicalStats?.monte_cristo?.length > 0}
            />

            {/* L'Esclave */}
            <TitleCard
              badge="esclave"
              title="L'Esclave"
              description="Joueur le plus fidèle à ses partenaires"
              holders={historicalStats?.fidele?.length > 0 ? getPlayerPseudos(historicalStats.fidele) : []}
              statValue={
                historicalStats?.fidele?.length > 0 
                  ? `${historicalStats.fidele[0].matches_together}/${historicalStats.fidele[0].total_matches} matchs avec ${historicalStats.fidele[0].favorite_partner_pseudo}`
                  : ''
              }
              statTooltip={
                historicalStats?.fidele?.length > 0 
                  ? `Taux de fidélité : ${formatStatValue(historicalStats.fidele[0].fidelity_rate, 'percentage')}`
                  : ''
              }
              hasHolder={historicalStats?.fidele?.length > 0}
            />

            {/* Le Casanova */}
            <TitleCard
              badge="casanova"
              title="Le Casanova"
              description="Change le plus souvent de partenaire"
              holders={historicalStats?.casanova?.length > 0 ? getPlayerPseudos(historicalStats.casanova) : []}
              statValue={
                historicalStats?.casanova?.length > 0 
                  ? `${historicalStats.casanova[0].distinct_partners} partenaires sur ${historicalStats.casanova[0].total_matches} matchs`
                  : ''
              }
              statTooltip={
                historicalStats?.casanova?.length > 0 
                  ? `Taux de changement : ${formatStatValue(historicalStats.casanova[0].partner_change_rate, 'percentage')}`
                  : ''
              }
              hasHolder={historicalStats?.casanova?.length > 0}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 