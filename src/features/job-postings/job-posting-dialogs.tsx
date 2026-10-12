import { useState } from "react";
import { AlertTriangle, Archive, Check, Lock, RotateCcw, Send, Trash2, Undo2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import type { JobPosting, JobPostingHistory } from "@/api/generated/types.gen";
import { ActionConfirmDialog } from "@/components/common/action-confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { formatPostedDate, jobDisplayId } from "./job-postings.format";

type CommonDialogProps = {
  disabled?: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  posting: JobPosting;
};

export function CloseJobDialog({
  disabled,
  onConfirm,
  onOpenChange,
  open,
  posting,
}: CommonDialogProps) {
  const { t } = useTranslation();
  return (
    <ActionConfirmDialog
      action={t("jobPostings.dialogs.close.confirm")}
      cancelLabel={t("jobPostings.dialogs.close.keepOpen")}
      description={t("jobPostings.dialogs.close.description", {
        count: posting.applicationCount ?? 0,
        title: posting.title,
      })}
      disabled={disabled}
      icon={Lock}
      onConfirm={onConfirm}
      onOpenChange={onOpenChange}
      open={open}
      title={t("jobPostings.lifecycle.close.title", { title: posting.title })}
      variant="destructive-solid"
    />
  );
}

export function ArchiveJobDialog({
  disabled,
  onConfirm,
  onOpenChange,
  open,
  posting,
}: CommonDialogProps) {
  const { t } = useTranslation();
  return (
    <ActionConfirmDialog
      action={t("jobPostings.dialogs.archive.confirm")}
      cancelLabel={t("jobPostings.dialogs.archive.keepClosed")}
      description={t("jobPostings.dialogs.archive.description")}
      disabled={disabled}
      icon={Archive}
      onConfirm={onConfirm}
      onOpenChange={onOpenChange}
      open={open}
      title={t("jobPostings.lifecycle.archive.title", { title: posting.title })}
      variant="violet-solid"
    />
  );
}

export function UnarchiveJobDialog({
  disabled,
  onConfirm,
  onOpenChange,
  open,
  posting,
}: CommonDialogProps) {
  const { t } = useTranslation();
  return (
    <ActionConfirmDialog
      action={t("jobPostings.dialogs.unarchive.confirm")}
      cancelLabel={t("jobPostings.dialogs.unarchive.cancel")}
      description={t("jobPostings.dialogs.unarchive.description")}
      disabled={disabled}
      icon={RotateCcw}
      onConfirm={onConfirm}
      onOpenChange={onOpenChange}
      open={open}
      title={t("jobPostings.lifecycle.restore.title", { title: posting.title })}
      variant="violet-solid"
    />
  );
}

export function ReopenJobDialog({
  disabled,
  onConfirm,
  onOpenChange,
  open,
  posting,
}: CommonDialogProps) {
  const { t } = useTranslation();
  return (
    <ActionConfirmDialog
      action={t("jobPostings.lifecycle.reopen.confirm")}
      cancelLabel={t("jobPostings.cancel")}
      description={t("jobPostings.lifecycle.reopen.description")}
      disabled={disabled}
      icon={RotateCcw}
      onConfirm={onConfirm}
      onOpenChange={onOpenChange}
      open={open}
      title={t("jobPostings.lifecycle.reopen.title", { title: posting.title })}
      variant="info-solid"
    />
  );
}

export function PublishJobDialog({
  disabled,
  onConfirm,
  onOpenChange,
  open,
  posting,
}: CommonDialogProps) {
  const { t } = useTranslation();
  return (
    <ActionConfirmDialog
      action={t("jobPostings.lifecycle.publish.confirm")}
      cancelLabel={t("jobPostings.cancel")}
      description={t("jobPostings.lifecycle.publish.description")}
      disabled={disabled}
      icon={Send}
      onConfirm={onConfirm}
      onOpenChange={onOpenChange}
      open={open}
      title={t("jobPostings.lifecycle.publish.title", { title: posting.title })}
      variant="success-solid"
    />
  );
}

export function MoveToDraftDialog({
  disabled,
  onConfirm,
  onOpenChange,
  open,
  posting,
}: CommonDialogProps) {
  const { t } = useTranslation();
  return (
    <ActionConfirmDialog
      action={t("jobPostings.lifecycle.draft.confirm")}
      cancelLabel={t("jobPostings.cancel")}
      description={t("jobPostings.lifecycle.draft.description")}
      disabled={disabled}
      icon={Undo2}
      onConfirm={onConfirm}
      onOpenChange={onOpenChange}
      open={open}
      title={t("jobPostings.lifecycle.draft.title", { title: posting.title })}
      variant="default"
    />
  );
}

export function DeleteJobDialog({
  disabled,
  onConfirm,
  onOpenChange,
  open,
  posting,
}: CommonDialogProps) {
  const { t } = useTranslation();
  return (
    <ActionConfirmDialog
      action={t("jobPostings.delete.confirm")}
      cancelLabel={t("jobPostings.cancel")}
      description={t("jobPostings.delete.description")}
      disabled={disabled}
      icon={Trash2}
      onConfirm={onConfirm}
      onOpenChange={onOpenChange}
      open={open}
      title={t("jobPostings.delete.title", { title: posting.title })}
      variant="destructive-solid"
    />
  );
}

/**
 * 460px dialog that displays a checklist of missing fields when trying to publish a draft.
 */
export function PublishChecklistDialog({
  editPath,
  onOpenChange,
  open,
  posting,
}: {
  editPath: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  posting: JobPosting;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [now] = useState(() => Date.now());

  const isBasicsReady = Boolean(
    posting.title &&
      posting.title.trim().length >= 5 &&
      posting.employmentType &&
      posting.location,
  );
  const isDescReady = Boolean(
    posting.description && posting.description.trim().length >= 20,
  );
  const isRequirementsReady = Boolean(
    posting.requirements && posting.requirements.trim().length > 0,
  );
  const isBenefitsReady = Boolean(
    posting.benefits && posting.benefits.trim().length > 0,
  );
  const isDeadlineReady = Boolean(
    posting.expiresAt && new Date(posting.expiresAt).getTime() >= now,
  );

  const checklistItems = [
    {
      key: "basics",
      label: t("jobPostings.dialogs.publishBlocked.checklist.basics"),
      ready: isBasicsReady,
    },
    {
      key: "description",
      label: t("jobPostings.dialogs.publishBlocked.checklist.description"),
      ready: isDescReady,
    },
    {
      key: "requirements",
      label: t("jobPostings.dialogs.publishBlocked.checklist.requirements"),
      ready: isRequirementsReady,
    },
    {
      key: "benefits",
      label: t("jobPostings.dialogs.publishBlocked.checklist.benefits"),
      ready: isBenefitsReady,
    },
    {
      key: "deadline",
      label: t("jobPostings.dialogs.publishBlocked.checklist.deadline"),
      ready: isDeadlineReady,
    },
  ];

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-[460px] gap-0 rounded-xl p-[26px] shadow-2xl">
        <div className="flex gap-4">
          <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-(--status-warning-bg) text-(--status-warning-fg)">
            <AlertTriangle className="size-5" strokeWidth={2.2} />
          </div>
          <div className="flex-1 min-w-0">
            <DialogHeader className="gap-1 text-left">
              <DialogTitle className="itt-display text-[19px] font-semibold leading-[1.2] text-foreground">
                {t("jobPostings.dialogs.publishBlocked.title")}
              </DialogTitle>
              <DialogDescription className="text-[13.5px] leading-[1.55] text-muted-foreground">
                {t("jobPostings.dialogs.publishBlocked.description", {
                  title: posting.title,
                })}
              </DialogDescription>
            </DialogHeader>

            <ul className="mt-3 flex flex-col gap-2 rounded-lg border border-border bg-(--canvas) p-3 text-[13.5px]">
              {checklistItems.map((item) => (
                <li className="flex items-center gap-2.5" key={item.key}>
                  <span
                    className={`flex size-[18px] shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                      item.ready
                        ? "bg-(--status-success-bg) text-(--status-success-fg)"
                        : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {item.ready ? (
                      <Check className="size-3" strokeWidth={3} />
                    ) : (
                      <X className="size-3" strokeWidth={3} />
                    )}
                  </span>
                  <span
                    className={
                      item.ready ? "text-muted-foreground" : "font-medium text-foreground"
                    }
                  >
                    {item.label}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-5 flex justify-end gap-2.5">
              <Button
                className="h-10 px-4 text-[13.5px] font-semibold"
                onClick={() => onOpenChange(false)}
                type="button"
                variant="outline"
              >
                {t("jobPostings.dialogs.publishBlocked.cancel")}
              </Button>
              <Button
                className="h-10 px-4 text-[13.5px] font-semibold bg-(--status-success-fg) hover:opacity-90 text-white"
                onClick={() => {
                  onOpenChange(false);
                  navigate(editPath);
                }}
                type="button"
              >
                {t("jobPostings.dialogs.publishBlocked.openEditor")}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * 520px dialog showing the append-only activity history timeline and diffs.
 */
export function JobPostingHistoryDialog({
  history,
  onOpenChange,
  open,
  posting,
}: {
  history: JobPostingHistory | undefined;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  posting: JobPosting;
}) {
  const { t } = useTranslation();

  const items = history?.items ?? [];

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-[520px] gap-0 rounded-2xl p-0 shadow-2xl overflow-hidden">
        <div className="flex items-start justify-between border-b border-border px-6 pt-5 pb-4">
          <div>
            <DialogTitle className="itt-display text-[19px] font-semibold text-foreground">
              {t("jobPostings.dialogs.history.title")}
            </DialogTitle>
            <DialogDescription className="mt-0.5 text-[13px] text-muted-foreground">
              {posting.title} · {jobDisplayId(posting.id)}
            </DialogDescription>
          </div>
        </div>

        <div className="max-h-[calc(100vh-260px)] min-h-[160px] overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <p className="py-8 text-center text-[13.5px] text-muted-foreground">
              {t("jobPostings.history.empty")}
            </p>
          ) : (
            <ol className="relative flex flex-col">
              {items.map((item, index) => {
                const isLast = index === items.length - 1;
                const isPublish = item.action === "publish";
                return (
                  <li className="relative flex gap-3 pb-5" key={item.id}>
                    {!isLast ? (
                      <span
                        aria-hidden="true"
                        className="absolute top-4 left-[5px] bottom-0 w-px bg-border"
                      />
                    ) : null}
                    <span
                      aria-hidden="true"
                      className={`relative z-10 mt-1 size-3 shrink-0 rounded-full ${
                        isPublish
                          ? "bg-(--status-success-fg)"
                          : "bg-muted-foreground"
                      }`}
                    />
                    <div className="flex flex-1 min-w-0 flex-col gap-0.5">
                      <span className="text-[13.5px] font-semibold text-foreground">
                        {t(`jobPostings.history.actions.${item.action}`, {
                          defaultValue: item.action,
                        })}
                      </span>
                      <span className="text-[12.5px] text-muted-foreground">
                        {formatPostedDate(item.occurredAt)} ·{" "}
                        {t("jobPostings.history.actor", {
                          id: item.actorUserId.slice(-6).toUpperCase(),
                        })}
                      </span>
                      {item.changedFields && item.changedFields.length > 0 ? (
                        <span className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                          {t("jobPostings.history.changedFields", {
                            fields: item.changedFields.join(", "),
                          })}
                        </span>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        <div className="border-t border-border bg-(--canvas) px-6 py-3.5">
          <p className="text-[12.5px] leading-relaxed text-muted-foreground">
            {t("jobPostings.dialogs.history.timeNotice")}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
