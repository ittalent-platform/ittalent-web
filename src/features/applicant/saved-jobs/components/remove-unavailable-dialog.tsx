import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

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
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type RemoveUnavailableDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending?: boolean;
};

export function RemoveUnavailableDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending = false,
}: RemoveUnavailableDialogProps) {
  const { t } = useTranslation();

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent
        className="max-w-[420px] rounded-2xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <AlertDialogHeader className="gap-2">
          <AlertDialogTitle className="itt-display text-lg font-semibold text-mkt-ink">
            {t("savedJobs.dialog.removeUnavailableTitle", "Remove this saved job?")}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[13.5px] leading-relaxed text-mkt-ink-2">
            {t(
              "savedJobs.dialog.removeUnavailableDescription",
              "It's no longer available, so you can't save it again unless the employer reopens it.",
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-4 flex-row items-center justify-end gap-2.5 sm:justify-end">
          <AlertDialogCancel
            className={cn(
              buttonVariants({ variant: "outline", shape: "pill" }),
              "h-10 px-5 text-[13.5px] font-semibold text-mkt-ink hover:bg-mkt-chip",
            )}
            disabled={isPending}
          >
            {t("common.cancel", "Cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            className={cn(
              buttonVariants({ variant: "destructive", shape: "pill" }),
              "h-10 px-6 text-[13.5px] font-semibold bg-danger text-white hover:bg-danger/90",
            )}
            disabled={isPending}
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
          >
            {isPending ? (
              <Loader2 aria-hidden="true" className="mr-2 size-4 animate-spin" />
            ) : null}
            {t("savedJobs.dialog.removeConfirm", "Remove")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
