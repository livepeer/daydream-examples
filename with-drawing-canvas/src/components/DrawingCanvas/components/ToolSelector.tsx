import React from "react";
import { PaintBucket } from "lucide-react";

export type DrawingTool = "brush" | "line" | "circle" | "fill";

interface ToolSelectorProps {
  selectedTool: DrawingTool;
  onToolChange: (tool: DrawingTool) => void;
  className?: string;
}

export const ToolSelector: React.FC<ToolSelectorProps> = ({
  selectedTool,
  onToolChange,
  className = "",
}) => {
  const getButtonClass = (tool: DrawingTool) =>
    `flex items-center justify-center w-8 h-8 rounded transition-colors ${
      selectedTool === tool
        ? "bg-blue-600 text-white"
        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
    }`;

  return (
    <div
      className={`flex items-center justify-center gap-2 p-3 bg-gray-100 rounded-b-lg ${className}`}
    >
      <span className="text-sm text-gray-700 font-medium">Tools:</span>

      {/* Brush Tool */}
      <button
        onClick={() => onToolChange("brush")}
        className={getButtonClass("brush")}
        title="Brush"
        aria-label="Select brush tool"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 14c-1.66 0-3 1.34-3 3 0 1.31-1.16 2-2 2 .92 1.22 2.49 2 4 2 2.21 0 4-1.79 4-4 0-1.66-1.34-3-3-3zm13.71-9.37l-1.34-1.34c-.39-.39-1.02-.39-1.41 0L9 12.25 11.75 15l8.96-8.96c.39-.39.39-1.02 0-1.41z" />
        </svg>
      </button>

      {/* Line Tool */}
      <button
        onClick={() => onToolChange("line")}
        className={getButtonClass("line")}
        title="Line"
        aria-label="Select line tool"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3.5 5.5L20.5 18.5L19.5 19.5L2.5 6.5L3.5 5.5Z" />
        </svg>
      </button>

      {/* Circle Tool */}
      <button
        onClick={() => onToolChange("circle")}
        className={getButtonClass("circle")}
        title="Circle"
        aria-label="Select circle tool"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4Z" />
        </svg>
      </button>

      {/* Fill Tool */}
      <button
        onClick={() => onToolChange("fill")}
        className={getButtonClass("fill")}
        title="Fill"
        aria-label="Select fill tool"
      >
        <PaintBucket size={16} />
      </button>
    </div>
  );
};
