import { supabase } from "@/lib/supabaseClient";

export interface GameConfig {
  max_hp: number;
  max_mana: number;
}

export async function getGameConfig(): Promise<GameConfig> {
  const { data, error } = await supabase
    .from('game_config')
    .select('key, value')
    .in('key', ['max_hp', 'max_mana']);

  if (error) {
    console.error('Error fetching game config:', error);
    // Valeurs par défaut si erreur
    return { max_hp: 10, max_mana: 10 };
  }

  const config = data.reduce((acc, item) => ({
    ...acc,
    [item.key]: item.value
  }), {} as GameConfig);

  return {
    max_hp: config.max_hp ?? 10,
    max_mana: config.max_mana ?? 10
  };
} 