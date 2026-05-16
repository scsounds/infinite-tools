import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex h-10 items-center justify-center gap-2 rounded-md border text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4",
  {
    variants: {
      variant: {
        primary:
          "border-cyan-300/40 bg-cyan-300/14 text-cyan-50 shadow-[0_0_24px_rgba(99,230,226,0.12)] hover:bg-cyan-300/20",
        secondary:
          "border-white/12 bg-white/[0.06] text-stone-100 hover:border-white/20 hover:bg-white/[0.09]",
        ghost: "border-transparent bg-transparent text-stone-300 hover:bg-white/[0.06] hover:text-white",
        danger:
          "border-red-300/30 bg-red-400/10 text-red-100 hover:bg-red-400/16"
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4",
        lg: "h-12 px-5 text-base",
        icon: "h-10 w-10 p-0"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "md"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
