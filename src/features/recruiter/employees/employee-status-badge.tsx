import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type EmployeeStatusBadgeProps = {
  status: string;
  className?: string;
};

export function EmployeeStatusBadge({
  status,
  className,
}: EmployeeStatusBadgeProps) {
  const normalized = status.toLowerCase();

  switch (normalized) {
    case "active":
      return (
        <Badge
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400",
            className,
          )}
        >
          <span className="size-1.5 rounded-full bg-emerald-500" />
          Active
        </Badge>
      );
    case "pending":
    case "invitation pending":
    case "inactive":
    case "invited":
      return (
        <Badge
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400",
            className,
          )}
        >
          <span className="size-1.5 rounded-full bg-amber-500" />
          Invitation pending
        </Badge>
      );
    case "suspended":
    case "blocked":
      return (
        <Badge
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border border-rose-500/20 bg-rose-500/10 px-2.5 py-0.5 text-xs font-medium text-rose-600 dark:text-rose-400",
            className,
          )}
        >
          <span className="size-1.5 rounded-full bg-rose-500" />
          Suspended
        </Badge>
      );
    case "revoked":
      return (
        <Badge
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border border-zinc-500/20 bg-zinc-500/10 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:text-zinc-400",
            className,
          )}
        >
          <span className="size-1.5 rounded-full bg-zinc-400" />
          Revoked
        </Badge>
      );
    default:
      return (
        <Badge
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700",
            className,
          )}
        >
          {status}
        </Badge>
      );
  }
}
