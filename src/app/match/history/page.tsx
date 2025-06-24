"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { MatchHistory } from '@/components/MatchHistory';

const supabase = getSupabaseClient();

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
    <div className="container py-10">
      <div className="flex flex-col items-center justify-between mb-4">
        <h1 className="text-2xl md:text-3xl font-bold font-pixel mb-2 text-center w-full">
          Historique des Matchs
        </h1>
      </div>
      <MatchHistory />
    </div>
  );
} 