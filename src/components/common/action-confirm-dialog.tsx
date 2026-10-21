import { useRef, useState, type ReactNode } from "react";
import { TriangleAlert, X, type LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { InlineErrorAlert } from "./inline-error-alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ActionVariant = "default" | "destructive-solid" | "info-solid" | "success-solid" | "violet-solid" | "warning-solid";

/** Footer buttons of every dialog: 40px high, default radius. */
export const DIALOG_BUTTON_CLASS = "h-10 px-4 text-[13.5px] font-semibold";

/** A header (title + description) at most this tall is one line of description: the icon centres on it, otherwise it aligns with the first line. */
const ICON_CENTER_MAX_HEIGHT_PX = 60;

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
  cancel,
  cancelLabel = "Cancel",
  closeButton = false,
  children,
  confirmDisabled,
  description,
  dirty = false,
  disabled,
  error,
  footerExtra,
  icon: Icon,
  iconVariant,
  keepOpenOnConfirm = false,
  noCancel = false,
  onConfirm,
  onOpenChange,
  open,
  title,
  variant,
}: {
  action: ReactNode;
  /** Replaces the Cancel button with this element (e.g. a link), which still closes the dialog. */
  cancel?: ReactNode;
  cancelLabel?: string;
  /** Adds an X in the top-right corner, for dialogs whose footer has no plain Cancel. */
  closeButton?: boolean;
  /** Extra body between the description and the footer, e.g. a reason field. */
  children?: ReactNode;
  /** Disables only the confirm button (the dialog can still be cancelled). */
  confirmDisabled?: boolean;
  /** Omit when the body says it all (the title is then the only announced text). */
  description?: ReactNode;
  /** Something was typed: closing (outside click, Escape, Cancel) asks to discard it first instead of dropping it silently. */
  dirty?: boolean;
  /** A request is running: the dialog cannot be closed. */
  disabled?: boolean;
  error?: ReactNode;
  /** Extra footer button(s) between Cancel and the confirm action. */
  footerExtra?: ReactNode;
  icon: LucideIcon;
  /** Icon tile colour when it differs from the confirm button, e.g. a blue tile over the primary button. */
  iconVariant?: ActionVariant;
  /** Radix closes the dialog on confirm by default; set this when the caller closes it after an async result. */
  keepOpenOnConfirm?: boolean;
  /** Only the confirm button, for a notice the user just acknowledges. */
  noCancel?: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  title: string;
  variant: ActionVariant;
}) {
  const { t } = useTranslation();
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [centered, setCentered] = useState(true);
  const confirming = useRef(false);

  function requestClose() {
    if (disabled) return;
    if (dirty) setConfirmDiscard(true);
    else onOpenChange(false);
  }

  return (
    <>
      <AlertDialog onOpenChange={(next) => { if (next) onOpenChange(true); else if (confirming.current) { confirming.current = false; onOpenChange(false); } else requestClose(); }} open={open}>
        <AlertDialogContent className="max-w-[560px] gap-0 overflow-hidden rounded-lg p-0 shadow-xl" onOverlayClick={requestClose} {...(description ? {} : { "aria-describedby": undefined })}>
          {closeButton ? <AlertDialogCancel aria-label={t("actions.close")} className="absolute right-5 top-5 size-9 border-0 p-0 text-muted-foreground shadow-none hover:bg-muted" disabled={disabled}><X className="size-5" /></AlertDialogCancel> : null}
          <div className={`min-w-0 px-[26px] pb-5 pt-6 ${closeButton ? "pr-16" : ""}`}>
            <div className={`flex min-w-0 gap-4 ${centered ? "items-center" : "items-start"}`} ref={(element) => { if (element) setCentered(element.offsetHeight <= ICON_CENTER_MAX_HEIGHT_PX); }}>
              <div className={`grid size-10 shrink-0 place-items-center rounded-md ${iconStyles[iconVariant ?? variant]}`}>
                <Icon className="size-5" strokeWidth={2.2} />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <AlertDialogTitle className="itt-display [overflow-wrap:anywhere] text-[19px] font-semibold leading-[1.2] text-foreground">{title}</AlertDialogTitle>
                {description ? <AlertDialogDescription className="text-[13.5px] leading-[1.55] text-muted-foreground">{description}</AlertDialogDescription> : null}
              </div>
            </div>
            {children ? <div className="mt-4">{children}</div> : null}
            {error ? <div className="mt-4"><InlineErrorAlert>{error}</InlineErrorAlert></div> : null}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border px-[26px] py-5">
            {noCancel ? null : cancel ? <AlertDialogCancel asChild className={DIALOG_BUTTON_CLASS} disabled={disabled} shape="default">{cancel}</AlertDialogCancel> : <AlertDialogCancel className={DIALOG_BUTTON_CLASS} disabled={disabled} shape="default">{cancelLabel}</AlertDialogCancel>}
            {footerExtra}
            <AlertDialogAction className={DIALOG_BUTTON_CLASS} disabled={disabled || confirmDisabled} onClick={(event) => { if (keepOpenOnConfirm) event.preventDefault(); else confirming.current = true; onConfirm(); }} shape="default" variant={variant}>{action}</AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
      {dirty ? (
        <ActionConfirmDialog
          action={t("confirmDialog.discard")}
          cancelLabel={t("confirmDialog.keepEditing")}
          description={t("confirmDialog.discardDescription")}
          icon={TriangleAlert}
          onConfirm={() => { setConfirmDiscard(false); onOpenChange(false); }}
          onOpenChange={setConfirmDiscard}
          open={open && confirmDiscard}
          title={t("confirmDialog.discardTitle")}
          variant="destructive-solid"
        />
      ) : null}
    </>
  );
}
