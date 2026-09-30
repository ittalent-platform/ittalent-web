import { useState } from "react";
import { CircleCheck, FileText } from "lucide-react";
import { Link } from "react-router";
import { useMutation, useQuery } from "@tanstack/react-query";

import { getApiV1Documents, postApiV1MeApplications } from "@/api/generated";
import { APPLICATIONS_PATH } from "@/config/routes";

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

export function ApplyButton({ deadline, jobId, jobTitle }: ApplyButtonProps) {
  const [open, setOpen] = useState(false);
  const [cvId, setCvId] = useState("");
  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const expired = deadline ? new Date(deadline).getTime() < Date.now() : false;

  const cvs = useQuery({
    queryKey: ["my-documents", "cv"],
    enabled: open,
    queryFn: async () => {
      const result = await getApiV1Documents({
        query: { type: "cv", limit: 100, page: 1 },
      });
      if (result.error || !result.data) throw new Error("load-cvs-failed");
      return result.data.items;
    },
  });

  const apply = useMutation({
    mutationFn: async () => {
      const result = await postApiV1MeApplications({
        body: {
          jobPostingId: jobId,
          cvId,
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

  if (!open) {
    return (
      <button
        className={primaryBtn}
        disabled={expired}
        onClick={() => setOpen(true)}
        type="button"
      >
        {expired ? "Applications closed" : "Apply now"}
      </button>
    );
  }

  const cvList = cvs.data ?? [];

  return (
    <div className="flex flex-col gap-3">
      <span className="text-[13.5px] font-semibold">
        {jobTitle ? `Apply for ${jobTitle}` : "Apply for this job"}
      </span>

      <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
        <legend className="pb-1 text-[11.5px] font-bold tracking-[0.05em] text-mkt-label">
          CHOOSE YOUR CV
        </legend>
        {cvs.isLoading ? (
          <div className="h-10 animate-pulse rounded-xl bg-mkt-chip" />
        ) : cvs.isError ? (
          <p className="m-0 text-[13px] text-mkt-danger">
            Couldn't load your CVs.{" "}
            <button
              className="font-semibold underline"
              onClick={() => cvs.refetch()}
              type="button"
            >
              Retry
            </button>
          </p>
        ) : cvList.length === 0 ? (
          <p className="m-0 text-[13px] text-mkt-muted">
            You have no CV uploaded yet. Upload a CV first, then apply.
          </p>
        ) : (
          cvList.map((doc) => (
            <label
              className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-mkt-line px-3 py-2.5 text-[13.5px] has-[:checked]:border-mkt-accent"
              key={doc.id}
            >
              <input
                checked={cvId === doc.id}
                name="cv"
                onChange={() => {
                  setCvId(doc.id);
                  setFormError(null);
                }}
                type="radio"
              />
              <FileText aria-hidden="true" className="size-4 shrink-0" />
              <span className="min-w-0 truncate">{doc.fileName}</span>
            </label>
          ))
        )}
      </fieldset>

      <label className="flex flex-col gap-1.5 text-[12.5px] text-mkt-muted">
        Message (optional)
        <textarea
          className="min-h-[88px] resize-y rounded-xl border border-mkt-line p-3 text-[13.5px] text-mkt-ink outline-none focus:border-mkt-accent"
          maxLength={1000}
          onChange={(e) => setMessage(e.target.value)}
          value={message}
        />
        <span className="self-end">{message.length} / 1000</span>
      </label>

      {formError ? (
        <p className="m-0 text-[13px] text-mkt-danger" role="alert">
          {formError}
        </p>
      ) : null}

      <button
        className={primaryBtn}
        disabled={!cvId || apply.isPending}
        onClick={() => {
          setFormError(null);
          apply.mutate();
        }}
        type="button"
      >
        {apply.isPending ? "Submitting…" : "Submit application"}
      </button>
      <button
        className="h-10 text-[13.5px] font-semibold text-mkt-ink-2 hover:text-mkt-ink"
        onClick={() => setOpen(false)}
        type="button"
      >
        Cancel
      </button>
    </div>
  );
}