import type { KeyboardEvent, MouseEvent, ReactNode } from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Generic card wrapper with a hover/selected checkbox affordance, used for
 * board/grid views that support multi-select + bulk actions. Not tied to
 * documents — reuse for any other card grid that needs selection.
 *
 * The top border color (if any) is applied via `topBorderClassName` using an
 * explicit `border-t-[color]` class rather than relying on a hover-safe
 * background utility, so it survives hover (see applications-board.tsx for
 * the bug this avoids: `hover:bg-muted/40` there visually washes out the
 * colored top border on hover).
 */
export function SelectableCard({
  children,
  className,
  isSelected,
  onClick,
  onSelectChange,
  selectionAlwaysVisible,
  topBorderClassName,
}: {
  children: ReactNode;
  className?: string;
  isSelected: boolean;
  onClick?: () => void;
  onSelectChange: (checked: boolean) => void;
  selectionAlwaysVisible?: boolean;
  topBorderClassName?: string;
}) {
  function handleCheckboxClick(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    onSelectChange(!isSelected);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    onClick?.();
  }

  return (
    <div
      className={cn(
        "group/card relative cursor-pointer rounded-xl border border-border bg-card p-4 text-foreground transition-shadow hover:shadow-md hover:-translate-y-0.5",
        "border-t-2",
        topBorderClassName,
        isSelected && "ring-2 ring-primary/40",
        className,
      )}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <button
        aria-label={isSelected ? "Deselect card" : "Select card"}
        aria-pressed={isSelected}
        className={cn(
          "absolute right-3 top-3 z-10 grid size-5 place-items-center rounded-[5px] border transition-opacity",
          isSelected
            ? "border-primary bg-primary text-primary-foreground opacity-100"
            : "border-border bg-card text-transparent opacity-0 group-hover/card:opacity-100 focus-visible:opacity-100",
          selectionAlwaysVisible && "opacity-100",
        )}
        onClick={handleCheckboxClick}
        type="button"
      >
        <Check className="size-3.5" strokeWidth={3} />
      </button>
      {children}
    </div>
  );
}
