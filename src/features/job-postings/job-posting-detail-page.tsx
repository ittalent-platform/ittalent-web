import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  ArrowRight,
  Eye,
  Lock,
  MoreVertical,
  RotateCcw,
  Trash2,
  Undo2,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router";

import { Breadcrumb } from "@/components/common/breadcrumb";
import { LogoTile } from "@/components/common/logo-tile";
import { useToast } from "@/components/toast/toast-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import {
  ArchiveJobDialog,
  CloseJobDialog,
  DeleteJobDialog,
  JobPostingHistoryDialog,
  MoveToDraftDialog,
  PublishChecklistDialog,
  PublishJobDialog,
  ReopenJobDialog,
  UnarchiveJobDialog,
} from "./job-posting-dialogs";
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
  formatPostedDate,
  formatSalary,
  jobDisplayId,
} from "./job-postings.format";

type Actor = "admin" | "recruiter";
type LifecycleAction = JobPostingTransition | "draft" | "publish";

export function JobPostingDetailPage({ actor, readOnly = false }: { actor: Actor; readOnly?: boolean }) {
  const { t } = useTranslation();
  const { jobPostingId } = useParams<{ jobPostingId: string }>();
  const navigate = useNavigate();
  const client = useQueryClient();
  const { showToast } = useToast();

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [lifecycleAction, setLifecycleAction] =
    useState<LifecycleAction | null>(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [publishChecklistOpen, setPublishChecklistOpen] = useState(false);

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
      const doneKey =
        action === "close"
          ? "close"
          : action === "reopen"
            ? "reopen"
            : action === "archive"
              ? "archive"
              : action === "restore"
                ? "restore"
                : action === "publish"
                  ? "publish"
                  : "draft";
      showToast({
        title: t(`jobPostings.lifecycle.${doneKey}.doneTitle`),
        message: t(`jobPostings.lifecycle.${doneKey}.doneMessage`),
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
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  if (query.isError || !query.data)
    return <JobPostingErrorState backTo={basePath} error={query.error} />;

  const posting = query.data;
  const canManage = actor === "recruiter" && !readOnly;
  const applicationCount = posting.applicationCount ?? 0;

  function handlePublishClick() {
    const isReady = Boolean(
      posting.title &&
      posting.employmentType &&
      posting.location &&
      posting.description &&
      posting.description.trim().length >= 20 &&
      posting.requirements &&
      posting.requirements.trim().length > 0 &&
      posting.benefits &&
      posting.benefits.trim().length > 0 &&
      posting.expiresAt &&
      new Date(posting.expiresAt).getTime() >= Date.now(),
    );
    if (!isReady) {
      setPublishChecklistOpen(true);
    } else {
      setLifecycleAction("publish");
    }
  }

  const visibilityText =
    posting.status === "published"
      ? t("jobPostings.detail.visibilityPublic")
      : posting.status === "draft"
        ? t("jobPostings.detail.visibilityHiddenDraft")
        : posting.status === "closed"
          ? t("jobPostings.detail.visibilityClosed")
          : t("jobPostings.detail.visibilityArchived");

  const historyItems = history.data?.items ?? [];

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <Breadcrumb
        ariaLabel={t("jobPostings.title")}
        items={[
          { label: t("jobPostings.title"), to: basePath },
          { label: posting.title },
        ]}
      />

      {/* Page Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="itt-display text-2xl font-bold tracking-tight text-foreground sm:text-[26px]">
              {posting.title}
            </h1>
            <JobPostingStatusBadge posting={posting} />
          </div>
          <div className="flex items-center gap-2">
            <LogoTile name={posting.enterprise.name} size="sm" />
            <span className="text-[14px] font-semibold text-foreground">
              {posting.enterprise.name}
            </span>
          </div>
          <p className="m-0 text-[13.5px] text-muted-foreground">
            {[
              posting.enterprise.name,
              jobDisplayId(posting.id),
              posting.publishedAt
                ? t("jobPostings.detail.metaPosted", {
                    date: formatPostedDate(posting.publishedAt),
                  })
                : t("jobPostings.detail.metaCreated", {
                    date: formatPostedDate(posting.createdAt),
                  }),
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

        {/* Action Buttons */}
        {canManage ? (
          <div className="flex flex-wrap items-center gap-2.5">
            {posting.status !== "archived" ? (
              <Button
                asChild
                className="h-10 px-4.5 text-[13.5px] font-semibold"
                shape="pill"
                variant="outline"
              >
                <Link to={`${basePath}/${posting.id}/edit`}>
                  {t("jobPostings.actions.edit")}
                </Link>
              </Button>
            ) : null}

            {/* Lifecycle action buttons */}
            {posting.status === "draft" ? (
              <Button
                className="h-10 px-4.5 text-[13.5px] font-semibold bg-(--status-success-fg) text-white hover:opacity-90"
                onClick={handlePublishClick}
                shape="pill"
                type="button"
              >
                {t("jobPostings.lifecycle.publish.action")}
              </Button>
            ) : null}

            {posting.status === "published" ? (
              <>
                <Button
                  className="h-10 px-4.5 text-[13.5px] font-semibold text-destructive border-border hover:bg-muted"
                  onClick={() => setLifecycleAction("close")}
                  shape="pill"
                  type="button"
                  variant="outline"
                >
                  <Lock className="size-3.5" />
                  {t("jobPostings.lifecycle.close.action")}
                </Button>
                <Button
                  className="h-10 px-4.5 text-[13.5px] font-semibold"
                  onClick={() => setLifecycleAction("draft")}
                  shape="pill"
                  type="button"
                  variant="outline"
                >
                  <Undo2 className="size-3.5" />
                  {t("jobPostings.lifecycle.draft.action")}
                </Button>
              </>
            ) : null}

            {posting.status === "closed" ? (
              <>
                <Button
                  className="h-10 px-4.5 text-[13.5px] font-semibold text-blue-600 dark:text-blue-400 border-border hover:bg-muted"
                  onClick={() => setLifecycleAction("reopen")}
                  shape="pill"
                  type="button"
                  variant="outline"
                >
                  <RotateCcw className="size-3.5" />
                  {t("jobPostings.lifecycle.reopen.action")}
                </Button>
                <Button
                  className="h-10 px-4.5 text-[13.5px] font-semibold text-purple-600 dark:text-purple-400 border-border hover:bg-muted"
                  onClick={() => setLifecycleAction("archive")}
                  shape="pill"
                  type="button"
                  variant="outline"
                >
                  <Archive className="size-3.5" />
                  {t("jobPostings.lifecycle.archive.action")}
                </Button>
              </>
            ) : null}

            {posting.status === "archived" ? (
              <Button
                className="h-10 px-4.5 text-[13.5px] font-semibold text-purple-600 dark:text-purple-400 border-border hover:bg-muted"
                onClick={() => setLifecycleAction("restore")}
                shape="pill"
                type="button"
                variant="outline"
              >
                <RotateCcw className="size-3.5" />
                {t("jobPostings.lifecycle.restore.action")}
              </Button>
            ) : null}

            <Button
              asChild
              className="h-10 px-5 text-[13.5px] font-semibold"
              shape="pill"
            >
              <Link to={`/${actor}/applications?jobId=${posting.id}`}>
                {t("jobPostings.detail.viewApplications")}
              </Link>
            </Button>

            {/* More actions menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  aria-label={t("jobPostings.table.actions")}
                  className="flex size-10 cursor-pointer items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  type="button"
                >
                  <MoreVertical className="size-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 rounded-xl p-1 text-sm shadow-xl"
              >
                <DropdownMenuItem
                  className="flex cursor-pointer items-center gap-2 px-3 py-2 text-[13.5px]"
                  onClick={() => setHistoryModalOpen(true)}
                >
                  <Eye className="size-4 text-muted-foreground" />
                  <span>{t("jobPostings.detail.viewFullHistory")}</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex cursor-pointer items-center gap-2 border-t border-border/50 px-3 py-2 text-[13.5px] text-destructive"
                  disabled={applicationCount > 0}
                  onClick={() => setConfirmingDelete(true)}
                >
                  <Trash2 className="size-4" />
                  <span className="flex-1">
                    {t("jobPostings.actions.delete")}
                  </span>
                  {applicationCount > 0 ? (
                    <span className="text-[11.5px] text-muted-foreground">
                      {t("jobPostings.actions.hasApplications")}
                    </span>
                  ) : null}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : null}
      </div>

      {/* Status Notice Banner */}
      {posting.status === "draft" ? (
        <div
          className="rounded-lg border border-primary/20 bg-(--status-info-bg) p-3 px-4 text-[13.5px] leading-relaxed text-(--status-info-fg)"
          role="status"
        >
          {t("jobPostings.detail.notices.draft.title")} —{" "}
          {t("jobPostings.detail.notices.draft.description")}
        </div>
      ) : posting.status === "closed" ? (
        <div
          className="rounded-lg border border-(--status-warning-bg) bg-(--status-warning-bg)/20 p-3 px-4 text-[13.5px] leading-relaxed text-(--status-warning-fg)"
          role="status"
        >
          {t("jobPostings.detail.notices.closed.title")} —{" "}
          {t("jobPostings.detail.notices.closed.description")}
        </div>
      ) : posting.status === "archived" ? (
        <div
          className="rounded-lg border border-border bg-(--canvas) p-3 px-4 text-[13.5px] leading-relaxed text-muted-foreground"
          role="status"
        >
          {t("jobPostings.detail.notices.archived.title")} —{" "}
          {t("jobPostings.detail.notices.archived.description")}
        </div>
      ) : null}

      {/* Two-Column Grid Layout matching reference (minmax(0,1fr) 320px) */}
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Left Column: Role Details & Content Sections */}
        <section className="flex flex-col gap-6 rounded-xl border border-border bg-card p-6 shadow-xs">
          {/* DESCRIPTION */}
          <div className="flex flex-col gap-2">
            <span className="text-[11.5px] font-bold tracking-[0.05em] text-muted-foreground uppercase">
              {t("jobPostings.detail.descriptionSection")}
            </span>
            {posting.description ? (
              <p className="m-0 whitespace-pre-wrap text-[14px] leading-relaxed text-foreground">
                {posting.description}
              </p>
            ) : (
              <p className="m-0 text-[14px] text-muted-foreground">
                {t("jobPostings.detail.notAddedYet")}
              </p>
            )}
          </div>

          {/* REQUIREMENTS */}
          <div className="flex flex-col gap-2">
            <span className="text-[11.5px] font-bold tracking-[0.05em] text-muted-foreground uppercase">
              {t("jobPostings.detail.requirementsSection")}
            </span>
            {posting.requirements ? (
              <p className="m-0 whitespace-pre-wrap text-[14px] leading-relaxed text-foreground">
                {posting.requirements}
              </p>
            ) : (
              <p className="m-0 text-[14px] text-muted-foreground">
                {t("jobPostings.detail.notAddedYet")}
              </p>
            )}
          </div>

          {/* BENEFITS */}
          <div className="flex flex-col gap-2">
            <span className="text-[11.5px] font-bold tracking-[0.05em] text-muted-foreground uppercase">
              {t("jobPostings.detail.benefitsSection")}
            </span>
            {posting.benefits ? (
              <p className="m-0 whitespace-pre-wrap text-[14px] leading-relaxed text-foreground">
                {posting.benefits}
              </p>
            ) : (
              <p className="m-0 text-[14px] text-muted-foreground">
                {t("jobPostings.detail.notAddedYet")}
              </p>
            )}
          </div>
        </section>

        {/* Right Column: Details, Applications, History (320px) */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
          {/* DETAILS CARD */}
          <section className="flex flex-col gap-2 rounded-xl border border-border bg-card p-5 pb-3 shadow-xs">
            <span className="text-[11.5px] font-bold tracking-[0.05em] text-muted-foreground uppercase">
              {t("jobPostings.detail.detailsSection")}
            </span>
            <div className="mt-1 divide-y divide-border/40">
              <div className="flex items-center justify-between gap-3 py-2 text-[13.5px]">
                <span className="text-muted-foreground">
                  {t("jobPostings.detail.salary")}
                </span>
                <span className="font-semibold text-foreground text-right">
                  {posting.salaryNegotiable
                    ? t("jobPostings.salaryNegotiable")
                    : formatSalary(posting)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 py-2 text-[13.5px]">
                <span className="text-muted-foreground">
                  {t("jobPostings.detail.level")}
                </span>
                <span className="font-semibold text-foreground text-right">
                  {posting.level || t("jobPostings.notSpecified")}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 py-2 text-[13.5px]">
                <span className="text-muted-foreground">
                  {t("jobPostings.detail.type")}
                </span>
                <span className="font-semibold text-foreground text-right">
                  {posting.employmentType || t("jobPostings.notSpecified")}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 py-2 text-[13.5px]">
                <span className="text-muted-foreground">
                  {t("jobPostings.detail.location")}
                </span>
                <span className="font-semibold text-foreground text-right">
                  {posting.location || t("jobPostings.notSpecified")}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 py-2 text-[13.5px]">
                <span className="text-muted-foreground">
                  {t("jobPostings.detail.openings")}
                </span>
                <span className="font-semibold text-foreground text-right">
                  {posting.openings ?? t("jobPostings.notSpecified")}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 py-2 text-[13.5px]">
                <span className="text-muted-foreground">
                  {t("jobPostings.detail.deadline")}
                </span>
                <span className="font-semibold text-foreground text-right">
                  {posting.expiresAt
                    ? formatDeadline(posting.expiresAt)
                    : t("jobPostings.detail.notSet")}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 py-2 text-[13.5px]">
                <span className="text-muted-foreground">
                  {t("jobPostings.detail.visibility")}
                </span>
                <span className="font-semibold text-foreground text-right">
                  {visibilityText}
                </span>
              </div>
            </div>
          </section>

          {/* APPLICATIONS METRIC CARD (Dark Card matching reference) */}
          <section className="flex flex-col gap-1 rounded-xl bg-sidebar p-5 text-sidebar-foreground shadow-xs">
            <span className="text-[11.5px] font-bold tracking-[0.05em] text-white/55 uppercase">
              {t("jobPostings.detail.applicationsSection")}
            </span>
            <span className="itt-display text-4xl font-bold tracking-tight text-white leading-none mt-1">
              {applicationCount}
            </span>
            <span className="mt-1 text-[12.5px] text-white/55">
              {applicationCount > 0
                ? t("jobPostings.detail.applicationCount", {
                    count: applicationCount,
                  })
                : t("jobPostings.detail.noApplicationsYet")}
            </span>
            <Link
              className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-bold text-primary hover:underline"
              to={`/${actor}/applications?jobId=${posting.id}`}
            >
              {t("jobPostings.detail.viewApplications")}
              <ArrowRight className="size-3.5" />
            </Link>
          </section>

          {/* HISTORY RAIL CARD */}
          <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-xs">
            <span className="text-[11.5px] font-bold tracking-[0.05em] text-muted-foreground uppercase">
              {t("jobPostings.history.title")}
            </span>
            {historyItems.length === 0 ? (
              <p className="m-0 text-[13px] text-muted-foreground">
                {t("jobPostings.history.empty")}
              </p>
            ) : (
              <ol className="m-0 flex list-none flex-col gap-3 p-0">
                {historyItems.slice(0, 3).map((item, index) => {
                  const isPublish = item.action === "publish";
                  return (
                    <li className="relative flex gap-3" key={item.id}>
                      {index < Math.min(historyItems.length, 3) - 1 ? (
                        <span
                          aria-hidden="true"
                          className="absolute top-4 left-[5px] bottom-0 w-px bg-border"
                        />
                      ) : null}
                      <span
                        aria-hidden="true"
                        className={cn(
                          "relative z-10 mt-1 size-2.5 shrink-0 rounded-full",
                          isPublish
                            ? "bg-(--status-success-fg)"
                            : "bg-muted-foreground",
                        )}
                      />
                      <div className="flex flex-col gap-0.5 text-[13px]">
                        <span className="font-semibold text-foreground">
                          {t(`jobPostings.history.actions.${item.action}`, {
                            defaultValue: item.action,
                          })}
                        </span>
                        <span className="text-[12px] text-muted-foreground">
                          {formatPostedDate(item.occurredAt)} ·{" "}
                          {t("jobPostings.history.actor", {
                            id: item.actorUserId.slice(-6).toUpperCase(),
                          })}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
            <button
              className="mt-1 inline-flex cursor-pointer items-center gap-1.5 text-[13px] font-bold text-foreground hover:text-fg-link text-left"
              onClick={() => setHistoryModalOpen(true)}
              type="button"
            >
              {t("jobPostings.detail.viewFullHistory")}
              <ArrowRight className="size-3.5" />
            </button>
          </section>
        </aside>
      </div>

      {/* Confirmation & Modal Dialogs */}
      {canManage && confirmingDelete ? (
        <DeleteJobDialog
          disabled={deletion.isPending}
          onConfirm={() => deletion.mutate()}
          onOpenChange={(open) => !open && setConfirmingDelete(false)}
          open
          posting={posting}
        />
      ) : null}

      {canManage && lifecycleAction === "close" ? (
        <CloseJobDialog
          disabled={lifecycle.isPending}
          onConfirm={() => lifecycle.mutate("close")}
          onOpenChange={(open) => !open && setLifecycleAction(null)}
          open
          posting={posting}
        />
      ) : null}

      {canManage && lifecycleAction === "archive" ? (
        <ArchiveJobDialog
          disabled={lifecycle.isPending}
          onConfirm={() => lifecycle.mutate("archive")}
          onOpenChange={(open) => !open && setLifecycleAction(null)}
          open
          posting={posting}
        />
      ) : null}

      {canManage && lifecycleAction === "restore" ? (
        <UnarchiveJobDialog
          disabled={lifecycle.isPending}
          onConfirm={() => lifecycle.mutate("restore")}
          onOpenChange={(open) => !open && setLifecycleAction(null)}
          open
          posting={posting}
        />
      ) : null}

      {canManage && lifecycleAction === "reopen" ? (
        <ReopenJobDialog
          disabled={lifecycle.isPending}
          onConfirm={() => lifecycle.mutate("reopen")}
          onOpenChange={(open) => !open && setLifecycleAction(null)}
          open
          posting={posting}
        />
      ) : null}

      {canManage && lifecycleAction === "publish" ? (
        <PublishJobDialog
          disabled={lifecycle.isPending}
          onConfirm={() => lifecycle.mutate("publish")}
          onOpenChange={(open) => !open && setLifecycleAction(null)}
          open
          posting={posting}
        />
      ) : null}

      {canManage && lifecycleAction === "draft" ? (
        <MoveToDraftDialog
          disabled={lifecycle.isPending}
          onConfirm={() => lifecycle.mutate("draft")}
          onOpenChange={(open) => !open && setLifecycleAction(null)}
          open
          posting={posting}
        />
      ) : null}

      {canManage && publishChecklistOpen ? (
        <PublishChecklistDialog
          editPath={`${basePath}/${posting.id}/edit`}
          onOpenChange={setPublishChecklistOpen}
          open={publishChecklistOpen}
          posting={posting}
        />
      ) : null}

      <JobPostingHistoryDialog
        history={history.data}
        onOpenChange={setHistoryModalOpen}
        open={historyModalOpen}
        posting={posting}
      />
    </div>
  );
}
