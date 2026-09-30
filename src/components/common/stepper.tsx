import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

/** Horizontal progress through an ordered pipeline; steps before `currentIndex` are complete. */
export function Stepper({ ariaLabel, currentIndex, steps }: { ariaLabel: string; currentIndex: number; steps: readonly string[] }) {
  return (
    <ol aria-label={ariaLabel} className="m-0 flex list-none border-t border-line-muted p-0 pt-[18px]">
      {steps.map((name, index) => {
        const isDone = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isLast = index === steps.length - 1;

        return (
          <li aria-current={isCurrent ? "step" : undefined} className="flex min-w-0 flex-1 flex-col items-center gap-2" key={name}>
            <div className="flex items-center self-stretch">
              <span className={cn("h-0.5 flex-1", index === 0 ? "bg-transparent" : index <= currentIndex ? "bg-primary" : "bg-border")} />
              <span
                className={cn(
                  "mx-1.5 grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold",
                  isDone && "bg-primary text-primary-foreground",
                  isCurrent && "border-2 border-primary bg-card text-primary",
                  !isDone && !isCurrent && "bg-muted text-slate-subtle",
                )}
              >
                {isDone ? <Check aria-hidden className="size-3.5" strokeWidth={3} /> : index + 1}
              </span>
              <span className={cn("h-0.5 flex-1", isLast ? "bg-transparent" : index < currentIndex ? "bg-primary" : "bg-border")} />
            </div>
            <span className={cn("text-center text-[12.5px]", isCurrent ? "font-bold text-foreground" : isDone ? "font-medium text-foreground" : "font-medium text-slate-subtle")}>{name}</span>
          </li>
        );
      })}
    </ol>
  );
}
