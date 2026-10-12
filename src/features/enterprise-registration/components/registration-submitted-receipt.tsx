import { Check, Clock } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";

import { Callout } from "@/components/common/callout";
import { Badge } from "@/components/ui/badge";
import { DEFAULT_SLA_DAYS } from "@/features/enterprise-registration/enterprise-registration.constants";
import type { EnterpriseRegistrationDetail, SubmissionReceiptResponse } from "@/features/enterprise-registration/enterprise-registration.types";
import { formatDate, formatDateTimeIct } from "@/lib/format";
import { cn } from "@/lib/utils";

import { WizardHeader } from "./wizard-header";

const STRONG = { strong: <strong className="font-semibold text-foreground" /> };
const CARD_CLASS = "rounded-2xl border border-border bg-card p-6 shadow-xs sm:p-7";

type ProgressState = "done" | "current" | "upcoming";

/** One row of the review timeline: a dot (green tick, Ember ring or empty) joined to the next row by a line. */
function ProgressRow({ connector, note, state, title }: { connector?: boolean; note?: string; state: ProgressState; title: string }) {
  return (
    <li className="relative flex items-start gap-4">
      {connector ? <div aria-hidden="true" className={cn("absolute bottom-[-24px] left-[11px] top-6 w-0.5", state === "done" ? "bg-(--status-success-fg)" : "bg-border")} /> : null}
      <div
        className={cn(
          "relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full",
          state === "done" && "bg-(--status-success-fg) text-white",
          state === "current" && "bg-primary",
          state === "upcoming" && "border-2 border-border bg-background",
        )}
      >
        {state === "done" ? <Check aria-hidden className="size-3.5" strokeWidth={2.5} /> : null}
        {state === "current" ? <div className="size-2 rounded-full bg-card" /> : null}
      </div>
      <div>
        <p className={cn("m-0 text-sm font-bold", state === "upcoming" ? "text-muted-foreground" : "text-foreground")}>{title}</p>
        {note ? <p className="m-0 mt-0.5 text-xs text-muted-foreground">{note}</p> : null}
      </div>
    </li>
  );
}

export function RegistrationSubmittedReceipt({
  receipt,
  draft,
}: {
  receipt: SubmissionReceiptResponse;
  draft?: EnterpriseRegistrationDetail | null;
}) {
  const { t } = useTranslation();
  const company = draft?.company_data;
  const companyName = String(company?.name || company?.legal_name || receipt.registration_code);
  const email = draft?.corporate_email;
  const submittedAt = receipt.submitted_at ? formatDateTimeIct(receipt.submitted_at) : t("enterpriseRegistration.common.empty");
  const documentCount = draft?.legal_documents?.length ?? 0;
  const empty = t("enterpriseRegistration.common.empty");

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground">
      <WizardHeader corporateEmail={email} representativeName={draft?.representative?.full_name} />

      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-[1040px]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="m-0 text-2xl font-bold tracking-tight text-foreground sm:text-[28px]">{companyName}</h1>
            <Badge variant="warning">{t("enterpriseRegistration.status.pending")}</Badge>
          </div>

          <p className="m-0 mt-1 text-[13px] text-muted-foreground">
            {t("enterpriseRegistration.status.meta", { code: receipt.registration_code, version: receipt.version, date: submittedAt })}
          </p>

          <Callout className="mt-6 p-5 sm:p-6" icon={Clock} title={t("enterpriseRegistration.status.noticeTitle")} tone="info">
            <Trans
              components={STRONG}
              i18nKey="enterpriseRegistration.status.noticeBody"
              values={{ count: receipt.estimated_sla_days || DEFAULT_SLA_DAYS, email: email ?? empty }}
            />
          </Callout>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className={cn(CARD_CLASS, "lg:col-span-7")}>
              <h3 className="m-0 text-base font-bold text-foreground">{t("enterpriseRegistration.status.progress")}</h3>
              <ol className="m-0 mt-6 flex list-none flex-col gap-6 p-0">
                <ProgressRow connector note={draft?.createdAt ? formatDate(draft.createdAt) : undefined} state="done" title={t("enterpriseRegistration.status.emailConfirmed")} />
                <ProgressRow
                  connector
                  note={t("enterpriseRegistration.status.submittedAt", { date: submittedAt, version: receipt.version })}
                  state="done"
                  title={t("enterpriseRegistration.status.submitted")}
                />
                <ProgressRow connector note={t("enterpriseRegistration.status.reviewNote")} state="current" title={t("enterpriseRegistration.status.review")} />
                <ProgressRow note={t("enterpriseRegistration.status.acceptNote")} state="upcoming" title={t("enterpriseRegistration.status.accept")} />
              </ol>
            </div>

            <div className={cn(CARD_CLASS, "lg:col-span-5")}>
              <h3 className="m-0 text-base font-bold text-foreground">{t("enterpriseRegistration.status.summary")}</h3>
              <dl className="m-0 mt-6 flex flex-col gap-5 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">{t("enterpriseRegistration.status.taxCode")}</dt>
                  <dd className="m-0 mt-1 font-bold tracking-wide text-foreground">{String(company?.tax_code || empty)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">{t("enterpriseRegistration.status.corporateEmail")}</dt>
                  <dd className="m-0 mt-1 font-bold text-foreground">{email || empty}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">{t("enterpriseRegistration.status.documents")}</dt>
                  <dd className="m-0 mt-1 font-bold text-foreground">{t("enterpriseRegistration.status.pdfs", { count: documentCount })}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
