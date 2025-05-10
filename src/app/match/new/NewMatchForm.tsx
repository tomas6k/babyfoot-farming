"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from '@/lib/supabaseClient';
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { processMatch } from "@/lib/updatePlayerStats";
import { usePlayersLevel } from "@/lib/hooks/usePlayersLevel";
import { Progress } from "@/components/ui/progress";
import Image from "next/image";

const supabase = getSupabaseClient();

interface PlayerStats {
  [key: string]: {
    id: string;
    exp: number;
    hp: number;
    mana: number;
  }
}

export function NewMatchForm() {
  const router = useRouter();
  const { players, isLoading: playersLoading, error: playersError } = usePlayersLevel();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState({
    whiteAttacker: "",
    whiteDefender: "",
    blackAttacker: "",
    blackDefender: "",
  });
  const [scores, setScores] = useState({
    white: 0,
    black: 0,
  });

  const getPlayerWarnings = () => {
    const warnings: { playerId: string; pseudo: string; warnings: string[] }[] = [];
    
    Object.entries(selectedPlayers).forEach(([role, playerId]) => {
      if (!playerId) return;
      
      const player = players.find(p => p.id === playerId);
      if (!player) return;

      const playerWarnings = [];
      if (player.mana === 0) {
        playerWarnings.push("0 mana");
      }
      if (player.hp === 0) {
        playerWarnings.push("0 HP");
      }

      // Vérifier si le joueur est sélectionné plusieurs fois
      const selectedCount = Object.values(selectedPlayers).filter(id => id === playerId).length;
      if (selectedCount > 1) {
        playerWarnings.push("Sélectionné plusieurs fois");
      }

      if (playerWarnings.length > 0) {
        warnings.push({
          playerId: player.id,
          pseudo: player.pseudo,
          warnings: playerWarnings
        });
      }
    });

    return warnings;
  };

  const handlePlayerSelection = (role: keyof typeof selectedPlayers, value: string) => {
    setSelectedPlayers({ ...selectedPlayers, [role]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await processMatch({
        white_attacker: selectedPlayers.whiteAttacker,
        white_defender: selectedPlayers.whiteDefender,
        black_attacker: selectedPlayers.blackAttacker,
        black_defender: selectedPlayers.blackDefender,
        score_white: scores.white,
        score_black: scores.black,
      });

      router.push("/dashboard");
    } catch (error) {
      console.error("Erreur lors de la soumission du match:", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de la soumission du match");
      setIsLoading(false);
    }
  };

  const renderPlayerOption = (player: typeof players[0]) => (
    <SelectItem
      key={player.id}
      value={player.id}
      className="pixel-select-item"
    >
      <div className="flex items-center justify-between w-full gap-4">
        <div className="flex items-center gap-2">
          <span>{player.pseudo}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400">Niv. {player.level}</span>
        </div>
      </div>
    </SelectItem>
  );

  if (playersLoading) {
    return <div>Chargement des joueurs...</div>;
  }

  if (playersError) {
    return <div>Erreur lors du chargement des joueurs</div>;
  }

  const activePlayers = players.filter(p => !p.disable);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Équipe blanche */}
        <Card className="pixel-card">
          <CardHeader>
            <CardTitle className="text-2xl mb-4">Équipe Blanche</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm">⚔️ Attaquant</label>
              <Select
                value={selectedPlayers.whiteAttacker}
                onValueChange={(value) => handlePlayerSelection("whiteAttacker", value)}
                required
              >
                <SelectTrigger className="pixel-select">
                  <SelectValue placeholder="Sélectionner un joueur" />
                </SelectTrigger>
                <SelectContent className="pixel-select-content">
                  {activePlayers.map(renderPlayerOption)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm">🛡️ Défenseur</label>
              <Select
                value={selectedPlayers.whiteDefender}
                onValueChange={(value) => handlePlayerSelection("whiteDefender", value)}
                required
              >
                <SelectTrigger className="pixel-select">
                  <SelectValue placeholder="Sélectionner un joueur" />
                </SelectTrigger>
                <SelectContent className="pixel-select-content">
                  {activePlayers.map(renderPlayerOption)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm">Score</label>
              <Input
                type="number"
                min={0}
                max={10}
                value={scores.white}
                onChange={(e) =>
                  setScores({ ...scores, white: parseInt(e.target.value) || 0 })
                }
                required
                className="pixel-input"
              />
            </div>
          </CardContent>
        </Card>

        {/* Équipe noire */}
        <Card className="pixel-card">
          <CardHeader>
            <CardTitle className="text-2xl mb-4">Équipe Noire</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm">⚔️ Attaquant</label>
              <Select
                value={selectedPlayers.blackAttacker}
                onValueChange={(value) => handlePlayerSelection("blackAttacker", value)}
                required
              >
                <SelectTrigger className="pixel-select">
                  <SelectValue placeholder="Sélectionner un joueur" />
                </SelectTrigger>
                <SelectContent className="pixel-select-content">
                  {activePlayers.map(renderPlayerOption)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm">🛡️ Défenseur</label>
              <Select
                value={selectedPlayers.blackDefender}
                onValueChange={(value) => handlePlayerSelection("blackDefender", value)}
                required
              >
                <SelectTrigger className="pixel-select">
                  <SelectValue placeholder="Sélectionner un joueur" />
                </SelectTrigger>
                <SelectContent className="pixel-select-content">
                  {activePlayers.map(renderPlayerOption)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm">Score</label>
              <Input
                type="number"
                min={0}
                max={10}
                value={scores.black}
                onChange={(e) =>
                  setScores({ ...scores, black: parseInt(e.target.value) || 0 })
                }
                required
                className="pixel-input"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section des avertissements */}
      {getPlayerWarnings().length > 0 && (
        <div className="bg-yellow-900/20 border border-yellow-900/50 rounded-lg p-4 space-y-2">
          <h3 className="font-semibold text-yellow-500">Avertissements :</h3>
          <ul className="list-disc list-inside space-y-1">
            {getPlayerWarnings().map((warning) => (
              <li key={warning.playerId} className="text-yellow-500">
                {warning.pseudo} : {warning.warnings.join(", ")}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex justify-end">
        <Button
          type="submit"
          className="pixel-button"
          disabled={isLoading}
        >
          {isLoading ? "Enregistrement..." : "Enregistrer le match"}
        </Button>
      </div>
    </form>
  );
} 