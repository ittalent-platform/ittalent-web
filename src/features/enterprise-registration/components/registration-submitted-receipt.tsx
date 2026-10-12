import { CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { KeyValueBox } from "@/components/common/key-value-box";
import { StatusPanel } from "@/components/common/status-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AuthStatusCard } from "@/features/auth/auth-status-card";
import { AUTH_ACTION_CLASS } from "@/features/auth/auth-status.constants";
import { DEFAULT_SLA_DAYS } from "@/features/enterprise-registration/enterprise-registration.constants";
import type { SubmissionReceiptResponse } from "@/features/enterprise-registration/enterprise-registration.types";
import { formatDateTimeIct } from "@/lib/format";

const NEXT_STEP_KEYS = ["next1", "next2", "next3"] as const;

export function RegistrationSubmittedReceipt({
  receipt,
}: {
  receipt: SubmissionReceiptResponse;
}) {
  const { t } = useTranslation();

  return (
    <AuthStatusCard>
      <StatusPanel
        actions={
          <Button asChild className={AUTH_ACTION_CLASS} shape="xl">
            <Link to="/">{t("enterpriseRegistration.receipt.home")}</Link>
          </Button>
        }
        description={t("enterpriseRegistration.receipt.subtitle")}
        icon={CheckCircle2}
        steps={NEXT_STEP_KEYS.map((key) => (
          <span key={key}>
            <strong className="block font-semibold text-foreground">{t(`enterpriseRegistration.receipt.${key}Title`)}</strong>
            {t(`enterpriseRegistration.receipt.${key}Body`)}
          </span>
        ))}
        title={t("enterpriseRegistration.receipt.title")}
        tone="success"
      >
        <KeyValueBox
          rows={[
            { label: t("enterpriseRegistration.receipt.code"), value: <span className="font-mono">{receipt.registration_code}</span> },
            { label: t("enterpriseRegistration.receipt.status"), value: <Badge variant="warning">{t("enterpriseRegistration.receipt.underReview")}</Badge> },
            { label: t("enterpriseRegistration.receipt.submittedAt"), value: receipt.submitted_at ? formatDateTimeIct(receipt.submitted_at) : t("enterpriseRegistration.receipt.justNow") },
            { label: t("enterpriseRegistration.receipt.turnaround"), value: t("enterpriseRegistration.receipt.days", { count: receipt.estimated_sla_days || DEFAULT_SLA_DAYS }) },
          ]}
        />
      </StatusPanel>
    </AuthStatusCard>
  );
}
