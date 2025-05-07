"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { MatchHistory } from '@/components/MatchHistory';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface MatchHistory {
  id: string;
  date: string;
  // Équipe blanche
  white_attacker_pseudo: string;
  white_attacker_level: number;
  white_defender_pseudo: string;
  white_defender_level: number;
  white_team_level: number;
  white_attacker_exp_gained: number;
  white_defender_exp_gained: number;
  // Équipe noire
  black_attacker_pseudo: string;
  black_attacker_level: number;
  black_defender_pseudo: string;
  black_defender_level: number;
  black_team_level: number;
  black_attacker_exp_gained: number;
  black_defender_exp_gained: number;
  // Scores
  score_white: number;
  score_black: number;
}

export default function HistoryPage() {
  return (
    <div className="px-10 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-pixel">
          Historique des Matchs
        </h1>
      </div>
      <MatchHistory />
    </div>
  );
} 