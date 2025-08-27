import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className = "", variant = "default", size = "md", children, ...props },
    ref,
  ) => {
    const baseStyles =
      "font-medium rounded transition-colors focus:outline-none focus:ring-2";

    const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
      default: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
      outline:
        "border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500",
    };

    const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
      sm: "px-2 py-1 text-xs",
      md: "px-4 py-2 text-sm",
      lg: "px-6 py-3 text-base",
    };

    const styles = `${baseStyles} ${variants[variant!]} ${sizes[size!]} ${className}`;

    return (
      <button ref={ref} className={styles} {...props}>
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
