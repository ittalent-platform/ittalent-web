import { useState } from "react";
import { CircleCheck } from "lucide-react";
import { Link } from "react-router";
import { useMutation } from "@tanstack/react-query";

import { postApiV1MeApplications } from "@/api/generated";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { APPLICATIONS_PATH } from "@/config/routes";

import { ApplyDocumentPicker } from "./apply-document-picker";

type ApplyButtonProps = {
  companyName?: string;
  deadline?: string;
  jobId: string;
  jobTitle?: string;
};

const primaryBtn =
  "flex h-[46px] w-full items-center justify-center rounded-full bg-mkt-accent text-[14.5px] font-semibold text-white hover:bg-mkt-accent-hover disabled:cursor-not-allowed disabled:opacity-60";

function errorMessage(status: number | undefined, error: unknown) {
  const raw = JSON.stringify(error ?? {});
  switch (status) {
    case 400:
      return "Your application is invalid. Please re-select your CV and try again.";
    case 401:
      return "Your session has expired. Please sign in again.";
    case 403:
      return "Only applicant accounts with a verified email can apply.";
    case 404:
      return "This job is no longer available.";
    case 409:
      if (raw.includes("ALREADY_APPLIED"))
        return "You have already applied to this job.";
      if (raw.includes("POSITION_FILLED"))
        return "This position has been filled.";
      return "You can't apply to this job again.";
    default:
      return "Something went wrong. Please try again.";
  }
}

const MESSAGE_MAX = 1000;

export function ApplyButton({ companyName, deadline, jobId, jobTitle }: ApplyButtonProps) {
  const [open, setOpen] = useState(false);
  const [cvId, setCvId] = useState("");
  const [coverLetterId, setCoverLetterId] = useState("");
  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const [now] = useState(() => Date.now());
  const expired = deadline ? new Date(deadline).getTime() < now : false;

  const apply = useMutation({
    mutationFn: async () => {
      const result = await postApiV1MeApplications({
        body: {
          jobPostingId: jobId,
          cvId,
          ...(coverLetterId ? { coverLetterId } : {}),
          ...(message.trim() ? { message: message.trim() } : {}),
        },
      });
      if (result.error || !result.data) {
        throw Object.assign(new Error("apply-failed"), {
          status: result.response?.status,
          detail: result.error,
        });
      }
      return result.data;
    },
    onSuccess: () => setOpen(false),
    onError: (err: Error & { status?: number; detail?: unknown }) =>
      setFormError(errorMessage(err.status, err.detail)),
  });

  if (apply.isSuccess) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl bg-mkt-green-bg p-4 text-center text-[13.5px] text-mkt-green-fg">
        <CircleCheck aria-hidden="true" className="size-6" />
        <span className="font-semibold">Application submitted</span>
        <Link className="font-semibold underline" to={APPLICATIONS_PATH}>
          View my applications
        </Link>
      </div>
    );
  }

  return (
    <>
      <button
        className={primaryBtn}
        disabled={expired}
        onClick={() => setOpen(true)}
        type="button"
      >
        {expired ? "Applications closed" : "Apply now"}
      </button>
      <Dialog onOpenChange={(next) => !apply.isPending && setOpen(next)} open={open}>
        <DialogContent className="max-w-[520px] rounded-2xl border border-mkt-line bg-white p-0 font-['Instrument_Sans',system-ui,sans-serif] text-mkt-ink">
          <DialogHeader className="flex flex-col gap-1 border-0 p-6 pb-2 pr-14 text-left">
            <DialogTitle className="font-['Space_Grotesk',sans-serif] text-xl font-semibold">
              {jobTitle ? `Apply for ${jobTitle}` : "Apply for this job"}
            </DialogTitle>
            <DialogDescription className="text-[13.5px] text-mkt-muted">
              {companyName ? `${companyName} · ` : ""}Choose the documents to send with your application.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-5 px-6 py-4">
            <ApplyDocumentPicker
              emptyText="You have no CV uploaded yet. Upload one to apply."
              hint="Required"
              kind="cv"
              legend="YOUR CV"
              onChange={(id) => {
                setCvId(id);
                setFormError(null);
              }}
              onError={setFormError}
              uploadLabel="Upload a new CV"
              value={cvId}
            />
            <ApplyDocumentPicker
              emptyText=""
              hint="Optional"
              kind="cover_letter"
              legend="COVER LETTER"
              noneLabel="No cover letter"
              onChange={setCoverLetterId}
              onError={setFormError}
              uploadLabel="Upload a cover letter"
              value={coverLetterId}
            />
            <label className="flex flex-col gap-1.5 text-[12.5px] text-mkt-muted">
              Message (optional)
              <textarea
                className="min-h-[88px] resize-y rounded-xl border border-mkt-line p-3 text-[13.5px] text-mkt-ink outline-none focus:border-mkt-accent"
                maxLength={MESSAGE_MAX}
                onChange={(e) => setMessage(e.target.value)}
                value={message}
              />
              <span className="self-end">{message.length} / {MESSAGE_MAX}</span>
            </label>
            {formError ? (
              <p className="m-0 text-[13px] text-mkt-danger" role="alert">
                {formError}
              </p>
            ) : null}
          </div>

          <DialogFooter className="flex-row justify-end gap-2 border-t border-mkt-line p-4 px-6">
            <button
              className="h-11 rounded-full px-5 text-[13.5px] font-semibold text-mkt-ink-2 hover:text-mkt-ink"
              disabled={apply.isPending}
              onClick={() => setOpen(false)}
              type="button"
            >
              Cancel
            </button>
            <button
              className="h-11 rounded-full bg-mkt-accent px-6 text-[14px] font-semibold text-white hover:bg-mkt-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!cvId || apply.isPending}
              onClick={() => {
                setFormError(null);
                apply.mutate();
              }}
              type="button"
            >
              {apply.isPending ? "Submitting…" : "Submit application"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
