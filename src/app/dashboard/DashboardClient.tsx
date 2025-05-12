"use client";

import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { LeaderboardTable } from '@/components/LeaderboardTable';
import { SeasonTitles } from '@/components/SeasonTitles';
import type { PlayerStats } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';
import { useState } from 'react';

interface DashboardClientProps {
  stats: PlayerStats[];
}

export default function DashboardClient({ stats }: DashboardClientProps) {
  // Ajouter un compteur de rafraîchissement pour forcer la mise à jour des données
  const [refreshCounter, setRefreshCounter] = useState(0);
  
  // Obtenir le mois actuel au format YYYY-MM
  const currentDate = new Date();
  const currentMonth = format(currentDate, 'MMMM yyyy', { locale: fr });
  const currentMonthISO = format(currentDate, 'yyyy-MM');

  // Fonction pour rafraîchir les données
  const handleRefresh = () => {
    setRefreshCounter(prev => prev + 1);
    window.location.reload(); // Recharger la page pour récupérer les données à jour
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 mt-6 ml-6">
        <div>
          <h2 className="text-2xl font-bold">Tableau de bord</h2>
          <p className="text-muted-foreground">Statistiques pour {currentMonth}</p>
        </div>
        <Button variant="outline" onClick={handleRefresh} size="sm" className="mr-6">
          <RefreshCcw className="mr-2 h-4 w-4" /> Rafraîchir la page
        </Button>
      </div>
      
      <LeaderboardTable period={currentMonthISO} stats={stats} key={`leaderboard-${refreshCounter}`} />
      <SeasonTitles month={currentMonthISO} key={`season-${refreshCounter}`} />
    </div>
  );
} 