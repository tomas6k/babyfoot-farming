import React, { useEffect, useState } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../components/ui/tooltip";
import { getLevels, type LevelWithInfo } from '@/lib/queries/levels';

interface RankDisplayProps {
  currentLevel: number;
}

export function RankDisplay({ currentLevel }: RankDisplayProps) {
  const [levels, setLevels] = useState<LevelWithInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLevels() {
      try {
        const levelsData = await getLevels();
        setLevels(levelsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    }

    fetchLevels();
  }, []);

  if (loading) {
    return <div>Chargement des rangs...</div>;
  }

  if (error) {
    return <div>Erreur : {error}</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-pixel">Rangs</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {levels.map((level) => (
          <TooltipProvider key={level.level}>
            <Tooltip>
              <TooltipTrigger>
                <div
                  className={`p-4 rounded-lg border ${
                    currentLevel === level.level
                      ? "border-primary bg-primary/10"
                      : "border-border"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {level.display_illustration && (
                      <img
                        src={level.display_illustration}
                        alt={level.display_title || ''}
                        className="w-8 h-8 object-cover rounded"
                      />
                    )}
                    <div>
                      <p className="font-pixel text-sm">Niveau {level.level}</p>
                      <p className="text-sm text-muted-foreground">
                        {level.display_title || "Rang inconnu"}
                      </p>
                    </div>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{level.display_description || "Aucune description disponible"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    </div>
  );
} 