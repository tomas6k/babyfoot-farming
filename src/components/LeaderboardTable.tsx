"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { useEffect, useState } from "react";
import { type PlayerStats } from "@/types/supabase";
import { Progress } from "./ui/progress";
import { supabase } from "@/lib/supabaseClient";
import { getGameConfig } from "@/lib/queries/gameConfig";

// Interface pour les données de get_players_level
interface PlayerLevel {
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

// Interface combinée pour nos données
interface CombinedPlayerData {
  // Identifiant unique
  id: string;
  
  // Données de base (get_players_level)
  pseudo: string;
  exp: number;
  level: number;
  title: string;
  description: string;
  illustration_url: string;
  required_exp: number;
  next_level_exp: number;
  progress: number;
  hp: number;
  mana: number;
  
  // Données statistiques (get_player_stats, optionnelles)
  total_matches?: number;
  victories?: number;
  defeats?: number;
  goals_for?: number;
  goals_against?: number;
  total_matches_attacker?: number;
  victories_attacker?: number;
  defeats_attacker?: number;
  goals_for_attacker?: number;
  goals_against_attacker?: number;
  total_matches_defender?: number;
  victories_defender?: number;
  defeats_defender?: number;
  goals_for_defender?: number;
  goals_against_defender?: number;
  best_partner_id?: string;
  best_partner_pseudo?: string;
  best_partner_matches?: number;
  best_partner_victories?: number;
  worst_partner_id?: string;
  worst_partner_pseudo?: string;
  worst_partner_matches?: number;
  worst_partner_victories?: number;
  best_opponent_id?: string;
  best_opponent_pseudo?: string;
  best_opponent_matches?: number;
  best_opponent_victories?: number;
  worst_opponent_id?: string;
  worst_opponent_pseudo?: string;
  worst_opponent_matches?: number;
  worst_opponent_victories?: number;
  total_exp_gained?: number;
  
  // Rôle préféré calculé
  preferredRole?: "attacker" | "defender" | null;
}

interface LeaderboardTableProps {
  period?: string; // format YYYY-MM
  stats?: PlayerStats[];
}

// Fonction pour obtenir le mois en cours au format YYYY-MM
function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

async function fetchStats(period: string) {
  try {
    const date = new Date(`${period}-01`);
    
    // Utilisation d'une requête fetch avec en-têtes anti-cache
    const timestamp = new Date().getTime().toString();
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/get_player_stats`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Expires': '0'
      },
      body: JSON.stringify({
        p_player_id: null,
        p_month: date.toISOString()
      }),
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch player stats: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error in fetchStats:", error);
    throw error;
  }
}

export function LeaderboardTable({ period = getCurrentMonth(), stats = [] }: LeaderboardTableProps) {
  const [players, setPlayers] = useState<CombinedPlayerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [gameConfig, setGameConfig] = useState({ max_hp: 10, max_mana: 10 });

  // Charger les données
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Récupérer la configuration du jeu
        const config = await getGameConfig();
        setGameConfig(config);
        
        // 1. Récupérer les données de niveau des joueurs
        const { data: levelData, error: levelError } = await supabase
          .rpc("get_players_level");
          
        if (levelError) throw levelError;
        
        // Utiliser les stats passées en props si disponibles
        const statsData = stats.length > 0 ? stats : await fetchStats(period);
        
        // 3. Combiner les données
        const combinedData: CombinedPlayerData[] = levelData.map((levelPlayer: PlayerLevel) => {
          // Trouver les stats correspondantes au joueur
          const playerStats = statsData?.find(
            (statPlayer: PlayerStats) => statPlayer.player_id === levelPlayer.id
          );
          
          // Déterminer le rôle préféré si des statistiques sont disponibles
          let preferredRole: "attacker" | "defender" | null = null;
          if (playerStats && 
              playerStats.total_matches_attacker > 0 && 
              playerStats.total_matches_defender > 0) {
            
            const attackerWinRate = playerStats.victories_attacker / playerStats.total_matches_attacker;
            const defenderWinRate = playerStats.victories_defender / playerStats.total_matches_defender;
            
            if (attackerWinRate > defenderWinRate) {
              preferredRole = "attacker";
            } else if (defenderWinRate > attackerWinRate) {
              preferredRole = "defender";
            }
          }
          
          // Construire l'objet combiné
          return {
            id: levelPlayer.id,
            pseudo: levelPlayer.pseudo,
            exp: levelPlayer.exp,
            level: levelPlayer.level,
            title: levelPlayer.title,
            description: levelPlayer.description,
            illustration_url: levelPlayer.illustration_url,
            required_exp: levelPlayer.required_exp,
            next_level_exp: levelPlayer.next_level_exp,
            progress: levelPlayer.progress,
            hp: levelPlayer.hp,
            mana: levelPlayer.mana,
            
            // Ajouter les stats si disponibles
            ...(playerStats ? {
              total_matches: playerStats.total_matches,
              victories: playerStats.victories,
              defeats: playerStats.defeats,
              goals_for: playerStats.goals_for,
              goals_against: playerStats.goals_against,
              total_matches_attacker: playerStats.total_matches_attacker,
              victories_attacker: playerStats.victories_attacker,
              defeats_attacker: playerStats.defeats_attacker,
              goals_for_attacker: playerStats.goals_for_attacker,
              goals_against_attacker: playerStats.goals_against_attacker,
              total_matches_defender: playerStats.total_matches_defender,
              victories_defender: playerStats.victories_defender,
              defeats_defender: playerStats.defeats_defender,
              goals_for_defender: playerStats.goals_for_defender,
              goals_against_defender: playerStats.goals_against_defender,
              best_partner_id: playerStats.best_partner_id,
              best_partner_pseudo: playerStats.best_partner_pseudo,
              best_partner_matches: playerStats.best_partner_matches,
              best_partner_victories: playerStats.best_partner_victories,
              worst_partner_id: playerStats.worst_partner_id,
              worst_partner_pseudo: playerStats.worst_partner_pseudo,
              worst_partner_matches: playerStats.worst_partner_matches,
              worst_partner_victories: playerStats.worst_partner_victories,
              best_opponent_id: playerStats.best_opponent_id,
              best_opponent_pseudo: playerStats.best_opponent_pseudo,
              best_opponent_matches: playerStats.best_opponent_matches,
              best_opponent_victories: playerStats.best_opponent_victories,
              worst_opponent_id: playerStats.worst_opponent_id,
              worst_opponent_pseudo: playerStats.worst_opponent_pseudo,
              worst_opponent_matches: playerStats.worst_opponent_matches,
              worst_opponent_victories: playerStats.worst_opponent_victories,
              total_exp_gained: playerStats.total_exp_gained,
              preferredRole
            } : {
              preferredRole: null
            })
          };
        });
        
        // 4. Trier les données selon l'ordre de get_player_stats si disponible, sinon par exp
        let sortedData = [...combinedData];
        if (statsData?.length > 0) {
          sortedData = combinedData.sort((a, b) => {
            // Trouver l'index dans statsData
            const aIndex = statsData.findIndex((s: PlayerStats) => s.player_id === a.id);
            const bIndex = statsData.findIndex((s: PlayerStats) => s.player_id === b.id);
            
            // Si les deux joueurs sont dans statsData, utiliser cet ordre
            if (aIndex !== -1 && bIndex !== -1) {
              return aIndex - bIndex;
            }
            
            // Si un seul est dans statsData, celui-là est prioritaire
            if (aIndex !== -1) return -1;
            if (bIndex !== -1) return 1;
            
            // Si aucun n'est dans statsData, trier par exp
            return b.exp - a.exp;
    });
        } else {
          // Si pas de stats, trier par exp
          sortedData = combinedData.sort((a, b) => b.exp - a.exp);
        }
        
        setPlayers(sortedData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Une erreur est survenue"));
        console.error("Erreur lors du chargement des données:", err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [period, stats]);

  const formatRatio = (value?: number, total?: number) => {
    if (!value || !total || total === 0) return "0%";
    return `${Math.round((value / total) * 100)}%`;
  };

  const getRoleIcon = (player: CombinedPlayerData) => {
    if (player.preferredRole === "attacker") {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="inline-flex">
                <span className="text-xl mr-2">⚔️</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-sm">
                Attaquant: {player.victories_attacker}/{player.total_matches_attacker} ({formatRatio(player.victories_attacker, player.total_matches_attacker)})<br />
                Buts: {player.goals_for_attacker}/{player.goals_against_attacker}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    } else if (player.preferredRole === "defender") {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="inline-flex">
                <span className="text-xl mr-2">🛡️</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-sm">
                Défenseur: {player.victories_defender}/{player.total_matches_defender} ({formatRatio(player.victories_defender, player.total_matches_defender)})<br />
                Buts: {player.goals_for_defender}/{player.goals_against_defender}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    return null;
  };

  const renderStatTooltip = (content: React.ReactNode, value: React.ReactNode) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>{value}</TooltipTrigger>
        <TooltipContent>
          <p className="text-sm whitespace-pre-line">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  const getRatioColorClass = (ratio?: number) => {
    if (!ratio) return "text-gray-500";
    if (ratio > 0.66) return "text-green-600";
    if (ratio > 0.33) return "text-yellow-600";
    return "text-red-600";
  };

  const noStatsMessage = (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <span className="text-gray-400 italic text-sm">N/C</span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">Pas encore de partie jouée</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  if (loading) {
    return <div className="text-center p-4">Chargement du classement...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">Erreur: {error.message}</div>;
  }

  return (
    <div className="w-full overflow-x-auto">
      <Table className="w-full">
      <TableHeader>
        <TableRow>
            <TableHead className="w-12 px-6">#</TableHead>
            <TableHead className="px-6 min-w-[200px]">Pseudo</TableHead>
            <TableHead className="text-right px-6">EXP Gagnée</TableHead>
            <TableHead className="px-6">Niveau</TableHead>
            <TableHead className="px-6 min-w-[175px]">Rang</TableHead>
            <TableHead className="px-6">Progression</TableHead>
            <TableHead className="text-right px-6">Parties</TableHead>
            <TableHead className="text-right px-6">Victoires</TableHead>
            <TableHead className="text-right px-6">Défaites</TableHead>
            <TableHead className="text-right px-6">Buts</TableHead>
            <TableHead className="text-right px-6">Meilleur Partenaire</TableHead>
            <TableHead className="text-right px-6">Pire Partenaire</TableHead>
            <TableHead className="text-right px-6">Paysans</TableHead>
            <TableHead className="text-right px-6">Bête Noire</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {players.map((player, index) => {
            const victoryRatio = player.victories && player.total_matches 
              ? player.victories / player.total_matches 
              : 0;
              
            const goalRatio = player.goals_for && player.goals_against 
              ? player.goals_for / (player.goals_for + player.goals_against) 
              : 0;

          return (
              <TableRow key={player.id} className="hover:bg-muted/50">
                <TableCell className="px-6">{index + 1}</TableCell>
                <TableCell className="px-6">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center cursor-pointer">
                          {getRoleIcon(player)}
                          <span>{player.pseudo}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-red-500">HP:</span>
                            <div className="flex gap-1">
                              {Array.from({ length: gameConfig.max_hp }).map((_, i) => (
                                <img
                                  key={`hp-${i}`}
                                  src={i < player.hp ? "/images/hp.png" : "/images/hp-empty.png"}
                                  alt={i < player.hp ? "HP" : "Empty HP"}
                                  className="w-4 h-4"
                                />
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-blue-500">MANA:</span>
                            <div className="flex gap-1">
                              {Array.from({ length: gameConfig.max_mana }).map((_, i) => (
                                <img
                                  key={`mana-${i}`}
                                  src={i < player.mana ? "/images/mana.png" : "/images/mana-empty.png"}
                                  alt={i < player.mana ? "MANA" : "Empty MANA"}
                                  className="w-4 h-4"
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell className="text-right px-6">
                  {player.total_exp_gained !== undefined ? player.total_exp_gained : noStatsMessage}
                </TableCell>
                <TableCell className="text-center px-6">
                  {renderStatTooltip(
                    `Expérience totale: ${player.exp} XP`,
                    player.level
                  )}
              </TableCell>
                <TableCell className="px-6 py-4">
                {renderStatTooltip(
                    player.description,
                    <div className="flex items-center gap-3">
                      <img 
                          src={player.illustration_url} 
                          alt={player.title}
                          className="w-10 h-10 object-contain"
                      />
                      <span className="flex-1">{player.title}</span>
                    </div>
                )}
              </TableCell>
                <TableCell className="px-6">
                {renderStatTooltip(
                    `${player.next_level_exp - player.exp} XP restant`,
                    <div className="min-w-[150px]">
                      <Progress 
                        value={player.progress} 
                        className="w-full" 
                        style={{ height: '16px' }}
                      />
                    </div>
                )}
              </TableCell>
                <TableCell className="text-right px-6">
                  {player.total_matches !== undefined 
                    ? renderStatTooltip(
                  `Total: ${player.total_matches}\nAttaquant: ${player.total_matches_attacker}\nDéfenseur: ${player.total_matches_defender}`,
                  player.total_matches
                      )
                    : noStatsMessage
                  }
              </TableCell>
                <TableCell className="text-right px-6">
                  {player.victories !== undefined && player.total_matches
                    ? renderStatTooltip(
                        `Ratio de victoire: ${formatRatio(player.victories, player.total_matches)}\nAttaquant: ${player.victories_attacker}/${player.total_matches_attacker}\nDéfenseur: ${player.victories_defender}/${player.total_matches_defender}`,
                        <span className={getRatioColorClass(victoryRatio)}>
                          {player.victories}
                        </span>
                    )
                    : noStatsMessage
                  }
              </TableCell>
                <TableCell className="text-right px-6">
                  {player.defeats !== undefined
                    ? renderStatTooltip(
                  `Total: ${player.defeats}\nAttaquant: ${player.defeats_attacker}\nDéfenseur: ${player.defeats_defender}`,
                  player.defeats
                      )
                    : noStatsMessage
                  }
              </TableCell>
                <TableCell className="text-right px-6">
                  {player.goals_for !== undefined && player.goals_against !== undefined
                    ? renderStatTooltip(
                        `Ratio buts: ${formatRatio(player.goals_for, player.goals_for + player.goals_against)}\nAttaquant: ${player.goals_for_attacker}/${player.goals_against_attacker}\nDéfenseur: ${player.goals_for_defender}/${player.goals_against_defender}`,
                        <span className={getRatioColorClass(goalRatio)}>
                          {player.goals_for}/{player.goals_against}
                        </span>
                    )
                    : noStatsMessage
                  }
              </TableCell>
                <TableCell className="text-right px-6">
                  {player.best_partner_pseudo && player.best_partner_matches
                    ? renderStatTooltip(
                        `${player.best_partner_victories} victoires sur ${player.best_partner_matches} matchs\nRatio: ${formatRatio(player.best_partner_victories, player.best_partner_matches)}`,
                        <span className={getRatioColorClass(player.best_partner_victories && player.best_partner_matches ? player.best_partner_victories / player.best_partner_matches : undefined)}>
                          {player.best_partner_pseudo}
                        </span>
                    )
                    : noStatsMessage
                  }
              </TableCell>
                <TableCell className="text-right px-6">
                  {player.worst_partner_pseudo && player.worst_partner_matches
                    ? renderStatTooltip(
                        `${player.worst_partner_victories} victoires sur ${player.worst_partner_matches} matchs\nRatio: ${formatRatio(player.worst_partner_victories, player.worst_partner_matches)}`,
                        <span className={getRatioColorClass(player.worst_partner_victories && player.worst_partner_matches ? player.worst_partner_victories / player.worst_partner_matches : undefined)}>
                          {player.worst_partner_pseudo}
                        </span>
                    )
                    : noStatsMessage
                  }
              </TableCell>
                <TableCell className="text-right px-6">
                  {player.best_opponent_pseudo && player.best_opponent_matches
                    ? renderStatTooltip(
                        `${player.best_opponent_victories} victoires sur ${player.best_opponent_matches} matchs\nRatio: ${formatRatio(player.best_opponent_victories, player.best_opponent_matches)}`,
                        <span className={getRatioColorClass(player.best_opponent_victories && player.best_opponent_matches ? player.best_opponent_victories / player.best_opponent_matches : undefined)}>
                          {player.best_opponent_pseudo}
                        </span>
                    )
                    : noStatsMessage
                  }
              </TableCell>
                <TableCell className="text-right px-6">
                  {player.worst_opponent_pseudo && player.worst_opponent_matches
                    ? renderStatTooltip(
                        `${player.worst_opponent_victories} victoires sur ${player.worst_opponent_matches} matchs\nRatio: ${formatRatio(player.worst_opponent_victories, player.worst_opponent_matches)}`,
                        <span className={getRatioColorClass(player.worst_opponent_victories && player.worst_opponent_matches ? player.worst_opponent_victories / player.worst_opponent_matches : undefined)}>
                          {player.worst_opponent_pseudo}
                        </span>
                    )
                    : noStatsMessage
                  }
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
    </div>
  );
} 