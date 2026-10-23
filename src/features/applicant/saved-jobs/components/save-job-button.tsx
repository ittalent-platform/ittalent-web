import { Heart, Loader2 } from "lucide-react";
import { useState } from "react";

import { useSession } from "@/auth/use-session";
import { cn } from "@/lib/utils";
import { useCheckSavedJobQuery, useToggleSaveJobMutation } from "@/features/applicant/saved-jobs/saved-jobs.queries";
import { SignInToSaveDialog } from "./sign-in-to-save-dialog";

export type SaveJobButtonProps = {
  jobId: string;
  jobTitle?: string;
  variant?: "pill" | "icon";
  className?: string;
  onSaveSuccess?: () => void;
  onRemoveSuccess?: () => void;
};

export function SaveJobButton({
  jobId,
  jobTitle,
  variant = "pill",
  className,
  onSaveSuccess,
  onRemoveSuccess,
}: SaveJobButtonProps) {
  const { data: session } = useSession();
  const [signInOpen, setSignInOpen] = useState(false);

  const isCandidate = session?.user?.role === "user";
  const isStaff = Boolean(session?.user?.role && session.user.role !== "user");

  const { data: checkData } = useCheckSavedJobQuery(jobId, {
    enabled: isCandidate && Boolean(jobId),
  });

  const isSaved = Boolean(checkData?.isSaved);
  const toggleMutation = useToggleSaveJobMutation();
  const isPending = toggleMutation.isPending;

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();

    if (!session) {
      setSignInOpen(true);
      return;
    }

    if (isStaff) {
      return;
    }

    if (isPending) {
      return;
    }

    toggleMutation.mutate(jobId, {
      onSuccess: (data) => {
        if (data.saved) {
          onSaveSuccess?.();
        } else {
          onRemoveSuccess?.();
        }
      },
    });
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
        title="Saving jobs is for candidate accounts"
        type="button"
      >
        <Heart aria-hidden="true" className="size-[17px] stroke-current" />
        <span>Save</span>
      </button>
    );
  }

  const tooltipText = isSaved
    ? "Click to remove from saved jobs"
    : isPending
      ? "Saving…"
      : "Save job";

  const ariaLabel = isSaved
    ? `Saved. Remove ${jobTitle ?? "job"} from saved jobs`
    : `Save ${jobTitle ?? "job"}`;

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
          <span>{isPending ? "Saving…" : isSaved ? "Saved" : "Save"}</span>
        </button>
      ) : (
        <button
          aria-label={ariaLabel}
          aria-pressed={isSaved}
          className={cn(
            "inline-flex size-9 select-none items-center justify-center rounded-full border transition-colors",
            isSaved
              ? "border-mkt-accent-border bg-mkt-accent-soft text-mkt-brand hover:bg-mkt-accent-soft/80"
              : "border-transparent text-mkt-muted hover:border-mkt-line hover:bg-white hover:text-mkt-ink",
            isPending && "cursor-wait opacity-80",
            className,
          )}
          disabled={isPending}
          onClick={handleClick}
          title={tooltipText}
          type="button"
        >
          {isPending ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin text-mkt-muted" />
          ) : isSaved ? (
            <Heart aria-hidden="true" className="size-4 fill-mkt-brand stroke-mkt-brand" />
          ) : (
            <Heart aria-hidden="true" className="size-4 fill-none stroke-current" />
          )}
        </button>
      )}

      <SignInToSaveDialog onOpenChange={setSignInOpen} open={signInOpen} />
    </>
  );
}
