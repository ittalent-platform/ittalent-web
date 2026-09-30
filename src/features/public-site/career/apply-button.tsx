import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Info } from "lucide-react";
import { Link } from "react-router";

import { postApiV1AuthResendVerificationEmail } from "@/api/generated";
import { useToast } from "@/components/toast/toast-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/auth/use-session";
import { getErrorCode } from "@/lib/api-errors";
import { applicationDisplayId } from "@/lib/display-id";
import { formatDate } from "@/lib/format";

import {
  applyToJob,
  fetchMyApplication,
  fetchMyDocuments,
  type ApplicationDto,
} from "./apply.api";

const MESSAGE_MAX_LENGTH = 1000;
const NO_COVER_LETTER = "__none__";
const UNVERIFIED_STATUS = "inactive";
// Employer-side accounts cannot apply; only candidate accounts (role "user") can.
const EMPLOYER_ROLES = ["admin", "recruiter", "interviewer"];
// Mirrors the backend (BR-6): only these statuses may apply to the same job again.
const REAPPLY_STATUSES = ["withdrawn", "rejected"];
const MY_APPLICATION_KEY = "my-application";
const CV_LIST_KEY = ["applicant-documents", "cv"] as const;

const STATUS_LABELS: Record<string, string> = {
  hired: "Hired",
  interviewing: "Interviewing",
  offered: "Offered",
  rejected: "Rejected",
  submitted: "Submitted",
  under_review: "Under Review",
  withdrawn: "Withdrawn",
};

const primaryButtonClass =
  "flex h-[46px] w-full items-center justify-center rounded-full bg-mkt-accent text-[14.5px] font-semibold text-white hover:bg-mkt-accent-hover disabled:opacity-60";
const outlineButtonClass =
  "flex h-[46px] w-full items-center justify-center rounded-full border border-mkt-line-strong bg-white text-[14.5px] font-semibold text-mkt-ink hover:bg-mkt-chip disabled:opacity-60";

// Error codes returned by POST /api/v1/applications.
const APPLY_ERROR_MESSAGES: Record<string, { title: string; message: string }> =
  {
    ACCOUNT_NOT_ACTIVE: {
      title: "Account unavailable",
      message: "Your account is not allowed to apply for jobs.",
    },
    ALREADY_APPLIED: {
      title: "Already applied",
      message: "You've already applied to this position.",
    },
    APPLICANT_PROFILE_NOT_FOUND: {
      title: "Profile required",
      message: "Please complete your applicant profile before applying.",
    },
    EMAIL_NOT_VERIFIED: {
      title: "Email not verified",
      message: "Verify your email before applying for this role.",
    },
    INVALID_COVER_LETTER: {
      title: "Cover letter unavailable",
      message: "The selected cover letter is not available.",
    },
    INVALID_CV: {
      title: "CV unavailable",
      message: "The selected CV is not available.",
    },
    JOB_UNAVAILABLE: {
      title: "Job unavailable",
      message: "This job is no longer accepting applications.",
    },
    POSITION_FILLED: {
      title: "Position filled",
      message: "This position has been filled.",
    },
  };

type ApplyButtonProps = {
  companyName?: string;
  deadline?: string;
  jobTitle?: string;
  /** The job posting id (the career page route param). */
  slug: string;
};

function ApplyDialog({
  companyName,
  deadline,
  jobPostingId,
  jobTitle,
  onApplied,
  onOpenChange,
  open,
}: {
  companyName?: string;
  deadline?: string;
  jobPostingId: string;
  jobTitle?: string;
  onApplied: (application?: ApplicationDto) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const { showToast } = useToast();
  const { data: session } = useSession();
  const [cvId, setCvId] = useState("");
  const [coverLetterId, setCoverLetterId] = useState("");
  const [message, setMessage] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const cvQuery = useQuery({
    enabled: open,
    queryFn: () => fetchMyDocuments("cv"),
    queryKey: [...CV_LIST_KEY],
  });
  const coverLetterQuery = useQuery({
    enabled: open,
    queryFn: () => fetchMyDocuments("cover_letter"),
    queryKey: ["applicant-documents", "cover_letter"],
  });

  const cvItems = cvQuery.data ?? [];
  // The newest CV is pre-selected, matching what the eligible card says "will be sent".
  const selectedCvId = cvId || cvItems[0]?.id || "";

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setCvId("");
      setCoverLetterId("");
      setMessage("");
      setValidationError(null);
    }
    onOpenChange(nextOpen);
  }

  const applyMutation = useMutation({
    mutationFn: () =>
      applyToJob({
        jobPostingId,
        cvId: selectedCvId,
        ...(coverLetterId ? { coverLetterId } : {}),
        ...(message.trim() ? { message: message.trim() } : {}),
      }),
    onError: (error: unknown) => {
      const code = getErrorCode(error);
      const known = code ? APPLY_ERROR_MESSAGES[code] : undefined;

      if (code === "INVALID_CV") {
        setValidationError(known?.message ?? "Please select a CV.");
        return;
      }
      if (code === "ALREADY_APPLIED") {
        onApplied();
        handleOpenChange(false);
      }

      showToast({
        message:
          known?.message ??
          (error as { message?: string }).message ??
          "Unable to submit your application right now.",
        title: known?.title ?? "Application failed",
        tone: code === "ALREADY_APPLIED" ? "warning" : "error",
      });
    },
    onSuccess: (application) => {
      showToast({
        message: session?.user.email
          ? `Your application has been submitted. A confirmation email will be sent to ${session.user.email}.`
          : "Your application has been submitted. A confirmation email is on its way.",
        title: "Application submitted",
        tone: "success",
      });
      onApplied(application);
      handleOpenChange(false);
    },
  });

  function handleSubmit() {
    setValidationError(null);
    if (!selectedCvId) {
      setValidationError("Please select a CV.");
      return;
    }
    applyMutation.mutate();
  }

  const coverLetterItems = coverLetterQuery.data ?? [];
  const isLoading = cvQuery.isLoading || coverLetterQuery.isLoading;
  const formattedDeadline = deadline
    ? formatDate(deadline, { emptyFallback: "" })
    : "";

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Apply{jobTitle ? ` — ${jobTitle}` : ""}</DialogTitle>
          <DialogDescription>
            {companyName || formattedDeadline
              ? [
                  companyName,
                  formattedDeadline ? `Apply by ${formattedDeadline}` : "",
                ]
                  .filter(Boolean)
                  .join(" · ")
              : "Select a CV and, optionally, a cover letter to submit with your application."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 px-[26px] py-5">
          {isLoading ? (
            <div className="flex flex-col gap-2" data-testid="apply-loading">
              <div className="h-11 animate-pulse rounded-[10px] bg-muted" />
              <div className="h-11 animate-pulse rounded-[10px] bg-muted" />
            </div>
          ) : cvQuery.isError ? (
            <p className="text-[13px] font-medium text-destructive">
              Could not load your documents. Please try again.
            </p>
          ) : cvItems.length === 0 ? (
            <div className="rounded-[10px] border border-dashed px-4 py-8 text-center">
              <p className="text-[13.5px] font-medium text-muted-foreground">
                You don&rsquo;t have a CV uploaded yet.
              </p>
              <p className="mt-1 text-[12.5px] text-muted-foreground">
                Upload a CV to your documents, then come back to apply.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <span className="text-[13px] font-semibold">
                CV <span className="text-destructive">*</span>
              </span>
              <Select
                onValueChange={(value) => {
                  setCvId(value);
                  setValidationError(null);
                }}
                value={selectedCvId || undefined}
              >
                <SelectTrigger aria-label="CV">
                  <SelectValue placeholder="Select a CV" />
                </SelectTrigger>
                <SelectContent>
                  {cvItems.map((document) => (
                    <SelectItem key={document.id} value={document.id}>
                      {document.fileName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {!isLoading && coverLetterItems.length > 0 ? (
            <div className="flex flex-col gap-2">
              <span className="text-[13px] font-semibold">
                Cover letter (optional)
              </span>
              <Select
                onValueChange={(value) =>
                  setCoverLetterId(value === NO_COVER_LETTER ? "" : value)
                }
                value={coverLetterId || NO_COVER_LETTER}
              >
                <SelectTrigger aria-label="Cover letter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_COVER_LETTER}>None</SelectItem>
                  {coverLetterItems.map((document) => (
                    <SelectItem key={document.id} value={document.id}>
                      {document.fileName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            <label
              className="text-[13px] font-semibold"
              htmlFor="apply-message"
            >
              Message to employer (optional)
            </label>
            <Textarea
              id="apply-message"
              maxLength={MESSAGE_MAX_LENGTH}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Add a short note for the hiring team..."
              rows={4}
              value={message}
            />
            <span className="self-end text-[11.5px] text-muted-foreground">
              {message.length.toLocaleString()} /{" "}
              {MESSAGE_MAX_LENGTH.toLocaleString()}
            </span>
          </div>

          {validationError ? (
            <p className="text-[12.5px] font-medium text-destructive">
              {validationError}
            </p>
          ) : null}
        </div>

        <DialogFooter className="bg-muted/40">
          <Button
            onClick={() => handleOpenChange(false)}
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            disabled={
              applyMutation.isPending || isLoading || cvItems.length === 0
            }
            onClick={handleSubmit}
            type="button"
          >
            {applyMutation.isPending ? "Submitting..." : "Submit application"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ActionSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="h-[46px] w-full animate-pulse rounded-full bg-mkt-chip"
      data-testid="apply-skeleton"
    />
  );
}

function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  return `${local.slice(0, 2)}***@${domain}`;
}

function GuestActions({ slug }: { slug: string }) {
  const loginHref = `/login?redirect=${encodeURIComponent(`/career/${slug}`)}`;

  return (
    <>
      <Link className={primaryButtonClass} to={loginHref}>
        Sign in to apply
      </Link>
      <Link className={outlineButtonClass} to="/register">
        Create an account
      </Link>
      <p className="m-0 text-center text-[12.5px] leading-normal text-mkt-muted">
        You&rsquo;ll come back to this job after signing in.
      </p>
    </>
  );
}

function EligibleActions({
  companyName,
  deadline,
  jobTitle,
  slug,
}: {
  companyName?: string;
  deadline?: string;
  jobTitle?: string;
  slug: string;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  // Same query key as the dialog, so the list is fetched once and shared.
  const cvQuery = useQuery({
    queryFn: () => fetchMyDocuments("cv"),
    queryKey: [...CV_LIST_KEY],
    staleTime: 30_000,
  });
  const latestCv = cvQuery.data?.[0];

  function handleApplied(application?: ApplicationDto) {
    if (application) {
      queryClient.setQueryData([MY_APPLICATION_KEY, slug], application);
    } else {
      void queryClient.invalidateQueries({
        queryKey: [MY_APPLICATION_KEY, slug],
      });
    }
  }

  return (
    <>
      <ApplyDialog
        companyName={companyName}
        deadline={deadline}
        jobPostingId={slug}
        jobTitle={jobTitle}
        onApplied={handleApplied}
        onOpenChange={setOpen}
        open={open}
      />
      <button
        className={primaryButtonClass}
        onClick={() => setOpen(true)}
        type="button"
      >
        Apply now
      </button>
      {latestCv ? (
        <div className="flex items-center gap-2.5 rounded-xl border border-mkt-line-soft bg-mkt-canvas px-3 py-2.5">
          <span className="rounded-md bg-mkt-danger-bg px-1.5 py-1 text-[11px] font-bold leading-none text-mkt-danger">
            CV
          </span>
          <span className="min-w-0 text-[13px] leading-snug text-mkt-ink-2">
            <span className="break-words">{latestCv.fileName}</span> will be
            sent
          </span>
        </div>
      ) : null}
    </>
  );
}

function statusBadgeClass(status: string) {
  if (status === "hired" || status === "offered")
    return "bg-mkt-green-bg text-mkt-green-fg";
  if (status === "rejected" || status === "withdrawn")
    return "bg-mkt-chip text-mkt-muted";
  return "bg-mkt-blue-bg text-mkt-blue-fg";
}

function AppliedActions({ application }: { application: ApplicationDto }) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const statusLabel = STATUS_LABELS[application.status] ?? application.status;
  const displayId = applicationDisplayId(application.id);

  return (
    <>
      <div className="flex items-center gap-2.5">
        <span
          className={`rounded-full px-2.5 py-1 text-[12.5px] font-semibold ${statusBadgeClass(application.status)}`}
        >
          {statusLabel}
        </span>
        <span className="font-mono text-[12px] font-semibold text-mkt-ink-2">
          {displayId}
        </span>
      </div>
      <p className="m-0 text-[13.5px] leading-normal text-mkt-ink-2">
        You applied on {formatDate(application.createdAt)}. Each job accepts one
        application per candidate.
      </p>
      <button
        className={outlineButtonClass}
        onClick={() => setDetailsOpen(true)}
        type="button"
      >
        View application
      </button>

      <Dialog onOpenChange={setDetailsOpen} open={detailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Your application</DialogTitle>
            <DialogDescription>
              {displayId} · {statusLabel}
            </DialogDescription>
          </DialogHeader>
          <dl className="m-0 flex flex-col gap-4 px-[26px] py-5 text-[13.5px]">
            <div className="flex flex-col gap-0.5">
              <dt className="text-[12px] text-muted-foreground">Submitted</dt>
              <dd className="m-0 font-medium">
                {formatDate(application.createdAt)}
              </dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-[12px] text-muted-foreground">
                Last updated
              </dt>
              <dd className="m-0 font-medium">
                {formatDate(application.updatedAt)}
              </dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-[12px] text-muted-foreground">
                Message to employer
              </dt>
              <dd className="m-0 whitespace-pre-wrap break-words font-medium">
                {application.message || "—"}
              </dd>
            </div>
          </dl>
          <DialogFooter className="bg-muted/40">
            <Button
              onClick={() => setDetailsOpen(false)}
              type="button"
              variant="outline"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function UnverifiedActions({ email }: { email: string }) {
  const { showToast } = useToast();

  const resendMutation = useMutation({
    mutationFn: async () => {
      const result = await postApiV1AuthResendVerificationEmail({
        body: { email },
      });
      if (result.error) throw result.error;
    },
    onError: (error: unknown) => {
      showToast({
        message:
          (error as { message?: string })?.message ??
          "Unable to resend the email right now.",
        title: "Could not resend email",
        tone: "error",
      });
    },
    onSuccess: () => {
      showToast({
        message: `We sent a new verification link to ${maskEmail(email)}.`,
        title: "Verification email sent",
        tone: "success",
      });
    },
  });

  return (
    <>
      <div className="flex flex-col gap-1 rounded-xl border border-mkt-amber-border bg-mkt-amber-bg px-3.5 py-3">
        <span className="text-[14px] font-semibold text-mkt-amber-fg">
          Verify your email to apply
        </span>
        <span className="text-[13px] leading-snug text-mkt-amber-fg">
          We sent a link to {maskEmail(email)}.
        </span>
      </div>
      <button
        className={outlineButtonClass}
        disabled={resendMutation.isPending}
        onClick={() => resendMutation.mutate()}
        type="button"
      >
        {resendMutation.isPending ? "Sending..." : "Resend email"}
      </button>
    </>
  );
}

function EmployerNotice({ role }: { role: string }) {
  const isAdmin = role === "admin";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <Info
          aria-hidden="true"
          className="mt-0.5 size-5 shrink-0 text-mkt-blue-fg"
        />
        <p className="m-0 text-[14px] leading-normal text-mkt-ink-2">
          You&rsquo;re signed in as {isAdmin ? "an admin" : "an employer"}.
          Switch to a candidate account to apply.
        </p>
      </div>
      <Link
        className="text-[13.5px] font-semibold text-mkt-accent-hover hover:underline"
        to={isAdmin ? "/admin" : "/enterprises"}
      >
        {isAdmin ? "Go to the admin console" : "Go to your company workspace"}{" "}
        &rarr;
      </Link>
    </div>
  );
}

/**
 * Apply action area of the job detail page. Renders one of five states:
 * guest, candidate (eligible), candidate (already applied), candidate (email not verified),
 * employer/admin session.
 */
export function ApplyButton({
  companyName,
  deadline,
  jobTitle,
  slug,
}: ApplyButtonProps) {
  const { data: session, isPending } = useSession();

  const role = session?.user.role ?? "";
  const isEmployer = EMPLOYER_ROLES.includes(role);
  const isUnverified = session?.user.status === UNVERIFIED_STATUS;
  const canLookupApplication = Boolean(session) && !isEmployer && !isUnverified;

  const applicationQuery = useQuery({
    enabled: canLookupApplication,
    queryFn: () => fetchMyApplication(slug),
    queryKey: [MY_APPLICATION_KEY, slug],
    retry: false,
    staleTime: 30_000,
  });

  let content;
  if (isPending) {
    content = <ActionSkeleton />;
  } else if (!session) {
    content = <GuestActions slug={slug} />;
  } else if (isEmployer) {
    content = <EmployerNotice role={role} />;
  } else if (isUnverified) {
    content = <UnverifiedActions email={session.user.email} />;
  } else if (applicationQuery.isPending) {
    content = <ActionSkeleton />;
  } else if (
    applicationQuery.data &&
    !REAPPLY_STATUSES.includes(applicationQuery.data.status)
  ) {
    content = <AppliedActions application={applicationQuery.data} />;
  } else {
    // No application yet, or a Withdrawn/Rejected one that may be re-submitted.
    content = (
      <EligibleActions
        companyName={companyName}
        deadline={deadline}
        jobTitle={jobTitle}
        slug={slug}
      />
    );
  }

  return <div className="flex flex-col gap-2.5">{content}</div>;
}
