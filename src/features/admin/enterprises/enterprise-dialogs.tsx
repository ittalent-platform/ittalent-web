import { useState } from "react";
import { Ban, Check, Trash2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

function extractErrorMessage(err: unknown, defaultMsg: string): string {
  const obj = err as { data?: { message?: string }; message?: string } | null;
  return obj?.data?.message || obj?.message || (err instanceof Error ? err.message : defaultMsg);
}

type SuspendDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  enterpriseName: string;
  activeJobsCount?: number;
};

export function SuspendEnterpriseDialog({
  isOpen,
  onClose,
  onConfirm,
  enterpriseName,
  activeJobsCount = 0,
}: SuspendDialogProps) {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = reason.trim().length >= 10;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) {
      setError("Reason is required and must be at least 10 characters.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onConfirm(reason.trim());
      setReason("");
      onClose();
    } catch (err: unknown) {
      setError(extractErrorMessage(err, "Failed to suspend enterprise"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[500px] p-6 rounded-2xl bg-card border border-border shadow-2xl relative">
        <button
          aria-label={t("adminEnterprises.suspendDialog.close", "Close")}
          className="absolute right-4 top-4 rounded-sm text-muted-foreground opacity-70 transition-opacity hover:opacity-100 cursor-pointer"
          onClick={onClose}
          type="button"
        >
          <X className="size-4" />
        </button>

        <form onSubmit={handleSubmit} className="flex gap-4">
          <span className="size-10 shrink-0 rounded-xl bg-(--danger-bg) text-(--danger-fg) flex items-center justify-center">
            <Ban className="size-5" />
          </span>
          <div className="flex-1 flex flex-col gap-3 min-w-0">
            <DialogHeader className="p-0 text-left">
              <DialogTitle className="itt-display text-xl font-semibold text-foreground">
                {t("adminEnterprises.suspendDialog.title", "Suspend {{name}}?", { name: enterpriseName })}
              </DialogTitle>
              <DialogDescription className="text-[13.5px] leading-relaxed text-muted-foreground mt-1.5">
                The company page and its {activeJobsCount} open {activeJobsCount === 1 ? "job" : "jobs"} will be hidden from the public, and the company cannot publish new jobs. Existing applications are preserved. This action is recorded in the audit log.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-1.5 mt-2">
              <label htmlFor="suspend-reason" className="text-[13.5px] font-semibold text-foreground">
                {t("adminEnterprises.suspendDialog.reasonLabel", "Reason")} <span className="text-destructive">*</span>
              </label>
              <Textarea
                id="suspend-reason"
                rows={3}
                placeholder={t("adminEnterprises.suspendDialog.reasonPlaceholder", "Why is this enterprise suspended? (e.g. Unpaid platform invoice, legal documentation review)")}
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (error) setError(null);
                }}
                className="rounded-xl border-border p-3 text-sm focus-visible:ring-primary/20"
              />
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Required · shown in audit history
                </span>
                <span
                  className={
                    reason.trim().length >= 10
                      ? "text-(--status-success-fg) font-medium"
                      : "text-muted-foreground"
                  }
                >
                  {reason.trim().length}/10 min chars
                </span>
              </div>
              {reason.length > 0 && reason.trim().length < 10 && (
                <span className="text-xs text-(--status-warning-fg) font-medium">
                  Reason must be at least 10 characters ({10 - reason.trim().length} more needed)
                </span>
              )}
              {error && <span className="text-xs text-destructive font-medium">{error}</span>}
            </div>

            <DialogFooter className="mt-3 flex items-center justify-end gap-3 p-0">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="h-10 px-4 rounded-xl border-border text-sm font-semibold hover:bg-muted/50"
              >
                {t("adminEnterprises.suspendDialog.cancel", "Cancel")}
              </Button>
              <Button
                type="submit"
                disabled={!isValid || isSubmitting}
                variant="destructive"
                className="h-10 px-4 rounded-xl text-sm font-semibold shadow-sm"
              >
                {isSubmitting ? "Suspending..." : t("adminEnterprises.suspendDialog.confirm", "Suspend enterprise")}
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type ActivateDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => Promise<void>;
  enterpriseName: string;
  previousReason?: string | null;
};

export function ActivateEnterpriseDialog({
  isOpen,
  onClose,
  onConfirm,
  enterpriseName,
  previousReason,
}: ActivateDialogProps) {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirm(reason.trim() || undefined);
      setReason("");
      onClose();
    } catch (err: unknown) {
      setError(extractErrorMessage(err, "Failed to activate enterprise"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[500px] p-6 rounded-2xl bg-card border border-border shadow-2xl relative">
        <button
          aria-label={t("adminEnterprises.suspendDialog.close", "Close")}
          className="absolute right-4 top-4 rounded-sm text-muted-foreground opacity-70 transition-opacity hover:opacity-100 cursor-pointer"
          onClick={onClose}
          type="button"
        >
          <X className="size-4" />
        </button>

        <form onSubmit={handleSubmit} className="flex gap-4">
          <span className="size-10 shrink-0 rounded-xl bg-(--status-success-bg) text-(--status-success-fg) flex items-center justify-center">
            <Check className="size-5" />
          </span>
          <div className="flex-1 flex flex-col gap-3 min-w-0">
            <DialogHeader className="p-0 text-left">
              <DialogTitle className="itt-display text-xl font-semibold text-foreground">
                {t("adminEnterprises.activateDialog.title", "Activate {{name}}?", { name: enterpriseName })}
              </DialogTitle>
              <DialogDescription className="text-[13.5px] leading-relaxed text-muted-foreground mt-1.5">
                {t("adminEnterprises.activateDialog.description", {
                  defaultValue: "The company profile becomes public again and authorized recruiters can publish job postings immediately.",
                  name: enterpriseName,
                })}
              </DialogDescription>
            </DialogHeader>

            {previousReason ? (
              <div className="p-3 rounded-xl bg-muted/60 border border-border text-xs text-foreground/80 leading-relaxed">
                <strong>Current status note:</strong> {previousReason}
              </div>
            ) : null}

            <div className="flex flex-col gap-1.5 mt-1">
              <label htmlFor="activate-reason" className="text-[13.5px] font-semibold text-foreground">
                Activation note <span className="text-xs font-normal text-muted-foreground">(optional)</span>
              </label>
              <Textarea
                id="activate-reason"
                rows={2}
                placeholder={t("adminEnterprises.form.placeholders.statusReason", "Optional note for the audit log...")}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="rounded-xl border-border p-3 text-sm focus-visible:ring-primary/20"
              />
              {error && <span className="text-xs text-destructive font-medium">{error}</span>}
            </div>

            <DialogFooter className="mt-3 flex items-center justify-end gap-3 p-0">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="h-10 px-4 rounded-xl border-border text-sm font-semibold hover:bg-muted/50"
              >
                {t("adminEnterprises.activateDialog.cancel", "Cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-10 px-4 rounded-xl bg-(--status-success-fg) hover:bg-(--status-success-fg)/90 text-white text-sm font-semibold shadow-sm"
              >
                {isSubmitting ? "Activating..." : t("adminEnterprises.activateDialog.confirm", "Activate enterprise")}
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type DeleteDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  enterpriseName: string;
};

export function DeleteEnterpriseDialog({
  isOpen,
  onClose,
  onConfirm,
  enterpriseName,
}: DeleteDialogProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err: unknown) {
      setError(extractErrorMessage(err, "Failed to delete enterprise"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[500px] p-6 rounded-2xl bg-card border border-border shadow-2xl relative">
        <button
          aria-label={t("adminEnterprises.suspendDialog.close", "Close")}
          className="absolute right-4 top-4 rounded-sm text-muted-foreground opacity-70 transition-opacity hover:opacity-100 cursor-pointer"
          onClick={onClose}
          type="button"
        >
          <X className="size-4" />
        </button>

        <form onSubmit={handleSubmit} className="flex gap-4">
          <span className="size-10 shrink-0 rounded-xl bg-(--danger-bg) text-(--danger-fg) flex items-center justify-center">
            <Trash2 className="size-5" />
          </span>
          <div className="flex-1 flex flex-col gap-3 min-w-0">
            <DialogHeader className="p-0 text-left">
              <DialogTitle className="itt-display text-xl font-semibold text-foreground">
                {t("adminEnterprises.deleteDialog.title", "Delete {{name}}?", { name: enterpriseName })}
              </DialogTitle>
              <DialogDescription className="text-[13.5px] leading-relaxed text-muted-foreground mt-1.5">
                {t("adminEnterprises.deleteDialog.description", {
                  defaultValue: "The enterprise profile is soft-deleted and removed from the active directory and public portal. Past job application records are preserved for audit compliance. This action cannot be reversed from this interface.",
                  name: enterpriseName,
                })}
              </DialogDescription>
            </DialogHeader>

            {error && <span className="text-xs text-destructive font-medium">{error}</span>}

            <DialogFooter className="mt-4 flex items-center justify-end gap-3 p-0">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="h-10 px-4 rounded-xl border-border text-sm font-semibold hover:bg-muted/50"
              >
                {t("adminEnterprises.deleteDialog.cancel", "Cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                variant="destructive"
                className="h-10 px-4 rounded-xl text-sm font-semibold shadow-sm"
              >
                {isSubmitting ? "Deleting..." : t("adminEnterprises.deleteDialog.confirm", "Delete enterprise")}
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
