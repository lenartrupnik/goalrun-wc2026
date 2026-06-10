import { cn } from "@/lib/utils";
import { forwardRef, type ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
}

export const buttonStyles = (
  variant: ButtonProps["variant"] = "primary",
  size: ButtonProps["size"] = "md",
  className?: string
) =>
  cn(
    "inline-flex items-center justify-center gap-2 rounded-pitch font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pitch-400 disabled:pointer-events-none disabled:opacity-50",
    variant === "primary" &&
      "bg-pitch-500 text-white shadow-glow hover:bg-pitch-400",
    variant === "ghost" &&
      "text-goal-muted hover:bg-pitch-800 hover:text-goal-white",
    variant === "outline" &&
      "border border-pitch-700 bg-transparent hover:bg-pitch-800",
    size === "sm" && "h-9 px-3 text-sm",
    size === "md" && "h-11 px-5 text-sm",
    size === "lg" && "h-12 px-8 text-base",
    className
  );

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={buttonStyles(variant, size, className)}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
export { Button };