import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router";

import { ActionConfirmDialog } from "@/components/common/action-confirm-dialog";
import { Breadcrumb } from "@/components/common/breadcrumb";
import { DetailRow } from "@/components/common/detail-row";
import { RailCard } from "@/components/common/rail-card";
import { useToast } from "@/components/toast/toast-provider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { JobPostingErrorState } from "./job-posting-error-state";
import { jobPostingErrorMessage } from "./job-posting-errors";
import { JobPostingStatusBadge } from "./job-posting-status-badge";
import {
  deleteJobPosting,
  jobPostingKeys,
  useJobPosting,
} from "./job-postings.queries";
import {
  formatDeadline,
  formatPostedDate,
  formatSalary,
  jobDisplayId,
} from "./job-postings.format";

type Actor = "admin" | "recruiter";

const card =
  "flex flex-col gap-[18px] rounded-2xl border border-border bg-card p-[22px] pb-6";

function Field({ label, value }: { label: string; value?: ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <dt className="text-[13px] text-muted-foreground">{label}</dt>
      <dd className="m-0 wrap-anywhere text-[14.5px] font-semibold text-foreground">
        {value || (
          <span className="font-normal text-muted-foreground">
            {t("jobPostings.detail.notProvided")}
          </span>
        )}
      </dd>
    </div>
  );
}

function TextSection({ text, title }: { text?: string; title: string }) {
  const { t } = useTranslation();
  return (
    <section className={card}>
      <h2 className="text-[15px] font-bold text-foreground">{title}</h2>
      {text ? (
        <p className="m-0 whitespace-pre-wrap text-[13.5px] leading-relaxed text-foreground/80">
          {text}
        </p>
      ) : (
        <p className="m-0 text-[13.5px] text-muted-foreground">
          {t("jobPostings.detail.notProvided")}
        </p>
      )}
    </section>
  );
}

export function JobPostingDetailPage({ actor }: { actor: Actor }) {
  const { t } = useTranslation();
  const { jobPostingId } = useParams<{ jobPostingId: string }>();
  const navigate = useNavigate();
  const client = useQueryClient();
  const { showToast } = useToast();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const query = useJobPosting(jobPostingId);
  const basePath = `/${actor}/job-postings`;

  const deletion = useMutation({
    mutationFn: () => deleteJobPosting(jobPostingId ?? ""),
    onError: (error) =>
      showToast({
        title: t("jobPostings.delete.failedTitle"),
        message: jobPostingErrorMessage(error, t),
        tone: "error",
      }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: jobPostingKeys.root(actor) });
      showToast({
        title: t("jobPostings.delete.doneTitle"),
        message: t("jobPostings.delete.doneMessage", {
          title: query.data?.title,
        }),
        tone: "success",
      });
      navigate(basePath);
    },
  });

  if (query.isPending) {
    return (
      <div aria-busy="true" className="space-y-5">
        <Skeleton className="h-5 w-48 rounded" />
        <Skeleton className="h-14 w-96 rounded-2xl" />
        <div className="grid gap-[18px] lg:grid-cols-[minmax(0,1fr)_380px]">
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    );
  }
  if (query.isError || !query.data)
    return <JobPostingErrorState backTo={basePath} error={query.error} />;

  const posting = query.data;
  const canManage = actor === "recruiter";
  const applicationCount = posting.applicationCount ?? 0;

  return (
    <div className="space-y-5">
      <Breadcrumb
        ariaLabel={t("jobPostings.title")}
        items={[
          { label: t("jobPostings.title"), to: basePath },
          { label: jobDisplayId(posting.id), mono: true },
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="itt-display truncate text-2xl font-semibold leading-tight text-foreground">
                {posting.title}
              </h1>
              <JobPostingStatusBadge posting={posting} />
            </div>
            <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
              {[
                posting.enterprise.name,
                posting.location,
                posting.employmentType,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </div>
        {canManage ? (
          <div className="flex flex-wrap items-center gap-2.5">
            {posting.status !== "archived" ? (
              <Button
                asChild
                className="h-11 rounded-xl px-5 text-sm font-semibold"
                variant="outline"
              >
                <Link to={`${basePath}/${posting.id}/edit`}>
                  <Pencil className="size-4 text-muted-foreground" />
                  {t("jobPostings.table.edit")}
                </Link>
              </Button>
            ) : null}
            <Button
              className="h-11 rounded-xl bg-(--danger-fg) px-5 text-sm font-semibold text-white hover:bg-(--danger-fg)/90"
              onClick={() => setConfirmingDelete(true)}
              type="button"
            >
              <Trash2 className="size-4" />
              {t("jobPostings.table.delete")}
            </Button>
          </div>
        ) : null}
      </div>

      <div className="grid items-start gap-[18px] lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex flex-col gap-[18px]">
          <section className={card}>
            <h2 className="text-[15px] font-bold text-foreground">
              {t("jobPostings.detail.overview")}
            </h2>
            <dl className="m-0 grid gap-x-8 gap-y-5 sm:grid-cols-2">
              <Field
                label={t("jobPostings.detail.location")}
                value={posting.location}
              />
              <Field
                label={t("jobPostings.detail.type")}
                value={posting.employmentType}
              />
              <Field
                label={t("jobPostings.detail.level")}
                value={posting.level}
              />
              <Field
                label={t("jobPostings.detail.salary")}
                value={
                  formatSalary(posting) === "—"
                    ? undefined
                    : formatSalary(posting)
                }
              />
              <Field
                label={t("jobPostings.detail.openings")}
                value={posting.openings?.toString()}
              />
              <Field
                label={t("jobPostings.detail.deadline")}
                value={
                  posting.expiresAt
                    ? formatDeadline(posting.expiresAt)
                    : undefined
                }
              />
            </dl>
          </section>
          <TextSection
            text={posting.description}
            title={t("jobPostings.detail.description")}
          />
          <TextSection
            text={posting.requirements}
            title={t("jobPostings.detail.requirements")}
          />
          <TextSection
            text={posting.benefits}
            title={t("jobPostings.detail.benefits")}
          />
        </div>

        <div className="flex flex-col gap-[18px]">
          <RailCard title={t("jobPostings.detail.statusCard")}>
            <div>
              <JobPostingStatusBadge posting={posting} />
            </div>
            <p className="m-0 text-[12.5px] leading-relaxed text-muted-foreground">
              {t("jobPostings.detail.statusNote")}
            </p>
          </RailCard>
          <RailCard
            meta={String(applicationCount)}
            title={t("jobPostings.detail.applicationsCard")}
          >
            <p className="m-0 text-[13.5px] font-semibold text-foreground">
              {t("jobPostings.detail.applicationCount", {
                count: applicationCount,
              })}
            </p>
            <p className="m-0 text-[12.5px] leading-relaxed text-muted-foreground">
              {t("jobPostings.detail.applicationNote")}
            </p>
          </RailCard>
          <RailCard title={t("jobPostings.detail.recordCard")}>
            <dl className="m-0">
              <DetailRow
                label={t("jobPostings.detail.company")}
                value={posting.enterprise.name}
              />
              <DetailRow
                label={t("jobPostings.detail.created")}
                value={formatPostedDate(posting.createdAt)}
              />
              <DetailRow
                label={t("jobPostings.detail.updated")}
                value={formatPostedDate(posting.updatedAt)}
              />
            </dl>
          </RailCard>
        </div>
      </div>

      {canManage && confirmingDelete ? (
        <ActionConfirmDialog
          action={
            deletion.isPending
              ? t("jobPostings.delete.deleting")
              : t("jobPostings.delete.confirm")
          }
          description={t("jobPostings.delete.description")}
          disabled={deletion.isPending}
          icon={Trash2}
          onConfirm={() => deletion.mutate()}
          onOpenChange={(open) => !open && setConfirmingDelete(false)}
          open
          title={t("jobPostings.delete.title", { title: posting.title })}
          variant="destructive-solid"
        />
      ) : null}
    </div>
  );
}
