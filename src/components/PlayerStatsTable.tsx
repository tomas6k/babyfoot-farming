"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getLevels } from "@/lib/queries/levels";
import { getPlayerStats } from "@/lib/getPlayerStats";
import type { Database } from "@/types/supabase";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../components/ui/tooltip";
import { useEffect, useState } from "react";
import type { LevelWithInfo } from "@/lib/queries/levels";
import Image from "next/image";
import { ProgressBar } from "@/components/ui/progress-bar";
import { ArrowUpDown } from "lucide-react";

type PlayerStats = Database['public']['Functions']['get_player_stats']['Returns'][0];

interface SortConfig {
  column: keyof PlayerStats | '';
  direction: 'asc' | 'desc';
}

export function PlayerStatsTable() {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ column: '', direction: 'desc' });
  const [levels, setLevels] = useState<LevelWithInfo[] | null>(null);
  const [stats, setStats] = useState<PlayerStats[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const currentDate = new Date();
  const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [levelsData, statsData] = await Promise.all([
          getLevels(),
          getPlayerStats(currentMonth)
        ]);
        setLevels(levelsData);
        setStats(statsData);
      } catch (err) {
        console.error("Erreur lors du chargement des données:", err);
        setError(err instanceof Error ? err : new Error("Une erreur est survenue lors du chargement des données"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Rafraîchissement des données toutes les 30 secondes
    const intervalId = setInterval(fetchData, 30000);
    
    return () => clearInterval(intervalId);
  }, [currentMonth]);

  if (error) {
    return (
      <div className="text-red-500 p-4 rounded-lg bg-red-100">
        Une erreur est survenue lors du chargement des données.
      </div>
    );
  }

  if (isLoading || !stats) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="grid grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  const sortedStats = [...stats].sort((a, b) => {
    if (!sortConfig.column) return 0;
    
    const aValue = a[sortConfig.column];
    const bValue = b[sortConfig.column];
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    return 0;
  });

  const handleSort = (column: keyof PlayerStats) => {
    setSortConfig(current => ({
      column,
      direction: current.column === column && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const calculateWinRatio = (victories: number, total: number) => {
    if (total === 0) return 0;
    return (victories / total) * 100;
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Classement du mois</h2>
      <div className="pixel-card p-4 w-full overflow-x-auto rounded-lg border bg-background">
        <table className="min-w-[600px] w-full text-xs md:text-sm">
          <TableHeader>
            <TableRow>
              <TableHead className="text-left">Position</TableHead>
              <TableHead className="text-left">Joueur</TableHead>
              <TableHead 
                className="text-left cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('exp')}
              >
                Niveau
                <ArrowUpDown className="inline ml-2 h-4 w-4" />
              </TableHead>
              <TableHead 
                className="text-left cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('victories')}
              >
                Victoires
                <ArrowUpDown className="inline ml-2 h-4 w-4" />
              </TableHead>
              <TableHead 
                className="text-left cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('total_matches')}
              >
                Matchs
                <ArrowUpDown className="inline ml-2 h-4 w-4" />
              </TableHead>
              <TableHead 
                className="text-left cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('goals_for')}
              >
                Buts
                <ArrowUpDown className="inline ml-2 h-4 w-4" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedStats.map((player, index) => {
              const position = index + 1;
              const medal = position <= 3 ? ['🥇', '🥈', '🥉'][position - 1] : null;
              const winRatio = calculateWinRatio(player.victories, player.total_matches);

              return (
                <TableRow 
                  key={player.player_id} 
                  className={`
                    hover:bg-[#2A2A2A] transition-colors
                    ${position <= 3 ? 'bg-opacity-10 bg-yellow-500' : ''}
                  `}
                >
                  <TableCell className="font-medium text-left">
                    {medal ? (
                      <span className="text-2xl">{medal}</span>
                    ) : (
                      position
                    )}
                  </TableCell>
                  <TableCell className="font-medium text-left">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <span>{player.pseudo}</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="space-y-2">
                            <p>Meilleur partenaire: {player.best_partner_pseudo || 'N/A'}</p>
                            <p>Meilleur adversaire: {player.best_opponent_pseudo || 'N/A'}</p>
                            <p>Pire adversaire: {player.worst_opponent_pseudo || 'N/A'}</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell className="text-left">
                    {player.exp}
                  </TableCell>
                  <TableCell className="text-left">
                    {player.victories} ({winRatio.toFixed(1)}%)
                  </TableCell>
                  <TableCell className="text-left">
                    {player.total_matches}
                  </TableCell>
                  <TableCell className="text-left">
                    <span className="text-[#FFD700]">{player.goals_for}</span>
                    {' / '}
                    <span className="text-[#FF6B6B]">{player.goals_against}</span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </table>
      </div>
    </div>
  );
} 