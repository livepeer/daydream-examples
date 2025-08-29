import { useAudioInputContext } from "./AudioInput";
import { Label } from "../ui/label";
import { cn } from "../utils/cn";

export interface AudioInputLevelsProps {
  className?: string;
  showLabels?: boolean;
  showValues?: boolean;
  levelColors?: {
    low?: string;
    mid?: string;
    high?: string;
    overall?: string;
  };
  levelLabels?: {
    low?: string;
    mid?: string;
    high?: string;
    overall?: string;
  };
  hideWhenInactive?: boolean;
}

export function AudioInputLevels({
  className,
  showLabels = true,
  showValues = true,
  levelColors = {
    low: "bg-red-500",
    mid: "bg-yellow-500",
    high: "bg-green-500",
    overall: "bg-blue-500",
  },
  levelLabels = {
    low: "Low",
    mid: "Mid",
    high: "High",
    overall: "Overall",
  },
  hideWhenInactive = false,
}: AudioInputLevelsProps) {
  const { audioLevels, isListening, isDemoPlaying } = useAudioInputContext();

  if (hideWhenInactive && !isListening && !isDemoPlaying) {
    return null;
  }

  const levels = [
    { key: "low" as const, label: levelLabels.low!, color: levelColors.low! },
    { key: "mid" as const, label: levelLabels.mid!, color: levelColors.mid! },
    {
      key: "high" as const,
      label: levelLabels.high!,
      color: levelColors.high!,
    },
    {
      key: "overall" as const,
      label: levelLabels.overall!,
      color: levelColors.overall!,
    },
  ];

  return (
    <div
      className={cn(
        "bg-white rounded-lg p-3 space-y-2 border border-slate-200",
        className
      )}
    >
      {showLabels && (
        <Label className="text-xs text-slate-600">Audio Levels</Label>
      )}
      <div className="space-y-1">
        {levels.map(({ key, label, color }) => (
          <div key={key} className="flex items-center gap-2">
            {showLabels && (
              <span className="text-xs text-slate-700 w-12">{label}:</span>
            )}
            <div className="flex-1 bg-slate-200 rounded-full h-2">
              <div
                className={cn(
                  color,
                  "h-2 rounded-full transition-all duration-75"
                )}
                style={{ width: `${audioLevels[key] * 100}%` }}
              />
            </div>
            {showValues && (
              <span className="text-xs text-slate-600 w-8">
                {(audioLevels[key] * 100).toFixed(0)}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
