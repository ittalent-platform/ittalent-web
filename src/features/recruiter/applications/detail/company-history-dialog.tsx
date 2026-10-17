import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, X } from "lucide-react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  STATUS_TONES,
  type ApplicationStatus,
} from "@/features/recruiter/applications/applications.constants";
import { formatFullDateTime } from "@/features/recruiter/applications/applications.format";
import { useRecruiterCompanyHistory } from "@/features/recruiter/applications/applications.queries";

export interface StatusHistoryEntry {
  status: ApplicationStatus;
  reviewStage?: string | null;
  actorRole?: string | null;
  note?: string | null;
  messageToCandidate?: string | null;
  rejectionReason?: string | null;
  occurredAt: string;
}

export interface CompanyHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: string;
  candidateName: string;
  jobTitle: string;
  companyName?: string;
  statusHistory?: StatusHistoryEntry[];
}

export function CompanyHistoryDialog({
  open,
  onOpenChange,
  applicationId,
  candidateName,
  jobTitle,
  companyName,
  statusHistory = [],
}: CompanyHistoryDialogProps) {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<"application" | "company">("application");

  const companyHistoryQuery = useRecruiterCompanyHistory(applicationId, {
    enabled: open,
  });

  const companyHistory = companyHistoryQuery.data;
  const companyItems = companyHistory?.items ?? [];
  const companyCount =
    companyHistory?.totalSubmissionsToCompany ?? companyItems.length;

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent
        aria-describedby="history-dialog-subtitle"
        className="max-w-[520px] w-full rounded-2xl bg-card p-0 overflow-hidden shadow-2xl sm:max-w-[520px] border border-border"
        showCloseButton={false}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-3">
          <div className="flex flex-col gap-1">
            <DialogTitle className="text-[19px] font-semibold text-foreground font-heading">
              {t("recruiterApplications.historyDialog.title")}
            </DialogTitle>
            <DialogDescription
              className="text-xs text-muted-foreground"
              id="history-dialog-subtitle"
            >
              {candidateName} · {jobTitle}
            </DialogDescription>
          </div>
          <DialogClose asChild>
            <Button
              aria-label="Close"
              className="size-8 rounded-xl text-muted-foreground hover:bg-muted"
              data-testid="close-history-dialog"
              id="close-history-dialog-btn"
              size="icon"
              variant="ghost"
            >
              <X className="size-4" />
            </Button>
          </DialogClose>
        </div>

        {/* Tab List */}
        <div
          className="flex gap-5 px-6 border-b border-border"
          role="tablist"
        >
          <button
            aria-selected={activeTab === "application"}
            className={cn(
              "h-10 text-[13.5px] font-semibold cursor-pointer border-b-2 transition-colors -mb-px",
              activeTab === "application"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
            data-testid="tab-this-application"
            id="tab-this-application"
            onClick={() => setActiveTab("application")}
            role="tab"
            type="button"
          >
            {t("recruiterApplications.historyDialog.tabThisApplication")}
          </button>
          <button
            aria-selected={activeTab === "company"}
            className={cn(
              "h-10 text-[13.5px] font-semibold cursor-pointer border-b-2 transition-colors -mb-px",
              activeTab === "company"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
            data-testid="tab-company-history"
            id="tab-company-history"
            onClick={() => setActiveTab("company")}
            role="tab"
            type="button"
          >
            {companyName
              ? t("recruiterApplications.historyDialog.tabAtCompany", {
                  company: companyName,
                  count: companyCount,
                })
              : t("recruiterApplications.historyDialog.tabAtCompanyDefault", {
                  count: companyCount,
                })}
          </button>
        </div>

        {/* Tab 1: This Application History */}
        {activeTab === "application" ? (
          <div className="max-h-[calc(100vh-260px)] overflow-y-auto px-6 py-5">
            {statusHistory.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4">
                {t("recruiterApplications.historyDialog.noTimeline")}
              </p>
            ) : (
              <ol className="list-none m-0 p-0 flex flex-col">
                {statusHistory.map((entry, index) => {
                  const tone = STATUS_TONES[entry.status];
                  const isLast = index === statusHistory.length - 1;
                  const stageLabel = t(`applications.status.${entry.status}`);
                  const title =
                    entry.status === "submitted"
                      ? t("recruiterApplications.detail.candidateApplied")
                      : t("recruiterApplications.detail.movedTo", {
                          stage: stageLabel,
                        });

                  return (
                    <li className="flex gap-3 relative" key={index}>
                      {/* Vertical line and bullet */}
                      <div className="flex flex-col items-center shrink-0 w-3">
                        <span
                          className={cn(
                            "size-3 rounded-full mt-1 shrink-0",
                            tone?.dot || "bg-muted-foreground",
                          )}
                        />
                        {!isLast ? (
                          <span className="w-px bg-border flex-1 -mb-5 mt-1" />
                        ) : null}
                      </div>

                      {/* Content */}
                      <div className="flex flex-col gap-0.5 pb-5 min-w-0 flex-1">
                        <span className="text-[13.5px] font-semibold text-foreground">
                          {title}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatFullDateTime(entry.occurredAt, i18n.language)}
                          {entry.actorRole
                            ? ` · ${t("recruiterApplications.historyDialog.byActor", {
                                actor: entry.actorRole,
                              })}`
                            : ""}
                        </span>
                        {entry.messageToCandidate ? (
                          <span className="text-xs text-foreground/80 mt-0.5">
                            {t(
                              "recruiterApplications.historyDialog.messageToCandidate",
                              {
                                message: entry.messageToCandidate,
                              },
                            )}
                          </span>
                        ) : null}
                        {entry.note ? (
                          <span className="text-xs text-muted-foreground italic mt-0.5">
                            {t("recruiterApplications.historyDialog.reviewerNote", {
                              note: entry.note,
                            })}
                          </span>
                        ) : null}
                        {entry.rejectionReason ? (
                          <span className="text-xs text-destructive mt-0.5">
                            {t(
                              "recruiterApplications.historyDialog.rejectionReason",
                              {
                                reason: entry.rejectionReason,
                              },
                            )}
                          </span>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        ) : (
          /* Tab 2: Candidate History at Company */
          <div className="max-h-[calc(100vh-260px)] overflow-y-auto px-6 py-5">
            {companyHistoryQuery.isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : companyHistoryQuery.isError ? (
              <p className="text-xs text-destructive py-4">
                {t("recruiterApplications.statusDialog.genericError")}
              </p>
            ) : companyItems.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4">
                {t("recruiterApplications.historyDialog.noOtherApplications")}
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {companyHistory?.isFirstTimeApplicant && companyItems.length <= 1 ? (
                  <div className="rounded-xl border border-border bg-muted/40 p-3.5 text-xs text-muted-foreground">
                    {companyName
                      ? t(
                          "recruiterApplications.historyDialog.firstTimeApplicant",
                          {
                            company: companyName,
                          },
                        )
                      : t(
                          "recruiterApplications.historyDialog.noOtherApplications",
                        )}
                  </div>
                ) : null}

                {companyItems.map((item) => {
                  const tone = STATUS_TONES[item.status];
                  return (
                    <div
                      className={cn(
                        "flex items-start justify-between rounded-xl border border-border p-3.5 gap-3",
                        item.isCurrentApplication && "bg-muted/20 border-primary/30",
                      )}
                      key={item.id}
                    >
                      <div className="flex flex-col gap-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground truncate">
                            {item.job.title}
                          </span>
                          {item.isCurrentApplication ? (
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                              Current
                            </span>
                          ) : null}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {t("recruiterApplications.detail.appliedOn", {
                            date: formatFullDateTime(
                              item.submittedAt,
                              i18n.language,
                            ),
                          })}
                        </span>
                        {item.rejectionReason ? (
                          <span className="text-xs text-destructive">
                            {t(
                              "recruiterApplications.historyDialog.rejectionReason",
                              {
                                reason: item.rejectionReason,
                              },
                            )}
                          </span>
                        ) : null}
                      </div>

                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold shrink-0",
                          tone.badge,
                        )}
                      >
                        <span className={cn("size-1.5 rounded-full", tone.dot)} />
                        {t(`applications.status.${item.status}`)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Footer Footnote */}
        <p className="border-t border-border px-6 py-3.5 text-xs text-muted-foreground leading-relaxed">
          {t("recruiterApplications.historyDialog.footnote")}
        </p>
      </DialogContent>
    </Dialog>
  );
}
