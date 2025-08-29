import React from "react";
import { useAudioInputContext } from "./AudioInput";
import { Label } from "../ui/label";
import { Slider } from "../ui/slider";
import { cn } from "../utils/cn";

export interface AudioInputControlsProps {
  className?: string;
  showReactivityControl?: boolean;
  showLabels?: boolean;
  showValues?: boolean;
  hideWhenInactive?: boolean;
  minReactivity?: number;
  maxReactivity?: number;
  reactivityStep?: number;
  onReactivityChange?: (value: number) => void;
  children?: React.ReactNode;
}

export function AudioInputControls({
  className,
  showReactivityControl = true,
  showLabels = true,
  showValues = true,
  hideWhenInactive = false,
  minReactivity = 0,
  maxReactivity = 1.5,
  reactivityStep = 0.1,
  onReactivityChange,
  children,
}: AudioInputControlsProps) {
  const { audioReactivity, setAudioReactivity, isListening, isDemoPlaying } =
    useAudioInputContext();

  if (hideWhenInactive && !isListening && !isDemoPlaying) {
    return null;
  }

  const handleReactivityChange = (value: number[]) => {
    const newValue = value[0];
    setAudioReactivity(newValue);
    onReactivityChange?.(newValue);
  };

  return (
    <div className={cn("space-y-3", className)}>
      {showReactivityControl && (
        <div className="flex items-center gap-4">
          {showLabels && (
            <Label className="text-sm text-slate-700 min-w-[80px]">
              Reactivity
            </Label>
          )}
          <Slider
            value={[audioReactivity]}
            onValueChange={handleReactivityChange}
            min={minReactivity}
            max={maxReactivity}
            step={reactivityStep}
            className="flex-1"
          />
          {showValues && (
            <span className="text-xs text-slate-600 min-w-[40px]">
              {audioReactivity.toFixed(2)}
            </span>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
