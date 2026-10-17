import { useState } from "react";
import { ArrowRight, Bell } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Callout } from "@/components/common/callout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  STATUS_TONES,
  type ApplicationItem,
  type UpdatableStatus,
} from "./applications.constants";

export interface StatusDialogSubmission {
  status: UpdatableStatus;
  rejectionReason?: string;
  messageToCandidate?: string;
  note?: string;
}

export interface ApplicationStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ApplicationItem | null;
  targetStatus: UpdatableStatus | null;
  onConfirm: (payload: StatusDialogSubmission) => Promise<void> | void;
  isPending?: boolean;
  error?: Error | null;
}

export function ApplicationStatusDialog(props: ApplicationStatusDialogProps) {
  const { open, onOpenChange, item, targetStatus } = props;

  if (!item || !targetStatus) {
    return null;
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <ApplicationStatusDialogContent
        key={`${item.id}-${targetStatus}`}
        {...props}
        item={item}
        targetStatus={targetStatus}
      />
    </Dialog>
  );
}

function ApplicationStatusDialogContent({
  onOpenChange,
  item,
  targetStatus,
  onConfirm,
  isPending = false,
  error = null,
}: ApplicationStatusDialogProps & {
  item: ApplicationItem;
  targetStatus: UpdatableStatus;
}) {
  const { t } = useTranslation();

  const isReject = targetStatus === "rejected";
  const isOffer = targetStatus === "offered";

  const [rejectionReason, setRejectionReason] = useState("");
  const [messageToCandidate, setMessageToCandidate] = useState(
    isOffer
      ? t("recruiterApplications.statusDialog.offerDefaultMessage", {
          jobTitle: item.job.title,
        })
      : "",
  );
  const [note, setNote] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const currentTone = STATUS_TONES[item.status];
  const targetTone = STATUS_TONES[targetStatus];

  const title = isReject
    ? t("recruiterApplications.statusDialog.titleReject")
    : t("recruiterApplications.statusDialog.titleMove", {
        stage: t(`applications.status.${targetStatus}`),
      });

  const candidateName = item.applicant.fullName || item.applicant.email;
  const subtitle = `${candidateName} · ${item.job.title}`;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (isReject) {
      const trimmedReason = rejectionReason.trim();
      if (trimmedReason.length < 5 || trimmedReason.length > 500) {
        setValidationError(t("recruiterApplications.statusDialog.reasonRequired"));
        return;
      }
    }

    setValidationError(null);

    const submission: StatusDialogSubmission = {
      status: targetStatus,
      messageToCandidate: messageToCandidate.trim() || undefined,
      note: note.trim() || undefined,
      rejectionReason: isReject ? rejectionReason.trim() : undefined,
    };

    void onConfirm(submission);
  }

  // Determine error callout text
  const errorMessage = error
    ? error.message.includes("409") || error.message.toLowerCase().includes("conflict")
      ? t("recruiterApplications.statusDialog.conflictError")
      : error.message.toLowerCase().includes("prerequisite") ||
          error.message.toLowerCase().includes("interview")
        ? t("recruiterApplications.statusDialog.prerequisiteError")
        : error.message || t("recruiterApplications.statusDialog.genericError")
    : null;

  return (
    <DialogContent className="max-w-[520px] gap-5 p-6 sm:rounded-2xl">
        <DialogHeader className="gap-1 text-left">
          <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm font-medium text-muted-foreground">
            {subtitle}
          </DialogDescription>
        </DialogHeader>

        {/* Transition Pill Box */}
        <div className="flex items-center justify-between rounded-xl bg-muted/60 px-4 py-3">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                currentTone.badge,
              )}
            >
              <span className={cn("size-1.5 rounded-full", currentTone.dot)} />
              {t(`applications.status.${item.status}`)}
            </span>
            <ArrowRight className="size-3.5 text-muted-foreground" />
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                targetTone.badge,
              )}
            >
              <span className={cn("size-1.5 rounded-full", targetTone.dot)} />
              {t(`applications.status.${targetStatus}`)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Bell className="size-3.5 shrink-0" />
            <span>{t("recruiterApplications.statusDialog.candidateNotified")}</span>
          </div>
        </div>

        {errorMessage ? (
          <Callout role="alert" title={errorMessage} tone="error" />
        ) : null}

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {isReject ? (
            <div className="flex flex-col gap-1.5">
              <label
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                htmlFor="rejection-reason"
              >
                {t("recruiterApplications.statusDialog.reasonLabel")}{" "}
                <span className="text-destructive">*</span>
              </label>
              <Textarea
                aria-invalid={Boolean(validationError)}
                className={cn(
                  "min-h-[80px]",
                  validationError &&
                    "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20",
                )}
                id="rejection-reason"
                onChange={(e) => {
                  setRejectionReason(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                placeholder={t("recruiterApplications.statusDialog.reasonPlaceholder")}
                value={rejectionReason}
              />
              {validationError ? (
                <p className="text-xs font-medium text-destructive">{validationError}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {t("recruiterApplications.statusDialog.reasonHelper")}
                </p>
              )}
            </div>
          ) : null}

          {/* Candidate message field */}
          <div className="flex flex-col gap-1.5">
            <label
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              htmlFor="candidate-message"
            >
              {t("recruiterApplications.statusDialog.messageLabel")}
            </label>
            <Textarea
              className="min-h-[80px]"
              id="candidate-message"
              onChange={(e) => setMessageToCandidate(e.target.value)}
              placeholder={t("recruiterApplications.statusDialog.messagePlaceholder")}
              value={messageToCandidate}
            />
            <p className="text-xs text-muted-foreground">
              {t("recruiterApplications.statusDialog.messageHelper")}
            </p>
          </div>

          {/* Internal note field (for non-rejection or optional team note) */}
          {!isReject ? (
            <div className="flex flex-col gap-1.5">
              <label
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                htmlFor="internal-note"
              >
                {t("recruiterApplications.statusDialog.internalNoteLabel")}
              </label>
              <Textarea
                className="min-h-[70px]"
                id="internal-note"
                onChange={(e) => setNote(e.target.value)}
                placeholder={t("recruiterApplications.statusDialog.internalNotePlaceholder")}
                value={note}
              />
              <p className="text-xs text-muted-foreground">
                {t("recruiterApplications.statusDialog.internalNotePlaceholder")}
              </p>
            </div>
          ) : null}

          <DialogFooter className="mt-2 flex flex-row items-center justify-end gap-2.5">
            <Button
              className="h-10 px-4 font-medium"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
              shape="xl"
              type="button"
              variant="secondary"
            >
              {t("recruiterApplications.statusDialog.cancel")}
            </Button>
            {isReject ? (
              <Button
                className="h-10 px-5 font-semibold"
                disabled={isPending}
                shape="xl"
                type="submit"
                variant="destructive-solid"
              >
                {isPending
                  ? t("recruiterApplications.statusDialog.updating")
                  : t("recruiterApplications.statusDialog.confirmReject")}
              </Button>
            ) : (
              <Button
                className="h-10 px-5 font-semibold"
                disabled={isPending}
                shape="xl"
                type="submit"
                variant="default"
              >
                {isPending
                  ? t("recruiterApplications.statusDialog.updating")
                  : t("recruiterApplications.statusDialog.confirmMove", {
                      stage: t(`applications.status.${targetStatus}`),
                    })}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
  );
}
