import { getSupabaseClient } from '@/lib/supabaseClient';
import DashboardClient from "./DashboardClient";
import { getPlayerStats } from "@/lib/getPlayerStats";
import { type PlayerStats } from "@/types/supabase";

// Désactiver le cache statique pour cette page
export const dynamic = 'force-dynamic';
export const revalidate = 0;

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is required");
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is required");
}

const supabase = getSupabaseClient();

export default async function DashboardPage() {
  // Obtenir le mois actuel au format YYYY-MM
  const currentDate = new Date();
  const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  
  console.log("DashboardPage: Fetching stats for month:", currentMonth);
  const stats = await getPlayerStats(currentMonth) as PlayerStats[];

  return <DashboardClient stats={stats} />;
} 