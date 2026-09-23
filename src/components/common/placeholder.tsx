import { cn } from "@/lib/utils";

export function Placeholder({ label, className }: { label: string; className?: string }) {
  return (
    <div className={cn("itt-ph text-center", className)}>
      <span className="itt-mono text-xs text-[var(--fg-subtle)]">{label}</span>
    </div>
  );
}
