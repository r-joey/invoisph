import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-selyo-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-navy-900 text-white hover:bg-navy-800 shadow-sm",
        accent: "bg-selyo-800 text-white hover:bg-selyo-700 shadow-sm",
        success: "bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm",
        outline:
          "border border-slate-200 bg-white hover:bg-slate-50 hover:text-slate-900 text-slate-700 shadow-xs",
        secondary:
          "bg-slate-100 text-slate-900 hover:bg-slate-200",
        ghost: "hover:bg-slate-100 hover:text-slate-900",
        link: "text-selyo-800 underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        default: "h-11 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
