import React from "react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Slider } from "../ui/slider";

interface BrushControlsProps {
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  fadingEnabled: boolean;
  onFadingToggle: (enabled: boolean) => void;
  canUndo: boolean;
  onUndo: () => void;
  onClear: () => void;
  className?: string;
}

export const BrushControls: React.FC<BrushControlsProps> = ({
  brushSize,
  onBrushSizeChange,
  fadingEnabled,
  onFadingToggle,
  canUndo,
  onUndo,
  onClear,
  className = "",
}) => {
  return (
    <div className={`flex items-center justify-between gap-2 p-2 ${className}`}>
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Label className="text-gray-700 text-sm font-medium whitespace-nowrap">
          Size:
        </Label>
        <div className="flex-1 min-w-0">
          <Slider
            value={[brushSize]}
            onValueChange={([value]) => onBrushSizeChange(value)}
            min={1}
            max={60}
            step={1}
            className="w-full"
          />
        </div>
        <span className="text-sm text-gray-600 w-8 text-right">
          {brushSize}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1 cursor-pointer">
          <input
            type="checkbox"
            checked={fadingEnabled}
            onChange={e => onFadingToggle(e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
          />
          <span className="text-sm text-gray-600">Fade</span>
        </label>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`text-2xl transition-colors ${
            canUndo
              ? "text-gray-700 hover:text-gray-900 cursor-pointer"
              : "text-gray-400 cursor-not-allowed"
          }`}
          title="Undo"
          aria-label="Undo last action"
        >
          ↶
        </button>
        <Button
          onClick={onClear}
          variant="outline"
          size="sm"
          className="text-gray-700"
        >
          Clear
        </Button>
      </div>
    </div>
  );
};
