"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getSupabaseClient } from '@/lib/supabaseClient';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const supabase = getSupabaseClient();

interface UpdateProfileFormProps {
  currentPseudo: string;
  playerId: string;
}

export function UpdateProfileForm({ currentPseudo, playerId }: UpdateProfileFormProps) {
  const [pseudo, setPseudo] = useState(currentPseudo);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Vérifier la longueur du pseudo
      if (pseudo.length < 3 || pseudo.length > 20) {
        throw new Error("Le pseudo doit contenir entre 3 et 20 caractères");
      }

      // Vérifier si le pseudo est déjà pris
      const { data: existingPlayer } = await supabase
        .from("players")
        .select("id")
        .eq("pseudo", pseudo)
        .neq("id", playerId)
        .single();

      if (existingPlayer) {
        throw new Error("Ce pseudo est déjà pris");
      }

      // Mettre à jour le pseudo
      const { error: updateError } = await supabase
        .from("players")
        .update({ pseudo })
        .eq("id", playerId);

      if (updateError) throw updateError;

      toast.success("Pseudo mis à jour avec succès !");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="pseudo">Pseudo</Label>
        <Input
          id="pseudo"
          value={pseudo}
          onChange={(e) => setPseudo(e.target.value)}
          placeholder="Votre pseudo"
          disabled={isLoading}
          minLength={3}
          maxLength={20}
          required
        />
        <p className="text-sm text-gray-500">
          Le pseudo doit contenir entre 3 et 20 caractères
        </p>
      </div>
      <Button type="submit" disabled={isLoading || pseudo === currentPseudo}>
        {isLoading ? "Mise à jour..." : "Mettre à jour"}
      </Button>
    </form>
  );
} 