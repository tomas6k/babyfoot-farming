"use client";

import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { LeaderboardTable } from '@/components/LeaderboardTable';
import { SeasonTitles } from '@/components/SeasonTitles';
import type { PlayerStats } from '@/types/supabase';

interface DashboardClientProps {
  stats: PlayerStats[];
}

export default function DashboardClient({ stats }: DashboardClientProps) {
  // Obtenir le mois actuel au format YYYY-MM
  const currentDate = new Date();
  const currentMonth = format(currentDate, 'MMMM yyyy', { locale: fr });
  const currentMonthISO = format(currentDate, 'yyyy-MM');

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold">Tableau de bord</h2>
          <p className="text-muted-foreground">Statistiques pour {currentMonth}</p>
        </div>
      </div>
      
      <LeaderboardTable period={currentMonth} stats={stats} />
      <SeasonTitles month={currentMonthISO} />
    </div>
  );
} 