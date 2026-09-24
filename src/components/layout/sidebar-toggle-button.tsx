import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";

type SidebarToggleButtonProps = {
  collapsed: boolean;
  onClick: () => void;
  className?: string;
};

export function SidebarToggleButton({ collapsed, className, onClick }: SidebarToggleButtonProps) {
  return (
    <button
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-transparent text-muted-foreground transition duration-200 hover:-translate-y-px hover:border-primary hover:text-foreground active:translate-y-0 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
        className,
      )}
      onClick={onClick}
      title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      type="button"
    >
      {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
    </button>
  );
}
