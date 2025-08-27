import React from "react";

interface SliderProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "type" | "onChange" | "value"
  > {
  value: number[];
  onValueChange: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
}

export const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  (
    {
      value,
      onValueChange,
      min = 0,
      max = 100,
      step = 1,
      className = "",
      ...props
    },
    ref,
  ) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onValueChange([Number(e.target.value)]);
    };

    return (
      <input
        ref={ref}
        type="range"
        value={value[0]}
        onChange={handleChange}
        min={min}
        max={max}
        step={step}
        className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider ${className}`}
        style={{
          background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((value[0] - min) / (max - min)) * 100}%, #e5e7eb ${((value[0] - min) / (max - min)) * 100}%, #e5e7eb 100%)`,
        }}
        {...props}
      />
    );
  },
);

Slider.displayName = "Slider";
