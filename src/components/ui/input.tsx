import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-full border border-sakura-200 bg-white/80 px-5 py-2 text-sm text-ink shadow-sm transition-colors",
          "placeholder:text-ink-muted/70",
          "focus-visible:outline-none focus-visible:border-sakura-400 focus-visible:ring-2 focus-visible:ring-sakura-200",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
