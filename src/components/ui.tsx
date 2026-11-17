import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const buttonStyles = cva(
  "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-transform duration-150 ease-out active:not-disabled:scale-[0.96] disabled:opacity-40",
  {
    variants: {
      tone: {
        copper: "bg-copper text-ink",
        quiet: "bg-raised text-fg",
        ghost: "bg-transparent text-muted",
        line: "border border-line bg-transparent text-fg",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-11 px-4 text-sm",
        icon: "size-11",
      },
    },
    defaultVariants: { tone: "quiet", size: "md" },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonStyles>;

export function Button({ className, tone, size, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={cn(buttonStyles({ tone, size }), className)} {...props} />;
}
