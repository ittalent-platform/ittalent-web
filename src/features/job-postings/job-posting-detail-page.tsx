import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  CirclePause,
  FilePenLine,
  Pencil,
  Play,
  RotateCcw,
  Send,
  Trash2,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router";

import { ActionConfirmDialog } from "@/components/common/action-confirm-dialog";
import { Breadcrumb } from "@/components/common/breadcrumb";
import { Callout } from "@/components/common/callout";
import { DetailRow } from "@/components/common/detail-row";
import { LogoTile } from "@/components/common/logo-tile";
import { RailCard } from "@/components/common/rail-card";
import { Timeline, type TimelineTone } from "@/components/common/timeline";
import { useToast } from "@/components/toast/toast-provider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { JobPostingErrorState } from "./job-posting-error-state";
import { jobPostingErrorMessage } from "./job-posting-errors";
import { JobPostingStatusBadge } from "./job-posting-status-badge";
import {
  deleteJobPosting,
  jobPostingKeys,
  moveJobPostingToDraft,
  publishJobPosting,
  transitionJobPosting,
  useJobPosting,
  useJobPostingHistory,
  type JobPostingTransition,
} from "./job-postings.queries";
import {
  formatDeadline,
  formatJobDateTime,
  formatPostedDate,
  formatSalary,
  jobDisplayId,
} from "./job-postings.format";

type Actor = "admin" | "recruiter";
type LifecycleAction = JobPostingTransition | "draft" | "publish";

const HISTORY_TONES: Record<
  | "create"
  | "update"
  | "delete"
  | "publish"
  | "draft"
  | "close"
  | "reopen"
  | "archive"
  | "restore",
  TimelineTone
> = {
  archive: "neutral",
  close: "warning",
  create: "info",
  delete: "error",
  draft: "neutral",
  publish: "success",
  reopen: "success",
  restore: "info",
  update: "info",
};

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
  const { i18n, t } = useTranslation();
  const { jobPostingId } = useParams<{ jobPostingId: string }>();
  const navigate = useNavigate();
  const client = useQueryClient();
  const { showToast } = useToast();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [lifecycleAction, setLifecycleAction] =
    useState<LifecycleAction | null>(null);
  const query = useJobPosting(jobPostingId);
  const history = useJobPostingHistory(jobPostingId);
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
  const lifecycle = useMutation({
    mutationFn: (action: LifecycleAction) =>
      action === "draft"
        ? moveJobPostingToDraft(jobPostingId ?? "")
        : action === "publish"
          ? publishJobPosting(jobPostingId ?? "")
          : transitionJobPosting(jobPostingId ?? "", action),
    onError: (error) =>
      showToast({
        title: t("jobPostings.lifecycle.failedTitle"),
        message: jobPostingErrorMessage(error, t),
        tone: "error",
      }),
    onSuccess: async (_posting, action) => {
      await Promise.all([
        client.invalidateQueries({ queryKey: jobPostingKeys.root(actor) }),
        client.invalidateQueries({
          queryKey: jobPostingKeys.detail(jobPostingId ?? ""),
        }),
        client.invalidateQueries({
          queryKey: jobPostingKeys.history(jobPostingId ?? ""),
        }),
      ]);
      showToast({
        title: t(`jobPostings.lifecycle.${action}.doneTitle`),
        message: t(`jobPostings.lifecycle.${action}.doneMessage`),
        tone: "success",
      });
      setLifecycleAction(null);
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
  const statusNotice =
    posting.status === "draft"
      ? { key: "draft", tone: "info" as const }
      : posting.status === "archived"
        ? { key: "archived", tone: "neutral" as const }
        : posting.status === "closed"
          ? { key: "closed", tone: "warning" as const }
          : null;
  const historyEntries = (history.data?.items ?? []).map((event) => ({
    atIso: event.occurredAt,
    by: t("jobPostings.history.actor", {
      id: event.actorUserId.slice(-6).toUpperCase(),
    }),
    label: t(`jobPostings.history.actions.${event.action}`),
    message: event.changedFields?.length
      ? t("jobPostings.history.changedFields", {
          fields: event.changedFields.join(", "),
        })
      : undefined,
    tone: HISTORY_TONES[event.action],
  }));
  const lifecycleButtons: Array<{
    action: LifecycleAction;
    icon: typeof Play;
  }> = canManage
    ? [
        ...(posting.status === "draft"
          ? [{ action: "publish" as const, icon: Send }]
          : []),
        ...(posting.status === "published" &&
        posting.recruitmentStatus === "open"
          ? [{ action: "close" as const, icon: CirclePause }]
          : []),
        ...(posting.status === "published"
          ? [{ action: "draft" as const, icon: FilePenLine }]
          : []),
        ...(posting.status === "closed"
          ? [
              { action: "reopen" as const, icon: Play },
              { action: "archive" as const, icon: Archive },
            ]
          : []),
        ...(posting.status === "archived"
          ? [{ action: "restore" as const, icon: RotateCcw }]
          : []),
      ]
    : [];

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
          <LogoTile name={posting.enterprise.name} size="md" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="itt-display truncate text-2xl font-semibold leading-tight text-foreground">
                {posting.title}
              </h1>
              <JobPostingStatusBadge posting={posting} />
            </div>
            <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
              {[
                jobDisplayId(posting.id),
                posting.enterprise.name,
                t(
                  posting.publishedAt
                    ? "jobPostings.detail.metaPosted"
                    : "jobPostings.detail.metaCreated",
                  {
                    date: formatPostedDate(
                      posting.publishedAt ?? posting.createdAt,
                    ),
                  },
                ),
                posting.expiresAt
                  ? t("jobPostings.detail.metaDeadline", {
                      date: formatDeadline(posting.expiresAt),
                    })
                  : t("jobPostings.detail.metaNoDeadline"),
                t("jobPostings.detail.applicationCount", {
                  count: applicationCount,
                }),
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </div>
        {canManage ? (
          <div className="flex flex-wrap items-center gap-2.5">
            {lifecycleButtons.map(({ action, icon: Icon }) => (
              <Button
                className="h-11 rounded-xl px-5 text-sm font-semibold"
                disabled={lifecycle.isPending}
                key={action}
                onClick={() => setLifecycleAction(action)}
                type="button"
                variant={action === "archive" ? "destructive" : "outline"}
              >
                <Icon className="size-4" />
                {t(`jobPostings.lifecycle.${action}.action`)}
              </Button>
            ))}
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
              disabled={applicationCount > 0}
              onClick={() => setConfirmingDelete(true)}
              title={
                applicationCount > 0
                  ? t("jobPostings.detail.deleteBlocked")
                  : undefined
              }
              type="button"
            >
              <Trash2 className="size-4" />
              {t("jobPostings.table.delete")}
            </Button>
          </div>
        ) : null}
      </div>

      {statusNotice ? (
        <Callout
          title={t(`jobPostings.detail.notices.${statusNotice.key}.title`)}
          tone={statusNotice.tone}
        >
          {t(`jobPostings.detail.notices.${statusNotice.key}.description`)}
        </Callout>
      ) : null}

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
          {history.isPending ? (
            <Skeleton className="h-52 rounded-2xl" />
          ) : history.isError ? (
            <Callout
              role="alert"
              title={t("jobPostings.history.loadFailed")}
              tone="error"
            >
              <Button
                className="h-auto p-0 text-[13px] font-semibold"
                onClick={() => void history.refetch()}
                variant="link"
              >
                {t("actions.retry")}
              </Button>
            </Callout>
          ) : historyEntries.length > 0 ? (
            <Timeline
              entries={historyEntries}
              formatDate={(iso) =>
                formatJobDateTime(iso, i18n.resolvedLanguage ?? i18n.language)
              }
              title={t("jobPostings.history.title")}
            />
          ) : (
            <RailCard title={t("jobPostings.history.title")}>
              <p className="m-0 text-[13px] text-muted-foreground">
                {t("jobPostings.history.empty")}
              </p>
            </RailCard>
          )}
        </div>
      </div>

      {canManage && lifecycleAction ? (
        <ActionConfirmDialog
          action={
            lifecycle.isPending
              ? t("state.saving")
              : t(`jobPostings.lifecycle.${lifecycleAction}.confirm`)
          }
          description={t(
            `jobPostings.lifecycle.${lifecycleAction}.description`,
          )}
          disabled={lifecycle.isPending}
          icon={
            lifecycleAction === "archive"
              ? Archive
              : lifecycleAction === "close"
                ? CirclePause
                : lifecycleAction === "draft"
                  ? FilePenLine
                  : lifecycleAction === "restore"
                    ? RotateCcw
                    : lifecycleAction === "publish"
                      ? Send
                      : Play
          }
          keepOpenOnConfirm
          onConfirm={() => lifecycle.mutate(lifecycleAction)}
          onOpenChange={(open) => !open && setLifecycleAction(null)}
          open
          title={t(`jobPostings.lifecycle.${lifecycleAction}.title`, {
            title: posting.title,
          })}
          variant={
            lifecycleAction === "archive"
              ? "destructive-solid"
              : lifecycleAction === "close" || lifecycleAction === "draft"
                ? "warning-solid"
                : "success-solid"
          }
        />
      ) : null}

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
