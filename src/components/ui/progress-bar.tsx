import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProgressBarProps {
  value: number;
  maxValue: number;
  tooltip?: string;
  className?: string;
  height?: string;
}

export function ProgressBar({ value, maxValue, tooltip, className = "", height = "h-5" }: ProgressBarProps) {
  const progress = Math.max(0, Math.min(100, (value / maxValue) * 100));
  
  const progressBar = (
    <div className={`w-full ${height} bg-white border border-gray-200 overflow-hidden ${className}`}>
      <div 
        className="h-full bg-[#FFD700] transition-all" 
        style={{ width: `${progress}%` }}
      />
    </div>
  );
  
  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="w-full block cursor-pointer">
              {progressBar}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-sm whitespace-pre-line">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return progressBar;
} 