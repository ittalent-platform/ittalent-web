import { Check } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";

import { Callout } from "@/components/common/callout";
import { Badge } from "@/components/ui/badge";
import type { EnterpriseRegistrationDetail, WizardStepKey } from "@/features/enterprise-registration/enterprise-registration.types";
import { formatTimeAgo } from "@/lib/format";

const STRONG = { strong: <strong className="font-semibold text-foreground" /> };

/** Page title with its draft status and, on the first step, the "work email confirmed" notice. */
export function WizardTitle({ currentStep, draft }: { currentStep: WizardStepKey; draft?: EnterpriseRegistrationDetail | null }) {
  const { t, i18n } = useTranslation();
  const company = draft?.company_data?.name || draft?.company_data?.legal_name;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="m-0 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {company ? t("enterpriseRegistration.header.title", { company }) : t("enterpriseRegistration.header.titleFallback")}
          </h1>
          {draft?.updatedAt ? (
            <p className="m-0 mt-1 text-sm text-muted-foreground">
              {t("enterpriseRegistration.header.saved", { time: formatTimeAgo(draft.updatedAt, i18n.language) })}
            </p>
          ) : null}
        </div>
        <Badge>{t("enterpriseRegistration.header.draftBadge")}</Badge>
      </div>

      {currentStep === "step1" && draft?.corporate_email ? (
        <Callout icon={Check} title={t("enterpriseRegistration.header.confirmedTitle")} tone="success">
          <Trans components={STRONG} i18nKey="enterpriseRegistration.header.confirmedBody" values={{ email: draft.corporate_email }} />
        </Callout>
      ) : null}
    </div>
  );
}
