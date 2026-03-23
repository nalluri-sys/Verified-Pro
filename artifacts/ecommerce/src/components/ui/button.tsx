import React from "react";
import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, disabled, ...props }, ref) => {
    const variants = {
      primary: "bg-primary text-primary-foreground shadow-md hover:shadow-lg hover:bg-primary/90",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      outline: "border-2 border-border bg-transparent hover:bg-slate-50 text-foreground",
      ghost: "bg-transparent hover:bg-slate-100 text-foreground",
      destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
    };

    const sizes = {
      sm: "h-9 px-4 text-sm rounded-lg",
      md: "h-11 px-6 font-medium rounded-xl",
      lg: "h-14 px-8 text-lg font-semibold rounded-2xl",
      icon: "h-11 w-11 flex items-center justify-center rounded-xl",
    };

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
        className={cn(
          "inline-flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none relative overflow-hidden",
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled || isLoading}
        {...(props as any)}
      >
        {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
        {children}
      </motion.button>
    );
  }
);
Button.displayName = "Button";
