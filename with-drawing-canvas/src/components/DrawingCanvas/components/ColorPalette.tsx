import React from "react";

interface ColorPaletteProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
  colors?: Array<{ name: string; value: string }>;
  className?: string;
}

const DEFAULT_COLORS = [
  { name: "Black", value: "#000000" },
  { name: "White", value: "#FFFFFF" },
  { name: "Red", value: "#FF0000" },
  { name: "Blue", value: "#0000FF" },
  { name: "Green", value: "#00FF00" },
  { name: "Purple", value: "#800080" },
  { name: "Orange", value: "#FFA500" },
  { name: "Pink", value: "#FF69B4" },
  { name: "Yellow", value: "#FFFF00" },
];

export const ColorPalette: React.FC<ColorPaletteProps> = ({
  selectedColor,
  onColorChange,
  colors = DEFAULT_COLORS,
  className = "",
}) => {
  return (
    <div className={`flex items-center gap-2 p-2 ${className}`}>
      <span className="text-sm text-gray-600">Colors:</span>
      <div className="flex gap-1 flex-wrap">
        {colors.map(color => (
          <button
            key={color.value}
            onClick={() => onColorChange(color.value)}
            className={`w-6 h-6 rounded border-2 hover:scale-110 transition-transform ${
              selectedColor === color.value
                ? "border-gray-800 shadow-lg scale-110"
                : "border-gray-400"
            }`}
            style={{ backgroundColor: color.value }}
            title={color.name}
            aria-label={`Select ${color.name} color`}
          />
        ))}
      </div>
    </div>
  );
};
