import { useState } from "react";
import { Ban, Check, Trash2 } from "lucide-react";
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
      <DialogContent className="max-w-[500px] p-6 rounded-2xl bg-white border border-[#e6e4df] shadow-2xl">
        <form onSubmit={handleSubmit} className="flex gap-4">
          <span className="w-10 h-10 shrink-0 rounded-xl bg-[#fbe9e7] text-[#b42318] flex items-center justify-center">
            <Ban className="w-5 h-5" />
          </span>
          <div className="flex-1 flex flex-col gap-3 min-w-0">
            <DialogHeader className="p-0 text-left">
              <DialogTitle className="font-['Space_Grotesk'] text-xl font-semibold text-[#19191c]">
                Suspend {enterpriseName}?
              </DialogTitle>
              <DialogDescription className="text-[13.5px] leading-relaxed text-[#64646b] mt-1.5">
                The company page and its {activeJobsCount > 0 ? `${activeJobsCount} ` : ""}jobs will be hidden from the public, and the company cannot publish new jobs. Existing applications are preserved. This action is recorded in the audit log.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-1.5 mt-2">
              <label htmlFor="suspend-reason" className="text-[13.5px] font-semibold text-[#19191c]">
                Reason <span className="text-[#d92d20]">*</span>
              </label>
              <Textarea
                id="suspend-reason"
                rows={3}
                placeholder="Why is this enterprise suspended? (e.g. Unpaid platform invoice, legal documentation review)"
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (error) setError(null);
                }}
                className={`rounded-xl border-[#dedcd6] p-3 text-sm focus-visible:ring-primary/20 ${
                  reason.length > 0 && reason.trim().length < 10 ? "border-amber-400 focus-visible:border-amber-500" : ""
                }`}
              />
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#64646b]">
                  Required · shown in audit history
                </span>
                <span
                  className={
                    reason.trim().length >= 10
                      ? "text-emerald-600 font-medium"
                      : reason.length > 0
                        ? "text-amber-600 font-medium"
                        : "text-[#64646b]"
                  }
                >
                  {reason.trim().length}/10 min chars
                </span>
              </div>
              {reason.length > 0 && reason.trim().length < 10 && (
                <span className="text-xs text-amber-600 font-medium">
                  Reason must be at least 10 characters ({10 - reason.trim().length} more needed)
                </span>
              )}
              {error && <span className="text-xs text-[#b42318] font-medium">{error}</span>}
            </div>

            <DialogFooter className="mt-3 flex items-center justify-end gap-3 p-0">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="h-10 px-4 rounded-xl border-[#e6e4df] text-sm font-semibold hover:bg-muted/50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!isValid || isSubmitting}
                className="h-10 px-4 rounded-xl bg-[#c62a1c] hover:bg-[#b02215] text-white text-sm font-semibold shadow-sm"
              >
                {isSubmitting ? "Suspending..." : "Suspend enterprise"}
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
      <DialogContent className="max-w-[500px] p-6 rounded-2xl bg-white border border-[#e6e4df] shadow-2xl">
        <form onSubmit={handleSubmit} className="flex gap-4">
          <span className="w-10 h-10 shrink-0 rounded-xl bg-[#e8f5ee] text-[#12764a] flex items-center justify-center">
            <Check className="w-5 h-5" />
          </span>
          <div className="flex-1 flex flex-col gap-3 min-w-0">
            <DialogHeader className="p-0 text-left">
              <DialogTitle className="font-['Space_Grotesk'] text-xl font-semibold text-[#19191c]">
                Activate {enterpriseName}?
              </DialogTitle>
              <DialogDescription className="text-[13.5px] leading-relaxed text-[#64646b] mt-1.5">
                The company profile becomes public again and authorized recruiters can publish job postings immediately.
              </DialogDescription>
            </DialogHeader>

            {previousReason ? (
              <div className="p-3 rounded-xl bg-[#fafaf8] border border-[#efede8] text-xs text-[#4a4a50] leading-relaxed">
                <strong>Current status note:</strong> {previousReason}
              </div>
            ) : null}

            <div className="flex flex-col gap-1.5 mt-1">
              <label htmlFor="activate-reason" className="text-[13.5px] font-semibold text-[#19191c]">
                Activation note <span className="text-xs font-normal text-[#64646b]">(optional)</span>
              </label>
              <Textarea
                id="activate-reason"
                rows={2}
                placeholder="Optional note for the audit log..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="rounded-xl border-[#dedcd6] p-3 text-sm focus-visible:ring-primary/20"
              />
              {error && <span className="text-xs text-[#b42318] font-medium">{error}</span>}
            </div>

            <DialogFooter className="mt-3 flex items-center justify-end gap-3 p-0">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="h-10 px-4 rounded-xl border-[#e6e4df] text-sm font-semibold hover:bg-muted/50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-10 px-4 rounded-xl bg-[#12764a] hover:bg-[#0f603c] text-white text-sm font-semibold shadow-sm"
              >
                {isSubmitting ? "Activating..." : "Activate enterprise"}
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
      <DialogContent className="max-w-[500px] p-6 rounded-2xl bg-white border border-[#e6e4df] shadow-2xl">
        <form onSubmit={handleSubmit} className="flex gap-4">
          <span className="w-10 h-10 shrink-0 rounded-xl bg-[#fbe9e7] text-[#b42318] flex items-center justify-center">
            <Trash2 className="w-5 h-5" />
          </span>
          <div className="flex-1 flex flex-col gap-3 min-w-0">
            <DialogHeader className="p-0 text-left">
              <DialogTitle className="font-['Space_Grotesk'] text-xl font-semibold text-[#19191c]">
                Delete {enterpriseName}?
              </DialogTitle>
              <DialogDescription className="text-[13.5px] leading-relaxed text-[#64646b] mt-1.5">
                The enterprise profile is soft-deleted and removed from the active directory and public portal. Past job application records are preserved for audit compliance. This action cannot be reversed from this interface.
              </DialogDescription>
            </DialogHeader>

            {error && <span className="text-xs text-[#b42318] font-medium">{error}</span>}

            <DialogFooter className="mt-4 flex items-center justify-end gap-3 p-0">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="h-10 px-4 rounded-xl border-[#e6e4df] text-sm font-semibold hover:bg-muted/50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-10 px-4 rounded-xl bg-[#c62a1c] hover:bg-[#b02215] text-white text-sm font-semibold shadow-sm"
              >
                {isSubmitting ? "Deleting..." : "Delete enterprise"}
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
