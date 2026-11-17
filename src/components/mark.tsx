import { cn } from "@/lib/cn";

export function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden="true">
      <path
        d="M5 22h22"
        className="stroke-copper"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M8 22c1.7-5 3.6-7.5 8-7.5s6.3 2.5 8 7.5"
        className="stroke-fg"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="16" cy="12" r="1.4" className="fill-copper" />
    </svg>
  );
}
