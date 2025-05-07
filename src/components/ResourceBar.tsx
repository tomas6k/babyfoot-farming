import Image from 'next/image';

interface ResourceBarProps {
  current: number;
  max: number;
  type: 'hp' | 'mana';
}

export function ResourceBar({ current, max, type }: ResourceBarProps) {
  const filledImage = type === 'hp' ? '/assets/hp.png' : '/assets/mana.png';
  const emptyImage = type === 'hp' ? '/assets/hp-empty.png' : '/assets/mana-empty.png';
  const labelColor = type === 'hp' ? 'text-[#FF6B6B]' : 'text-[#87CEEB]';
  
  // Calculer le nombre d'icônes pleines et vides
  const percentage = Math.min(Math.max((current / max), 0), 1); // Limiter entre 0 et 1
  const filledIcons = Math.min(Math.round(percentage * max), max);
  const emptyIcons = Math.max(max - filledIcons, 0);

  return (
    <div className="flex items-center gap-2">
      <span className={`font-bold ${labelColor} w-12`}>
        {type.toUpperCase()}
      </span>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: filledIcons }, (_, i) => (
          <div key={`filled-${i}`} className="w-5 h-5 relative">
            <Image
              src={filledImage}
              alt={`${type} filled`}
              fill
              className="object-contain"
            />
          </div>
        ))}
        {Array.from({ length: emptyIcons }, (_, i) => (
          <div key={`empty-${i}`} className="w-5 h-5 relative">
            <Image
              src={emptyImage}
              alt={`${type} empty`}
              fill
              className="object-contain"
            />
          </div>
        ))}
      </div>
    </div>
  );
} 