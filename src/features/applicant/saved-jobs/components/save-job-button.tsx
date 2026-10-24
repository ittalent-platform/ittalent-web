import { Heart, Loader2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { requestErrorMessage, requestStatus } from "@/api/request-error";
import { useSession } from "@/auth/use-session";
import { useToast } from "@/components/toast/toast-provider";
import { cn } from "@/lib/utils";
import {
  useCheckSavedJobQuery,
  useRemoveSavedJobMutation,
  useSaveJobMutation,
} from "@/features/applicant/saved-jobs/saved-jobs.queries";
import { SignInToSaveDialog } from "./sign-in-to-save-dialog";

export type SaveJobButtonProps = {
  jobId: string;
  jobTitle?: string;
  variant?: "pill" | "icon";
  className?: string;
  redirectTo?: string;
  onSaveSuccess?: () => void;
  onRemoveSuccess?: () => void;
};

function resolveToastErrorMessage(error: unknown, fallback: string): string {
  const status = requestStatus(error);
  if (typeof status === "number" && status >= 400 && status < 500) {
    return requestErrorMessage(error, fallback);
  }
  return fallback;
}

export function SaveJobButton({
  jobId,
  jobTitle,
  variant = "pill",
  className,
  redirectTo,
  onSaveSuccess,
  onRemoveSuccess,
}: SaveJobButtonProps) {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [signInOpen, setSignInOpen] = useState(false);

  const isCandidate = session?.user?.role === "user";
  const isStaff = Boolean(session?.user?.role && session.user.role !== "user");

  const { data: checkData } = useCheckSavedJobQuery(jobId, {
    enabled: isCandidate && Boolean(jobId),
  });

  const isSaved = Boolean(checkData?.isSaved);
  const saveMutation = useSaveJobMutation();
  const removeMutation = useRemoveSavedJobMutation();
  const isPending = saveMutation.isPending || removeMutation.isPending;

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();

    if (!session) {
      setSignInOpen(true);
      return;
    }

    if (isStaff || isPending) {
      return;
    }

    if (isSaved) {
      removeMutation.mutate(jobId, {
        onSuccess: () => {
          onRemoveSuccess?.();
          showToast({
            tone: "success",
            title: t("savedJobs.toast.removedTitle", "Removed from saved jobs"),
            message: t("savedJobs.toast.removedMessage", "Job removed from your bookmarks."),
            action: {
              label: t("savedJobs.toast.undo", "Undo"),
              onClick: () => {
                saveMutation.mutate(jobId, {
                  onSuccess: () => {
                    onSaveSuccess?.();
                  },
                  onError: (error) => {
                    showToast({
                      tone: "error",
                      title: t("savedJobs.toast.errorSaveTitle", "Couldn't save job"),
                      message: resolveToastErrorMessage(
                        error,
                        t("savedJobs.toast.errorSaveFallback", "Couldn't save. Try again"),
                      ),
                    });
                  },
                });
              },
            },
          });
        },
        onError: (error) => {
          showToast({
            tone: "error",
            title: t("savedJobs.toast.errorRemoveTitle", "Couldn't remove job"),
            message: resolveToastErrorMessage(
              error,
              t("savedJobs.toast.errorRemoveFallback", "Couldn't remove. Try again"),
            ),
          });
        },
      });
    } else {
      saveMutation.mutate(jobId, {
        onSuccess: () => {
          onSaveSuccess?.();
          showToast({
            tone: "success",
            title: t("savedJobs.toast.savedTitle", "Job saved"),
            message: t("savedJobs.toast.savedMessage", "Job saved to your bookmarks."),
            action: {
              label: t("savedJobs.toast.viewSavedJobs", "View saved jobs"),
              onClick: () => {
                navigate("/saved-jobs");
              },
            },
          });
        },
        onError: (error) => {
          showToast({
            tone: "error",
            title: t("savedJobs.toast.errorSaveTitle", "Couldn't save job"),
            message: resolveToastErrorMessage(
              error,
              t("savedJobs.toast.errorSaveFallback", "Couldn't save. Try again"),
            ),
          });
        },
      });
    }
  }

  if (isStaff) {
    if (variant === "icon") return null;
    return (
      <button
        aria-disabled="true"
        className={cn(
          "inline-flex h-10 select-none items-center gap-2 rounded-full border border-mkt-line bg-mkt-chip px-4 text-sm font-semibold text-mkt-muted opacity-60 cursor-not-allowed",
          className,
        )}
        title={t("savedJobs.button.staffDisabled", "Saving jobs is for candidate accounts")}
        type="button"
      >
        <Heart aria-hidden="true" className="size-[17px] stroke-current" />
        <span>{t("savedJobs.button.save", "Save")}</span>
      </button>
    );
  }

  const tooltipText = isSaved
    ? t("savedJobs.button.tooltipRemove", "Click to remove from saved jobs")
    : isPending
      ? t("savedJobs.button.saving", "Saving…")
      : t("savedJobs.button.tooltipSave", "Save job");

  const ariaLabel = isSaved
    ? t("savedJobs.button.ariaSaved", {
        title: jobTitle ?? "job",
        defaultValue: `Saved. Remove ${jobTitle ?? "job"} from saved jobs`,
      })
    : t("savedJobs.button.ariaSave", {
        title: jobTitle ?? "job",
        defaultValue: `Save ${jobTitle ?? "job"}`,
      });

  return (
    <>
      {variant === "pill" ? (
        <button
          aria-label={ariaLabel}
          aria-pressed={isSaved}
          className={cn(
            "relative inline-flex h-10 select-none items-center gap-2 rounded-full border px-4 text-sm font-semibold whitespace-nowrap transition-colors",
            isPending && "cursor-wait opacity-80",
            isSaved
              ? "border-mkt-accent-border bg-mkt-accent-soft text-mkt-accent-hover hover:bg-mkt-accent-soft/80"
              : "border-mkt-line-strong bg-white text-mkt-ink hover:border-mkt-line hover:bg-mkt-chip",
            className,
          )}
          disabled={isPending}
          onClick={handleClick}
          title={tooltipText}
          type="button"
        >
          {isPending ? (
            <Loader2 aria-hidden="true" className="size-[17px] animate-spin text-mkt-muted" />
          ) : isSaved ? (
            <Heart aria-hidden="true" className="size-[17px] fill-mkt-brand stroke-mkt-brand" />
          ) : (
            <Heart aria-hidden="true" className="size-[17px] fill-none stroke-current" />
          )}
          <span>
            {isPending
              ? t("savedJobs.button.saving", "Saving…")
              : isSaved
                ? t("savedJobs.button.saved", "Saved")
                : t("savedJobs.button.save", "Save")}
          </span>
        </button>
      ) : (
        <button
          aria-label={ariaLabel}
          aria-pressed={isSaved}
          className={cn(
            "relative inline-flex size-10 shrink-0 select-none items-center justify-center rounded-full border transition-colors",
            isSaved
              ? "border-mkt-accent-border bg-mkt-accent-soft text-mkt-brand hover:bg-mkt-accent-soft/80"
              : "border-mkt-line-strong bg-white text-mkt-ink-2 hover:border-mkt-line hover:bg-mkt-chip",
            isPending && "cursor-wait opacity-80",
            className,
          )}
          disabled={isPending}
          onClick={handleClick}
          title={tooltipText}
          type="button"
        >
          {isPending ? (
            <Loader2 aria-hidden="true" className="size-[18px] animate-spin text-mkt-muted" />
          ) : isSaved ? (
            <Heart aria-hidden="true" className="size-[18px] fill-mkt-brand stroke-mkt-brand" />
          ) : (
            <Heart aria-hidden="true" className="size-[18px] fill-none stroke-current" />
          )}
        </button>
      )}

      <SignInToSaveDialog
        onOpenChange={setSignInOpen}
        open={signInOpen}
        redirectTo={redirectTo}
      />
    </>
  );
}
