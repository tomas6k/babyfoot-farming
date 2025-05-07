import { createClient } from "@supabase/supabase-js";
import DashboardClient from "./DashboardClient";
import { getPlayerStats } from "@/lib/getPlayerStats";
import { type PlayerStats } from "@/types/supabase";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function DashboardPage() {
  // Obtenir le mois actuel au format YYYY-MM
  const currentDate = new Date();
  const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  
  console.log("DashboardPage: Fetching stats for month:", currentMonth);
  const stats = await getPlayerStats(currentMonth) as PlayerStats[];

  return <DashboardClient stats={stats} />;
} 