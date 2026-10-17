import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  Calendar,
  ChevronDown,
  Download,
  ExternalLink,
  FileText,
  History,
  Inbox,
  MoreVertical,
  XCircle,
} from "lucide-react";

import { useSession } from "@/auth/use-session";
import { PersonAvatar } from "@/components/common/person-avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/toast/toast-provider";
import { cn } from "@/lib/utils";
import {
  ApplicationStatusDialog,
  type StatusDialogSubmission,
} from "@/features/recruiter/applications/application-status-dialog";
import {
  INTERVIEW_REPLY_TONES,
  PERMITTED_TRANSITIONS,
  RECRUITER_APPLICATIONS_PATH,
  STATUS_TONES,
  type ApplicationItem,
  type ApplicationStatus,
  type UpdatableStatus,
  isUpdatableStatus,
} from "@/features/recruiter/applications/applications.constants";
import {
  formatDate,
  formatInterviewSchedule,
} from "@/features/recruiter/applications/applications.format";
import {
  useRecruiterApplication,
  useUpdateApplicationStatus,
} from "@/features/recruiter/applications/applications.queries";
import { ApplicationInternalNotes } from "./application-internal-notes";
import { ApplicationProgressTimeline } from "./application-progress-timeline";
import { CompanyHistoryDialog } from "./company-history-dialog";

const CARD = "rounded-2xl border border-border bg-card p-6 shadow-xs flex flex-col gap-4";

export function RecruiterApplicationDetailPage() {
  const { applicationId = "" } = useParams<{ applicationId: string }>();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { data: session } = useSession();

  const query = useRecruiterApplication(applicationId);
  const application = query.data;
  const updateStatusMutation = useUpdateApplicationStatus();

  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    targetStatus: UpdatableStatus | null;
  }>({
    open: false,
    targetStatus: null,
  });

  if (query.isPending) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="text-sm font-medium text-muted-foreground">
          {t("recruiterApplications.detail.loading")}
        </span>
      </div>
    );
  }

  if (query.isError || !application) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <div className="grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
          <Inbox className="size-6" />
        </div>
        <h2 className="text-lg font-bold text-foreground">
          {t("recruiterApplications.detail.notFoundTitle")}
        </h2>
        <p className="max-w-md text-sm text-muted-foreground">
          {t("recruiterApplications.detail.notFoundDescription")}
        </p>
        <Button
          className="mt-2"
          onClick={() => navigate(RECRUITER_APPLICATIONS_PATH)}
          shape="xl"
          variant="outline"
        >
          {t("recruiterApplications.detail.backToApplications")}
        </Button>
      </div>
    );
  }

  const candidateName =
    application.applicant.fullName || application.applicant.email;
  const currentTone = STATUS_TONES[application.status];
  const nextStatuses = PERMITTED_TRANSITIONS[application.status] ?? [];
  const latestInterview = application.interviews?.[0] ?? null;

  // Adapt detail to ApplicationItem shape for the status dialog
  const itemForDialog: ApplicationItem = {
    id: application.id,
    job: {
      id: application.job.id,
      title: application.job.title,
    },
    applicant: {
      id: application.applicant.id,
      fullName: application.applicant.fullName,
      email: application.applicant.email,
      phone: application.applicant.phone,
    },
    status: application.status,
    reviewStage: application.reviewStage,
    submittedDocuments: application.attachments.map((a) => a.type),
    nextInterview: latestInterview
      ? {
          id: latestInterview.id,
          scheduledAt: latestInterview.scheduledAt,
          mode: latestInterview.mode,
        }
      : null,
    notesCount: application.notes?.length || 0,
    submittedAt: application.submittedAt || new Date().toISOString(),
    latestStatusAt: application.latestStatusAt || application.submittedAt || new Date().toISOString(),
  };

  function handleRequestStatus(status: ApplicationStatus) {
    if (isUpdatableStatus(status)) {
      updateStatusMutation.reset();
      setDialogState({
        open: true,
        targetStatus: status,
      });
    }
  }

  async function handleConfirmStatus(submission: StatusDialogSubmission) {
    try {
      await updateStatusMutation.mutateAsync({
        id: application!.id,
        body: submission,
      });
      const targetStage = t(`applications.status.${submission.status}`);
      showToast({
        tone: "success",
        title:
          submission.status === "rejected"
            ? t("recruiterApplications.statusDialog.titleReject")
            : t("recruiterApplications.statusDialog.titleMove", { stage: targetStage }),
        message: t("recruiterApplications.statusDialog.successToast", {
          name: candidateName,
          stage: targetStage,
        }),
      });
      setDialogState({ open: false, targetStatus: null });
      void query.refetch();
    } catch {
      // Error handled inside status dialog callout
    }
  }

  function handleOpenDocument(documentId: string) {
    window.open(`/api/v1/documents/${documentId}/preview`, "_blank");
  }

  function handleDownloadDocument(documentId: string) {
    window.open(`/api/v1/documents/${documentId}/download`, "_blank");
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb Navigation */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-xs font-semibold text-muted-foreground"
      >
        <Link
          className="hover:text-foreground transition-colors"
          to={RECRUITER_APPLICATIONS_PATH}
        >
          {t("recruiterApplications.detail.breadcrumb")}
        </Link>
        <span>/</span>
        <span className="text-foreground">{candidateName}</span>
      </nav>

      {/* Header Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <PersonAvatar className="size-14 rounded-2xl text-base" name={candidateName} />
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {candidateName}
              </h1>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                  currentTone.badge,
                )}
              >
                <span className={cn("size-1.5 rounded-full", currentTone.dot)} />
                {t(`applications.status.${application.status}`)}
              </span>
            </div>
            <p className="text-xs font-medium text-muted-foreground">
              {application.job.title} ·{" "}
              {t("recruiterApplications.detail.appliedOn", {
                date: formatDate(
                  application.attachments[0]?.submittedAt || new Date().toISOString(),
                  i18n.language,
                ),
              })}{" "}
              · {application.id.slice(-6).toUpperCase()}
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2.5">
          {nextStatuses.length > 0 ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="h-10 px-4 font-semibold" shape="pill" variant="default">
                  <span>{t("recruiterApplications.detail.changeStatus")}</span>
                  <ChevronDown className="size-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 rounded-xl py-1">
                {nextStatuses.map((nextStatus) => {
                  const tone = STATUS_TONES[nextStatus];
                  const isReject = nextStatus === "rejected";
                  return (
                    <DropdownMenuItem
                      className={cn("gap-2.5 px-3.5 py-2 text-[13.5px] font-medium", tone.text)}
                      key={nextStatus}
                      onSelect={() => handleRequestStatus(nextStatus)}
                    >
                      {isReject ? (
                        <XCircle className="size-4 shrink-0 text-(--status-error-fg)" />
                      ) : (
                        <ArrowRight className={cn("size-4 shrink-0", tone.text)} />
                      )}
                      {t("recruiterApplications.actions.moveTo", {
                        stage: t(`applications.status.${nextStatus}`),
                      })}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}

          {/* More options menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label={t("recruiterApplications.detail.moreActions")}
                className="size-10 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
                size="icon"
                variant="outline"
              >
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl py-1">
              <DropdownMenuItem
                className="gap-2.5 px-3.5 py-2 text-[13.5px]"
                onSelect={() =>
                  navigate(`/recruiter/interviews?applicationId=${application.id}`)
                }
              >
                <Calendar className="size-4 text-muted-foreground" />
                {t("recruiterApplications.detail.scheduleInterview")}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2.5 px-3.5 py-2 text-[13.5px]"
                onSelect={() => setHistoryDialogOpen(true)}
              >
                <History className="size-4 text-muted-foreground" />
                {t("recruiterApplications.historyDialog.title")}
              </DropdownMenuItem>
              {application.attachments.length > 0 ? (
                <DropdownMenuItem
                  className="gap-2.5 px-3.5 py-2 text-[13.5px]"
                  onSelect={() => handleDownloadDocument(application.attachments[0]!.documentId)}
                >
                  <Download className="size-4 text-muted-foreground" />
                  {t("recruiterApplications.detail.downloadAll")}
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Recruitment Progress Timeline */}
      <ApplicationProgressTimeline
        currentStatus={application.status}
        locale={i18n.language}
        statusHistory={application.statusHistory}
      />

      {/* Two-Column Detail Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column (2/3 width) */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Submitted Documents Card */}
          <section aria-labelledby="documents-heading" className={CARD}>
            <h2
              className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
              id="documents-heading"
            >
              {t("recruiterApplications.detail.documentsTitle")}
            </h2>
            {application.attachments.length > 0 ? (
              <div className="flex flex-col gap-2.5">
                {application.attachments.map((doc) => {
                  const sizeKb = Math.round(doc.size / 1024);
                  const ext = doc.fileName.split(".").pop()?.toUpperCase() || "PDF";
                  return (
                    <div
                      className="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-3"
                      key={doc.documentId}
                    >
                      <div className="flex items-center gap-3">
                        <div className="grid size-9 place-items-center rounded-lg bg-card text-muted-foreground border border-border">
                          <FileText className="size-4.5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-foreground">
                            {doc.type === "cv"
                              ? t("recruiterApplications.document.cv")
                              : t("recruiterApplications.document.cover_letter")}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {doc.fileName} · {ext} · {sizeKb} KB
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button
                          className="h-8 gap-1.5 px-3 text-xs font-medium"
                          onClick={() => handleOpenDocument(doc.documentId)}
                          shape="xl"
                          size="sm"
                          variant="outline"
                        >
                          <span>{t("recruiterApplications.detail.openDocument")}</span>
                          <ExternalLink className="size-3 text-muted-foreground" />
                        </Button>
                        <Button
                          aria-label={t("recruiterApplications.detail.downloadDocument")}
                          className="size-8 rounded-xl text-muted-foreground"
                          onClick={() => handleDownloadDocument(doc.documentId)}
                          size="icon"
                          variant="ghost"
                        >
                          <Download className="size-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                {t("recruiterApplications.detail.noDocuments")}
              </p>
            )}
          </section>

          {/* Message from Candidate Card */}
          <section aria-labelledby="message-heading" className={CARD}>
            <h2
              className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
              id="message-heading"
            >
              {t("recruiterApplications.detail.messageTitle")}
            </h2>
            {application.message ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {application.message}
              </p>
            ) : (
              <p className="text-xs italic text-muted-foreground">
                {t("recruiterApplications.detail.noMessage")}
              </p>
            )}
          </section>

          {/* Contact Details Card */}
          <section aria-labelledby="contact-heading" className={CARD}>
            <h2
              className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
              id="contact-heading"
            >
              {t("recruiterApplications.detail.contactTitle")}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">
                  {t("recruiterApplications.detail.email")}
                </span>
                <span className="text-sm font-semibold text-foreground break-all">
                  {application.applicant.email}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">
                  {t("recruiterApplications.detail.phone")}
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {application.applicant.phone || t("recruiterApplications.detail.notProvided")}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">
                  {t("recruiterApplications.detail.location")}
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {application.job.location || t("recruiterApplications.detail.notProvided")}
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column (1/3 width) */}
        <div className="flex flex-col gap-6">
          {/* Next Interview Card */}
          <section aria-labelledby="interview-heading" className={CARD}>
            <div className="flex items-center justify-between">
              <h2
                className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                id="interview-heading"
              >
                {t("recruiterApplications.detail.interviewTitle")}
              </h2>
              <Link
                className="text-xs font-semibold text-primary hover:underline"
                to={`/recruiter/interviews?applicationId=${application.id}`}
              >
                {t("recruiterApplications.detail.openInInterviews")} →
              </Link>
            </div>
            {latestInterview ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-foreground">
                    {formatInterviewSchedule(
                      latestInterview.scheduledAt,
                      i18n.language,
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-foreground">
                    {latestInterview.mode === "online" ? "🎥 Online" : "🏢 Onsite"}
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold",
                      INTERVIEW_REPLY_TONES[latestInterview.status as keyof typeof INTERVIEW_REPLY_TONES] ||
                        "bg-muted text-muted-foreground",
                    )}
                  >
                    {t(`recruiterApplications.interviewReply.${latestInterview.status}`, {
                      defaultValue: latestInterview.status,
                    })}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-xs text-muted-foreground">
                  {t("recruiterApplications.detail.noInterview")}
                </p>
                <Button
                  className="w-full text-xs font-semibold"
                  onClick={() =>
                    navigate(`/recruiter/interviews?applicationId=${application.id}`)
                  }
                  shape="xl"
                  size="sm"
                  variant="outline"
                >
                  <Calendar className="size-3.5 mr-1.5" />
                  {t("recruiterApplications.actions.scheduleInterview")}
                </Button>
              </div>
            )}
          </section>

          {/* Internal Notes Card */}
          <ApplicationInternalNotes
            applicationId={application.id}
            initialNotes={application.notes}
          />

          {/* Status History Summary Card */}
          <section aria-labelledby="history-heading" className={CARD}>
            <div className="flex items-center justify-between">
              <h2
                className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                id="history-heading"
              >
                {t("recruiterApplications.detail.statusHistoryTitle")}
              </h2>
              <button
                className="inline-flex items-center gap-1 text-[13px] font-bold text-foreground hover:text-primary transition-colors cursor-pointer"
                onClick={() => setHistoryDialogOpen(true)}
                type="button"
              >
                <span>{t("recruiterApplications.detail.viewAllHistory")}</span>
                <ArrowRight className="size-3.5" />
              </button>
            </div>
            {application.statusHistory && application.statusHistory.length > 0 ? (
              <div className="flex flex-col gap-3">
                {application.statusHistory.slice(0, 5).map((entry, idx) => {
                  const tone = STATUS_TONES[entry.status];
                  return (
                    <div className="flex items-start gap-2.5 text-xs" key={idx}>
                      <span
                        className={cn(
                          "mt-1 size-2 rounded-full shrink-0",
                          tone?.dot || "bg-muted-foreground",
                        )}
                      />
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">
                          {t("recruiterApplications.detail.movedTo", {
                            stage: t(`applications.status.${entry.status}`),
                          })}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {entry.occurredAt ? formatDate(entry.occurredAt, i18n.language) : ""}
                          {entry.actorRole ? ` · ${entry.actorRole}` : ""}
                        </span>
                        {entry.note ? (
                          <span className="mt-0.5 text-xs text-muted-foreground italic">
                            "{entry.note}"
                          </span>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                {t("recruiterApplications.detail.candidateApplied")}
              </p>
            )}
          </section>
        </div>
      </div>

      {/* Status Change Dialog Integration */}
      <ApplicationStatusDialog
        error={updateStatusMutation.error}
        isPending={updateStatusMutation.isPending}
        item={itemForDialog}
        onConfirm={handleConfirmStatus}
        onOpenChange={(open) => setDialogState((prev) => ({ ...prev, open }))}
        open={dialogState.open}
        targetStatus={dialogState.targetStatus}
      />

      {/* Company History Dialog Integration */}
      <CompanyHistoryDialog
        applicationId={application.id}
        candidateName={candidateName}
        companyName={enterpriseName}
        jobTitle={application.job.title}
        onOpenChange={setHistoryDialogOpen}
        open={historyDialogOpen}
        statusHistory={application.statusHistory}
      />
    </div>
  );
}
