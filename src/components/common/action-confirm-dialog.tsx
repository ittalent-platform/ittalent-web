import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { InlineErrorAlert } from "./inline-error-alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ActionVariant = "default" | "destructive-solid" | "info-solid" | "success-solid" | "violet-solid" | "warning-solid";

const iconStyles: Record<ActionVariant, string> = {
  default: "bg-muted text-muted-foreground",
  "destructive-solid": "bg-destructive/10 text-destructive",
  "info-solid": "bg-(--status-info-bg) text-(--status-info-fg)",
  "success-solid": "bg-(--status-success-bg) text-(--status-success-fg)",
  "violet-solid": "bg-(--status-blocked-bg) text-(--status-blocked-fg)",
  "warning-solid": "bg-(--status-warning-bg) text-(--status-warning-fg)",
};

export function ActionConfirmDialog({
  action,
  cancelLabel = "Cancel",
  description,
  disabled,
  error,
  icon: Icon,
  onConfirm,
  onOpenChange,
  open,
  title,
  variant,
}: {
  action: string;
  cancelLabel?: string;
  description: ReactNode;
  disabled?: boolean;
  error?: ReactNode;
  icon: LucideIcon;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  title: string;
  variant: ActionVariant;
}) {
  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent className="max-w-[440px] gap-0 rounded-lg px-[26px] py-6 shadow-xl">
        <div className="flex min-w-0 gap-4">
          <div className={`grid size-10 shrink-0 place-items-center rounded-md ${iconStyles[variant]}`}>
            <Icon className="size-5" strokeWidth={2.2} />
          </div>
          <div className="min-w-0 flex-1">
            <AlertDialogHeader className="gap-1.5">
              <AlertDialogTitle className="itt-display [overflow-wrap:anywhere] text-[19px] font-semibold leading-[1.2] text-foreground">{title}</AlertDialogTitle>
              <AlertDialogDescription className="text-[13.5px] leading-[1.55] text-muted-foreground">{description}</AlertDialogDescription>
            </AlertDialogHeader>
            {error ? <div className="mt-4"><InlineErrorAlert>{error}</InlineErrorAlert></div> : null}
            <AlertDialogFooter className="mt-6 gap-3">
              <AlertDialogCancel className="h-10 px-4 text-[13.5px] font-semibold" disabled={disabled} shape="default">{cancelLabel}</AlertDialogCancel>
              <AlertDialogAction className="h-10 px-4 text-[13.5px] font-semibold" disabled={disabled} onClick={onConfirm} shape="default" variant={variant}>{action}</AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
