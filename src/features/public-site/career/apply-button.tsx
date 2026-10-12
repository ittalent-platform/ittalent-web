import { useState } from "react";
import { CircleCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
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

import { useCertificatesQuery } from "@/features/certificates/certificates.queries";
import { ApplyCertificatePicker } from "./apply-certificate-picker";
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

// shortcut: the picker shows the first 100 certificates only, page through them if candidates ever keep more.
const CERTIFICATE_PICKER_PARAMS = { limit: 100, page: 1 } as const;

export function ApplyButton({ companyName, deadline, jobId, jobTitle }: ApplyButtonProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [cvId, setCvId] = useState("");
  const [coverLetterId, setCoverLetterId] = useState("");
  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const certificates = useCertificatesQuery(CERTIFICATE_PICKER_PARAMS, open);
  const certificateItems = certificates.data?.items ?? [];
  // null until the candidate changes the ticks: suggested certificates start ticked. Ids no longer listed drop out.
  const [tickedIds, setTickedIds] = useState<string[] | null>(null);
  const certificateLinkIds = (tickedIds ?? certificateItems.filter((item) => item.suggested).map((item) => item.id))
    .filter((id) => certificateItems.some((item) => item.id === id));

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
          ...(certificateLinkIds.length ? { certificateLinkIds } : {}),
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
    onError: (err: Error & { status?: number; detail?: unknown }) => {
      if (err.status === 409 && JSON.stringify(err.detail ?? {}).includes("CERTIFICATE_UNAVAILABLE")) {
        setFormError(t("applications.applyCertificates.unavailable"));
        void certificates.refetch();
        return;
      }
      setFormError(errorMessage(err.status, err.detail));
    },
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
        <DialogContent className="flex max-h-[92vh] max-w-[560px] flex-col market-card p-0 font-sans text-mkt-ink">
          <DialogHeader className="flex flex-col gap-1 border-0 p-6 pb-2 pr-14 text-left">
            <DialogTitle className="itt-display text-xl font-semibold">
              {jobTitle ? `Apply for ${jobTitle}` : "Apply for this job"}
            </DialogTitle>
            <DialogDescription className="text-[13.5px] text-mkt-muted">
              {companyName ? `${companyName} · ` : ""}Choose the documents to send with your application.
            </DialogDescription>
          </DialogHeader>

          <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 py-4">
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
            {certificateItems.length ? (
              <ApplyCertificatePicker
                certificates={certificateItems}
                onChange={(ids) => {
                  setTickedIds(ids);
                  setFormError(null);
                }}
                value={certificateLinkIds}
              />
            ) : null}
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

          <DialogFooter className="flex-row items-center justify-end gap-2 border-t border-mkt-line p-4 px-6">
            {certificateItems.length ? <p className="m-0 mr-auto min-w-0 text-[12px] leading-snug text-mkt-muted">{t("applications.applyCertificates.copyNote")}</p> : null}
            <button
              className="h-11 shrink-0 rounded-full px-5 text-[13.5px] font-semibold text-mkt-ink-2 hover:text-mkt-ink"
              disabled={apply.isPending}
              onClick={() => setOpen(false)}
              type="button"
            >
              Cancel
            </button>
            <button
              className="h-11 shrink-0 whitespace-nowrap rounded-full bg-mkt-accent px-6 text-[14px] font-semibold text-white hover:bg-mkt-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
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
