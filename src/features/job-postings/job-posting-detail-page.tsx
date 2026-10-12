import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router";

import { ActionConfirmDialog } from "@/components/common/action-confirm-dialog";
import { PageHeader } from "@/components/common/admin-page-header";
import { Breadcrumb } from "@/components/common/breadcrumb";
import { DetailRow } from "@/components/common/detail-row";
import { Field, FieldGrid } from "@/components/common/field-grid";
import { RailCard } from "@/components/common/rail-card";
import { SectionCard } from "@/components/common/section-card";
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

function TextSection({ text, title }: { text?: string; title: string }) {
  const { t } = useTranslation();
  return (
    <SectionCard title={title}>
      {text ? (
        <p className="m-0 whitespace-pre-wrap text-[13.5px] leading-relaxed text-foreground/80">
          {text}
        </p>
      ) : (
        <p className="m-0 text-[13.5px] text-muted-foreground">
          {t("jobPostings.detail.notProvided")}
        </p>
      )}
    </SectionCard>
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
  const orNotProvided = (value?: string) =>
    value || <span className="font-normal text-muted-foreground">{t("jobPostings.detail.notProvided")}</span>;

  return (
    <div className="space-y-5">
      <Breadcrumb
        ariaLabel={t("jobPostings.title")}
        items={[
          { label: t("jobPostings.title"), to: basePath },
          { label: jobDisplayId(posting.id), mono: true },
        ]}
      />

      <PageHeader
        actions={canManage ? (
          <>
            {posting.status !== "archived" ? (
              <Button asChild shape="xl" size="xl" variant="outline">
                <Link to={`${basePath}/${posting.id}/edit`}>
                  <Pencil className="size-4 text-muted-foreground" />
                  {t("jobPostings.table.edit")}
                </Link>
              </Button>
            ) : null}
            <Button onClick={() => setConfirmingDelete(true)} shape="xl" size="xl" type="button" variant="destructive-solid">
              <Trash2 className="size-4" />
              {t("jobPostings.table.delete")}
            </Button>
          </>
        ) : null}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <JobPostingStatusBadge posting={posting} />
            <span className="line-clamp-1">{[posting.enterprise.name, posting.location, posting.employmentType].filter(Boolean).join(" · ")}</span>
          </span>
        }
        title={posting.title}
      />

      <div className="grid items-start gap-[18px] lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex flex-col gap-[18px]">
          <SectionCard title={t("jobPostings.detail.overview")}>
            <FieldGrid>
              <Field label={t("jobPostings.detail.location")}>{orNotProvided(posting.location)}</Field>
              <Field label={t("jobPostings.detail.type")}>{orNotProvided(posting.employmentType)}</Field>
              <Field label={t("jobPostings.detail.level")}>{orNotProvided(posting.level)}</Field>
              <Field label={t("jobPostings.detail.salary")}>{orNotProvided(formatSalary(posting) === "—" ? undefined : formatSalary(posting))}</Field>
              <Field label={t("jobPostings.detail.openings")}>{orNotProvided(posting.openings?.toString())}</Field>
              <Field label={t("jobPostings.detail.deadline")}>{orNotProvided(posting.expiresAt ? formatDeadline(posting.expiresAt) : undefined)}</Field>
            </FieldGrid>
          </SectionCard>
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
