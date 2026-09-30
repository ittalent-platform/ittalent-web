import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";

import type {
  CreateJobPostingRequest,
  JobPosting,
  UpdateJobPostingRequest,
} from "@/api/generated/types.gen";
import { AdminPageHeader } from "@/components/common/admin-page-header";
import { Breadcrumb } from "@/components/common/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/toast/toast-provider";

import { JobPostingErrorState } from "./job-posting-error-state";
import { jobPostingErrorMessage } from "./job-posting-errors";
import { JobPostingForm } from "./job-posting-form";
import { JOB_POSTINGS_PATH } from "./job-postings.constants";
import { jobDisplayId } from "./job-postings.format";
import {
  createJobPosting,
  jobPostingKeys,
  updateJobPosting,
  useJobPosting,
} from "./job-postings.queries";

type EditorPayload =
  | { kind: "create"; payload: CreateJobPostingRequest }
  | { kind: "update"; payload: UpdateJobPostingRequest };

function JobPostingEditor({ posting }: { posting?: JobPosting }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const client = useQueryClient();
  const { showToast } = useToast();
  const mutation = useMutation({
    mutationFn: (input: EditorPayload) =>
      input.kind === "create"
        ? createJobPosting(input.payload)
        : updateJobPosting(posting?.id ?? "", input.payload),
    onError: (error) =>
      showToast({
        title: t("jobPostings.save.failedTitle"),
        message: jobPostingErrorMessage(error, t),
        tone: "error",
      }),
    onSuccess: async () => {
      await client.invalidateQueries({
        queryKey: jobPostingKeys.root("recruiter"),
      });
      if (posting)
        await client.invalidateQueries({
          queryKey: jobPostingKeys.detail(posting.id),
        });
      showToast({
        title: t(
          posting
            ? "jobPostings.save.updatedTitle"
            : "jobPostings.save.createdTitle",
        ),
        message: t("jobPostings.save.message"),
        tone: "success",
      });
      navigate(JOB_POSTINGS_PATH);
    },
  });
  return (
    <JobPostingForm
      isSaving={mutation.isPending}
      onCreate={(payload) => mutation.mutate({ kind: "create", payload })}
      onUpdate={(payload) => mutation.mutate({ kind: "update", payload })}
      posting={posting}
    />
  );
}

export function JobPostingCreatePage() {
  const { t } = useTranslation();
  return (
    <div className="space-y-5">
      <Breadcrumb
        ariaLabel={t("jobPostings.title")}
        items={[
          { label: t("jobPostings.title"), to: JOB_POSTINGS_PATH },
          { label: t("jobPostings.createTitle") },
        ]}
      />
      <AdminPageHeader
        description={t("jobPostings.form.createDescription")}
        title={t("jobPostings.createTitle")}
      />
      <JobPostingEditor />
    </div>
  );
}

export function JobPostingEditPage() {
  const { t } = useTranslation();
  const { jobPostingId } = useParams<{ jobPostingId: string }>();
  const query = useJobPosting(jobPostingId);
  if (query.isPending) {
    return (
      <div aria-busy="true" className="space-y-5">
        <Skeleton className="h-5 w-48 rounded" />
        <Skeleton className="h-10 w-80 rounded" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }
  if (query.isError || !query.data)
    return (
      <JobPostingErrorState backTo={JOB_POSTINGS_PATH} error={query.error} />
    );
  return (
    <div className="space-y-5">
      <Breadcrumb
        ariaLabel={t("jobPostings.title")}
        items={[
          { label: t("jobPostings.title"), to: JOB_POSTINGS_PATH },
          {
            label: jobDisplayId(query.data.id),
            mono: true,
            to: `${JOB_POSTINGS_PATH}/${query.data.id}`,
          },
          { label: t("jobPostings.editTitle") },
        ]}
      />
      <AdminPageHeader
        description={t("jobPostings.form.editDescription")}
        title={t("jobPostings.editTitle")}
      />
      <JobPostingEditor posting={query.data} />
    </div>
  );
}
