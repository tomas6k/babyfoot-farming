"use client";

import { UpdateProfileForm } from "@/components/UpdateProfileForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Player {
  id: string;
  pseudo: string;
  exp: number;
  mana: number;
  hp: number;
}

interface ProfileClientProps {
  player: Player;
}

export function ProfileClient({ player }: ProfileClientProps) {
  return (
    <div className="container py-10">
      <h1 className="text-4xl font-bold mb-8 text-center text-[#FFD700] drop-shadow-[2px_2px_0px_rgba(0,0,0,0.5)]">
        Profil
      </h1>
      
      <div className="grid gap-6">
        {/* Carte des statistiques */}
        <Card className="pixel-card">
          <CardHeader>
            <CardTitle className="text-[#D4B886]">Statistiques</CardTitle>
            <CardDescription>Vos statistiques actuelles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="pixel-card p-4 flex flex-col items-center">
                <p className="text-sm font-medium text-[#FFD700]">EXP</p>
                <p className="text-2xl text-[#D4B886]">{player.exp}</p>
              </div>
              <div className="pixel-card p-4 flex flex-col items-center">
                <p className="text-sm font-medium text-[#87CEEB]">Mana</p>
                <div className="relative w-full h-4 mt-2 pixel-progress">
                  <div 
                    className="pixel-progress-value bg-[#87CEEB]"
                    style={{ width: `${(player.mana / 100) * 100}%` }}
                  />
                </div>
                <p className="text-lg text-[#87CEEB] mt-1">{player.mana}/100</p>
              </div>
              <div className="pixel-card p-4 flex flex-col items-center">
                <p className="text-sm font-medium text-[#FF6B6B]">HP</p>
                <div className="relative w-full h-4 mt-2 pixel-progress">
                  <div 
                    className="pixel-progress-value bg-[#FF6B6B]"
                    style={{ width: `${(player.hp / 100) * 100}%` }}
                  />
                </div>
                <p className="text-lg text-[#FF6B6B] mt-1">{player.hp}/100</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formulaire de mise à jour du pseudo */}
        <Card className="pixel-card">
          <CardHeader>
            <CardTitle className="text-[#D4B886]">Modifier votre pseudo</CardTitle>
            <CardDescription>
              Choisissez un pseudo unique entre 3 et 20 caractères
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UpdateProfileForm
              currentPseudo={player.pseudo}
              playerId={player.id}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 