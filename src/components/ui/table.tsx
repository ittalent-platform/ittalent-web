import type { MouseEventHandler, ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { cn } from "@/lib/utils";
import { Skeleton } from "./skeleton";

export function Table({ className, children }: { children: ReactNode; className?: string }) {
  return (
    <div className="overflow-x-auto">
      <table className={cn("w-full border-collapse", className)}>{children}</table>
    </div>
  );
}

export function TableHead({ children, className }: { children: ReactNode; className?: string }) {
  return <thead className={cn("bg-surface-readonly", className)}>{children}</thead>;
}

export function TableHeaderRow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <tr
      className={cn(
        "h-[39px] border-b border-line-muted text-left text-[11.5px] font-bold uppercase leading-normal tracking-[0.06em] text-slate-subtle",
        className,
      )}
    >
      {children}
    </tr>
  );
}

export function TableHeaderCell({ children, className }: { children?: ReactNode; className?: string }) {
  return <th className={cn("px-4 py-3 font-bold first:px-5", className)}>{children}</th>;
}

export function TableBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function TableRow({
  children,
  className,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: MouseEventHandler<HTMLTableRowElement>;
}) {
  return (
    <tr
      className={cn(
        "h-[58px] border-b border-line-muted text-[13.5px] font-normal leading-normal text-foreground transition-colors last:border-b-0 hover:bg-surface-subtle",
        className,
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

export function TableCell({
  children,
  className,
  onClick,
}: {
  children?: ReactNode;
  className?: string;
  onClick?: MouseEventHandler<HTMLTableCellElement>;
}) {
  return (
    <td className={cn("px-4 py-3.5 first:px-5", className)} onClick={onClick}>
      {children}
    </td>
  );
}

export function TableSkeletonRows({ columns, rows = 5 }: { columns: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }, (_, index) => (
        <tr className="border-b border-border" key={index} /* static list */>
          <td className="px-5 py-3.5" colSpan={columns}>
            <Skeleton className="h-8 w-full" />
          </td>
        </tr>
      ))}
    </>
  );
}

export type SortDirection = "asc" | "desc";
export type SortState = "asc" | "desc" | null;

function SortIcon({ active, direction }: { active: boolean; direction: SortState }) {
  if (!active) {
    return (
      <span className="flex h-3.5 w-3.5 flex-col items-center justify-center text-muted-foreground/65">
        <ChevronUp className="size-3.5 -mb-1" />
        <ChevronDown className="size-3.5 -mt-1" />
      </span>
    );
  }

  return (
    <span className="flex h-3.5 w-3.5 flex-col items-center justify-center text-primary">
      <ChevronUp className={cn("size-3.5 -mb-1", direction === "asc" ? "opacity-100" : "opacity-30")} />
      <ChevronDown className={cn("size-3.5 -mt-1", direction === "desc" ? "opacity-100" : "opacity-30")} />
    </span>
  );
}

export function SortableHeaderButton({
  active = false,
  ariaLabel,
  direction,
  label,
  onClick,
}: {
  active?: boolean;
  ariaLabel?: string;
  direction: SortState;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={ariaLabel}
      className={cn("inline-flex cursor-pointer items-center gap-[5px] uppercase", active ? "text-primary" : "text-inherit")}
      onClick={onClick}
      type="button"
    >
      {label}
      <SortIcon active={active} direction={direction} />
    </button>
  );
}
