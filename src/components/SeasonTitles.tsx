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
              <h3 className="text-lg font-bold mb-2 text-center w-full">{hasHolder ? title : '???'}</h3>
            </TooltipTrigger>
            <TooltipContent>
              <p>{hasHolder ? description : '...'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {/* Tenants du titre */}
        {hasHolder && (
          <div className="text-center font-medium mb-3">
            {Array.isArray(holders) ? (
              holders.map((holder, index) => (
                <div key={index}>
                  {holder}
                  {index < holders.length - 1 && <span className="mx-1">&</span>}
                </div>
              ))
            ) : (
              <p>{holders}</p>
            )}
          </div>
        )}
        
        {/* Statistique */}
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

  // Fonction utilitaire pour vérifier si un titre a un détenteur
  const hasTitleHolder = (data: any[] | undefined): boolean => {
    return Array.isArray(data) && data.length > 0;
  };

  // Fonction utilitaire pour extraire les pseudos des joueurs
  const getPlayerPseudos = (players: any[]): string[] => {
    if (!players || !Array.isArray(players) || players.length === 0) return [];
    return players.map(player => player.pseudo);
  };

  // Fonction utilitaire pour vérifier si une paire est valide
  const isValidPair = (pair: any[]): boolean => {
    return Array.isArray(pair) && pair.length > 0 && pair[0]?.player1_pseudo && pair[0]?.player2_pseudo;
  };

  return (
    <div className="retro-container retro-section">
      <div className="flex justify-between items-center mb-4">
        <h2 className="retro-section-title text-left">Titres de la saison</h2>
        <Button variant="outline" onClick={handleRefresh} size="sm">
          <RefreshCcw className="mr-2 h-4 w-4" /> Rafraîchir
        </Button>
      </div>
      
      {/* Titres d'équipe */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-left">Titres d'équipe</h3>
        <div className="retro-grid-2">
          {/* La Royauté */}
          <TitleCard
            badge="royaute"
            title="La Royauté"
            description="Meilleure paire de la saison"
            holders={
              complexStats.pairs?.best?.length > 0
                ? `${complexStats.pairs.best[0].player1_pseudo} & ${complexStats.pairs.best[0].player2_pseudo}`
                : "Pas encore de royauté"
            }
            statValue={
              complexStats.pairs?.best?.length > 0
                ? `${formatStatValue(complexStats.pairs.best[0].win_rate, 'percentage')} taux B de réussite`
                : "N/A"
            }
            statTooltip={
              complexStats.pairs?.best?.length > 0
                ? `${complexStats.pairs.best[0].wins} victoires sur ${complexStats.pairs.best[0].total_matches} matchs`
                : "N/A"
            }
            hasHolder={complexStats.pairs?.best?.length > 0}
          />

          {/* Les Gueux */}
          <TitleCard
            badge="gueux"
            title="Les Gueux"
            description="Pire paire de la saison"
            holders={
              complexStats.pairs?.worst?.length > 0
                ? `${complexStats.pairs.worst[0].player1_pseudo} & ${complexStats.pairs.worst[0].player2_pseudo}`
                : "Pas encore de gueux"
            }
            statValue={
              complexStats.pairs?.worst?.length > 0
                ? `${formatStatValue(complexStats.pairs.worst[0].loss_rate, 'percentage')} taux B d'échec`
                : "N/A"
            }
            statTooltip={
              complexStats.pairs?.worst?.length > 0
                ? `${complexStats.pairs.worst[0].defeats} défaites sur ${complexStats.pairs.worst[0].total_matches} matchs`
                : "N/A"
            }
            hasHolder={hasTitleHolder(complexStats.pairs?.worst)}
          />
        </div>

        {/* Le Classico */}
        <div className="mt-4">
          <Card className="overflow-hidden border-4 border-[#8B7355] dark:border-white">
            <div className="p-4">
              {/* Titre avec badge et description */}
              <div className="flex flex-col items-center mb-4">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex justify-center items-center h-20 w-20 mb-2">
                        <Image 
                          src="/assets/badges/clasico.png" 
                          alt="Le Classico" 
                          width={80} 
                          height={80} 
                          className={`object-contain ${!hasTitleHolder(historicalStats?.classicos) ? 'grayscale' : ''}`}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{hasTitleHolder(historicalStats?.classicos) ? 'Les plus grandes rivalités' : '...'}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <h3 className="text-lg font-bold mb-2 text-center w-full">
                        {hasTitleHolder(historicalStats?.classicos) ? 'Le Classico' : '???'}
                      </h3>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{hasTitleHolder(historicalStats?.classicos) ? 'Les plus grandes rivalités' : '...'}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              {/* Liste des classicos */}
              {hasTitleHolder(historicalStats?.classicos) ? (
                <div className="space-y-4">
                  <div className="border-t pt-3">
                    <div className="text-center font-semibold">
                      <span className="text-blue-500">
                        {historicalStats.classicos[0].team1.player1_pseudo} & {historicalStats.classicos[0].team1.player2_pseudo}
                      </span>
                      <span className="mx-2">vs</span>
                      <span className="text-red-500">
                        {historicalStats.classicos[0].team2.player1_pseudo} & {historicalStats.classicos[0].team2.player2_pseudo}
                      </span>
                    </div>
                    <div className="text-center text-sm text-gray-600 mt-1">
                      {historicalStats.classicos[0].team1.victories} - {historicalStats.classicos[0].team2.victories}
                    </div>
                    <div className="text-center text-xs text-gray-500 mt-1">
                      {historicalStats.classicos[0].total_matches} matchs joués
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </Card>
        </div>
      </div>

      {/* Titres par position */}
      <div className="space-y-6 mt-8">
        <h3 className="text-xl font-semibold text-left">Titres par position</h3>
        <div className="retro-grid-4">
          {/* Messire */}
          <TitleCard
            badge="messire"
            title="Messire"
            description="Meilleur attaquant de la saison"
            holders={
              complexStats.positions?.attacker?.best?.length > 0
                ? complexStats.positions.attacker.best[0].pseudo
                : "Pas encore de messire"
            }
            statValue={
              complexStats.positions?.attacker?.best?.length > 0
                ? `${formatStatValue(complexStats.positions.attacker.best[0].win_rate, 'percentage')} taux B de réussite`
                : "N/A"
            }
            statTooltip={
              complexStats.positions?.attacker?.best?.length > 0
                ? `${complexStats.positions.attacker.best[0].wins} victoires sur ${complexStats.positions.attacker.best[0].total_matches} matchs`
                : "N/A"
            }
            hasHolder={hasTitleHolder(complexStats.positions?.attacker?.best)}
          />

          {/* Le Charpentier */}
          <TitleCard
            badge="charpentier"
            title="Le Charpentier"
            description="Pire attaquant de la saison"
            holders={
              complexStats.positions?.attacker?.worst?.length > 0
                ? complexStats.positions.attacker.worst[0].pseudo
                : "Pas encore de charpentier"
            }
            statValue={
              complexStats.positions?.attacker?.worst?.length > 0
                ? `${formatStatValue(complexStats.positions.attacker.worst[0].loss_rate, 'percentage')} taux B d'échec`
                : "N/A"
            }
            statTooltip={
              complexStats.positions?.attacker?.worst?.length > 0
                ? `${complexStats.positions.attacker.worst[0].defeats} défaites sur ${complexStats.positions.attacker.worst[0].total_matches} matchs`
                : "N/A"
            }
            hasHolder={hasTitleHolder(complexStats.positions?.attacker?.worst)}
          />

          {/* Monseigneur */}
          <TitleCard
            badge="monseigneur"
            title="Monseigneur"
            description="Meilleur défenseur de la saison"
            holders={
              complexStats.positions?.defender?.best?.length > 0
                ? complexStats.positions.defender.best[0].pseudo
                : "Pas encore de monseigneur"
            }
            statValue={
              complexStats.positions?.defender?.best?.length > 0
                ? `${formatStatValue(complexStats.positions.defender.best[0].win_rate, 'percentage')} taux B de réussite`
                : "N/A"
            }
            statTooltip={
              complexStats.positions?.defender?.best?.length > 0
                ? `${complexStats.positions.defender.best[0].wins} victoires sur ${complexStats.positions.defender.best[0].total_matches} matchs`
                : "N/A"
            }
            hasHolder={hasTitleHolder(complexStats.positions?.defender?.best)}
          />

          {/* Le Boulanger */}
          <TitleCard
            badge="boulanger"
            title="Le Boulanger"
            description="Pire défenseur de la saison"
            holders={
              complexStats.positions?.defender?.worst?.length > 0
                ? complexStats.positions.defender.worst[0].pseudo
                : "Pas encore de boulanger"
            }
            statValue={
              complexStats.positions?.defender?.worst?.length > 0
                ? `${formatStatValue(complexStats.positions.defender.worst[0].loss_rate, 'percentage')} taux B d'échec`
                : "N/A"
            }
            statTooltip={
              complexStats.positions?.defender?.worst?.length > 0
                ? `${complexStats.positions.defender.worst[0].defeats} défaites sur ${complexStats.positions.defender.worst[0].total_matches} matchs`
                : "N/A"
            }
            hasHolder={hasTitleHolder(complexStats.positions?.defender?.worst)}
          />
        </div>
      </div>

      {/* Titres individuels */}
      <div className="space-y-6 mt-8">
        <h3 className="text-xl font-semibold text-left">Titres individuels</h3>
        <div className="retro-grid-4">
          {/* L'Excalibur */}
          <TitleCard
            badge="excalibur"
            title="L'Excalibur"
            description="Victoires 10-0 les plus fréquentes"
            holders={
              baseStats?.perfect_wins?.length > 0
                ? getPlayerPseudos(baseStats.perfect_wins)
                : "Pas encore de perfect"
            }
            statValue={
              baseStats?.perfect_wins?.length > 0
                ? `${baseStats.perfect_wins[0].count} victoires parfaites`
                : "0"
            }
            statTooltip="Nombre de matchs gagnés 10-0"
            hasHolder={hasTitleHolder(baseStats?.perfect_wins)}
          />

          {/* Le Bâton du Paysan */}
          <TitleCard
            badge="baton"
            title="Le Bâton du Paysan"
            description="Défaites 10-0 les plus fréquentes"
            holders={
              baseStats?.perfect_losses?.length > 0
                ? getPlayerPseudos(baseStats.perfect_losses)
                : "Pas encore de défaite parfaite"
            }
            statValue={
              baseStats?.perfect_losses?.length > 0
                ? `${baseStats.perfect_losses[0].count} défaites parfaites`
                : "0"
            }
            statTooltip="Nombre de matchs perdus 0-10"
            hasHolder={hasTitleHolder(baseStats?.perfect_losses)}
          />

          {/* Touché par la Grâce */}
          <TitleCard
            badge="grace"
            title="Touché par la Grâce"
            description="Victoires 10-9 les plus fréquentes"
            holders={
              baseStats?.close_wins?.length > 0
                ? getPlayerPseudos(baseStats.close_wins)
                : "Pas encore de match serré gagné"
            }
            statValue={
              baseStats?.close_wins?.length > 0
                ? `${baseStats.close_wins[0].count} victoires serrées`
                : "0"
            }
            statTooltip="Nombre de matchs gagnés 10-9"
            hasHolder={hasTitleHolder(baseStats?.close_wins)}
          />

          {/* Le Damné */}
          <TitleCard
            badge="damne"
            title="Le Damné"
            description="Défaites 10-9 les plus fréquentes"
            holders={
              baseStats?.close_losses?.length > 0
                ? getPlayerPseudos(baseStats.close_losses)
                : "Pas encore de match serré perdu"
            }
            statValue={
              baseStats?.close_losses?.length > 0
                ? `${baseStats.close_losses[0].count} défaites serrées`
                : "0"
            }
            statTooltip="Nombre de matchs perdus 9-10"
            hasHolder={hasTitleHolder(baseStats?.close_losses)}
          />

          {/* La Dynastie */}
          <TitleCard
            badge="dynastie"
            title="La Dynastie"
            description="Plus longue série de victoires"
            holders={
              complexStats?.streaks?.longest_win_streak?.length > 0
                ? complexStats.streaks.longest_win_streak[0].pseudo
                : "Pas encore de dynastie"
            }
            statValue={
              complexStats?.streaks?.longest_win_streak?.length > 0
                ? `${complexStats.streaks.longest_win_streak[0].streak_length} victoires d'affilées`
                : "N/A"
            }
            statTooltip={
              complexStats?.streaks?.longest_win_streak?.length > 0
                ? `Du ${new Date(complexStats.streaks.longest_win_streak[0].start_date).toLocaleDateString()} au ${new Date(complexStats.streaks.longest_win_streak[0].end_date).toLocaleDateString()}`
                : "N/A"
            }
            hasHolder={hasTitleHolder(complexStats?.streaks?.longest_win_streak)}
          />

          {/* Le Bouffon du Roi */}
          <TitleCard
            badge="bouffon"
            title="Le Bouffon du Roi"
            description="Plus longue série de défaites"
            holders={
              complexStats?.streaks?.longest_lose_streak?.length > 0
                ? complexStats.streaks.longest_lose_streak[0].pseudo
                : "Pas encore de bouffon"
            }
            statValue={
              complexStats?.streaks?.longest_lose_streak?.length > 0
                ? `${complexStats.streaks.longest_lose_streak[0].streak_length} défaites d'affilées`
                : "N/A"
            }
            statTooltip={
              complexStats?.streaks?.longest_lose_streak?.length > 0
                ? `Du ${new Date(complexStats.streaks.longest_lose_streak[0].start_date).toLocaleDateString()} au ${new Date(complexStats.streaks.longest_lose_streak[0].end_date).toLocaleDateString()}`
                : "N/A"
            }
            hasHolder={hasTitleHolder(complexStats?.streaks?.longest_lose_streak)}
          />

          {/* Le Précheur */}
          <TitleCard
            badge="precheur"
            title="Le Précheur"
            description="Joueur le plus actif"
            holders={
              baseStats?.activity?.most_active?.length > 0
                ? getPlayerPseudos(baseStats.activity.most_active)
                : "Pas encore de précheur"
            }
            statValue={
              baseStats?.activity?.most_active?.length > 0
                ? `${baseStats.activity.most_active[0].match_count} matchs`
                : "0"
            }
            statTooltip="Nombre total de matchs joués"
            hasHolder={hasTitleHolder(baseStats?.activity?.most_active)}
          />

          {/* Le Fantôme */}
          <TitleCard
            badge="fantome"
            title="Le Fantôme"
            description="Joueur le moins actif"
            holders={
              baseStats?.activity?.least_active?.length > 0
                ? getPlayerPseudos(baseStats.activity.least_active)
                : "Pas encore de fantôme"
            }
            statValue={
              baseStats?.activity?.least_active?.length > 0
                ? `${baseStats.activity.least_active[0].match_count} matchs`
                : "0"
            }
            statTooltip="Nombre total de matchs joués"
            hasHolder={hasTitleHolder(baseStats?.activity?.least_active)}
          />

          {/* Karadoc */}
          <TitleCard
            badge="karadoc"
            title="Karadoc"
            description="Champion des matchs entre 12h et 14h30"
            holders={
              historicalStats?.dessert?.length > 0
                ? getPlayerPseudos(historicalStats.dessert)
                : "Pas encore de champion du midi"
            }
            statValue={
              historicalStats?.dessert?.length > 0
                ? `${formatStatValue(historicalStats.dessert[0].win_rate, 'percentage')} taux B de réussite`
                : "N/A"
            }
            statTooltip={
              historicalStats?.dessert?.length > 0
                ? `${historicalStats.dessert[0].victories} victoires sur ${historicalStats.dessert[0].total_matches} matchs`
                : "Pas encore assez de matchs entre 12h et 14h30"
            }
            hasHolder={hasTitleHolder(historicalStats?.dessert)}
          />

          {/* Le Dessert */}
          <TitleCard
            badge="dessert"
            title="Le Dessert"
            description="Perdant des matchs entre 12h et 14h30"
            holders={
              historicalStats?.dessert_looser?.length > 0
                ? getPlayerPseudos(historicalStats.dessert_looser)
                : "Pas encore de looser du midi"
            }
            statValue={
              historicalStats?.dessert_looser?.length > 0
                ? `${formatStatValue(historicalStats.dessert_looser[0].loss_rate, 'percentage')} taux B d'échec`
                : "N/A"
            }
            statTooltip={
              historicalStats?.dessert_looser?.length > 0
                ? `${historicalStats.dessert_looser[0].defeats} défaites sur ${historicalStats.dessert_looser[0].total_matches} matchs`
                : "Pas encore assez de matchs entre 12h et 14h30"
            }
            hasHolder={hasTitleHolder(historicalStats?.dessert_looser)}
          />

          {/* Le Premier Sang */}
          <TitleCard
            badge="premier-sang"
            title="Le Premier Sang"
            description="Première victoire du lundi"
            holders={
              historicalStats?.first_blood?.length > 0
                ? getPlayerPseudos(historicalStats.first_blood)
                : "Pas encore de premier sang"
            }
            statValue={
              historicalStats?.first_blood?.length > 0
                ? formatStatValue(historicalStats.first_blood[0].win_rate, 'percentage')
                : "N/A"
            }
            statTooltip={
              historicalStats?.first_blood?.length > 0
                ? `${historicalStats.first_blood[0].victories} victoires sur ${historicalStats.first_blood[0].total_first_matches} matchs`
                : "Pas encore de premier match du lundi"
            }
            hasHolder={hasTitleHolder(historicalStats?.first_blood)}
          />

          {/* Le Comte de Monte-Cristo */}
          <TitleCard
            badge="monte-cristo"
            title="Le Comte de Monte-Cristo"
            description="Meilleur vengeur"
            holders={
              historicalStats?.monte_cristo?.length > 0
                ? getPlayerPseudos(historicalStats.monte_cristo)
                : "Pas encore de vengeur"
            }
            statValue={
              historicalStats?.monte_cristo?.length > 0
                ? `${historicalStats.monte_cristo[0].revenge_wins}/${historicalStats.monte_cristo[0].revenge_opportunities} vengeances`
                : "N/A"
            }
            statTooltip={
              historicalStats?.monte_cristo?.length > 0
                ? `Taux de vengeance : ${formatStatValue(historicalStats.monte_cristo[0].revenge_rate, 'percentage')}`
                : "N/A"
            }
            hasHolder={hasTitleHolder(historicalStats?.monte_cristo)}
          />

          {/* L'Esclave */}
          <TitleCard
            badge="esclave"
            title="L'Esclave"
            description="Joueur le plus fidèle à ses partenaires"
            holders={
              historicalStats?.fidele?.length > 0
                ? getPlayerPseudos(historicalStats.fidele)
                : "Pas encore d'esclave"
            }
            statValue={
              historicalStats?.fidele?.length > 0
                ? `${historicalStats.fidele[0].matches_together}/${historicalStats.fidele[0].total_matches} matchs avec ${historicalStats.fidele[0].favorite_partner_pseudo}`
                : "N/A"
            }
            statTooltip={
              historicalStats?.fidele?.length > 0
                ? `Taux de fidélité : ${formatStatValue(historicalStats.fidele[0].fidelity_rate, 'percentage')}`
                : "N/A"
            }
            hasHolder={hasTitleHolder(historicalStats?.fidele)}
          />

          {/* Le Casanova */}
          <TitleCard
            badge="casanova"
            title="Le Casanova"
            description="Change le plus souvent de partenaire"
            holders={
              historicalStats?.casanova?.length > 0
                ? getPlayerPseudos(historicalStats.casanova)
                : "Pas encore de casanova"
            }
            statValue={
              historicalStats?.casanova?.length > 0
                ? `${historicalStats.casanova[0].distinct_partners} partenaires sur ${historicalStats.casanova[0].total_matches} matchs`
                : "N/A"
            }
            statTooltip={
              historicalStats?.casanova?.length > 0
                ? `Taux de changement : ${formatStatValue(historicalStats.casanova[0].partner_change_rate, 'percentage')}`
                : "N/A"
            }
            hasHolder={hasTitleHolder(historicalStats?.casanova)}
          />
        </div>
      </div>
    </div>
  );
} 