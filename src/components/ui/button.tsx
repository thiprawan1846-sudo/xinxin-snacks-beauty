import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "pill transition-all duration-300 active:scale-[0.97]",
  {
    variants: {
      variant: {
        default:
          "bg-sakura-500 text-white shadow-soft hover:bg-sakura-600 hover:shadow-soft-lg",
        gradient:
          "bg-gradient-to-r from-sakura-500 to-peach-500 text-white shadow-soft hover:shadow-soft-lg hover:brightness-[1.05]",
        secondary:
          "bg-white text-ink ring-1 ring-inset ring-sakura-200 hover:bg-sakura-50 hover:ring-sakura-300",
        outline:
          "bg-transparent text-sakura-600 ring-1 ring-inset ring-sakura-300 hover:bg-sakura-50",
        ghost: "bg-transparent text-ink-soft hover:bg-sakura-50 hover:text-sakura-600",
        destructive:
          "bg-rose-500 text-white shadow-soft hover:bg-rose-600",
        link: "bg-transparent text-sakura-600 underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        default: "h-11 px-6 text-sm",
        lg: "h-13 px-8 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
