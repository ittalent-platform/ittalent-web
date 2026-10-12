import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ExternalLink, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";

import { DetailRow } from "@/components/common/detail-row";
import { InlineBanner } from "@/components/common/inline-banner";
import { SectionCard } from "@/components/common/section-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AUTH_ACTION_CLASS } from "@/features/auth/auth-status.constants";
import {
  DEFAULT_COMPANY_SIZE,
  DEFAULT_COUNTRY,
  INDUSTRY_OPTIONS,
} from "@/features/enterprise-registration/enterprise-registration.constants";
import type { SubmissionReceiptResponse } from "@/features/enterprise-registration/enterprise-registration.types";
import {
  companySizeOptions,
  step4ReviewSubmitSchema,
  type Step4ReviewSubmitFormData,
} from "@/features/enterprise-registration/enterprise-registration.schemas";
import { useRegistrationWizard } from "@/features/enterprise-registration/context/registration-wizard-context";
import { useSubmitRegistrationMutation } from "@/features/enterprise-registration/enterprise-registration.queries";

import { ConsentCheckbox } from "./consent-checkbox";
import { StepActions } from "./step-actions";

export function Step4ReviewForm({
  onBack,
  onSubmitSuccess,
}: {
  onBack: () => void;
  onSubmitSuccess: (receipt: SubmissionReceiptResponse) => void;
}) {
  const { t } = useTranslation();
  const { registrationId, draft, isLegalRepresentative } =
    useRegistrationWizard();
  const [serverError, setServerError] = useState<string | null>(null);

  const submitMutation = useSubmitRegistrationMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Step4ReviewSubmitFormData>({
    resolver: zodResolver(step4ReviewSubmitSchema),
    defaultValues: {
      agreed_to_terms: undefined,
    },
  });

  const company = (draft?.company_data || {}) as Record<string, unknown>;
  const address = (company.address || {}) as Record<string, unknown>;
  const rep = draft?.representative || {
    full_name: "",
    phone: "",
    position: "",
  };
  const documents = draft?.legal_documents || [];
  const empty = t("enterpriseRegistration.common.empty");
  const industry = INDUSTRY_OPTIONS.find((option) => option.value === company.industry);

  const onSubmit = async () => {
    setServerError(null);

    if (!registrationId) {
      setServerError(t("enterpriseRegistration.step4.missingId"));
      return;
    }

    if (!draft) {
      setServerError(t("enterpriseRegistration.step4.notLoaded"));
      return;
    }

    try {
      const receipt = await submitMutation.mutateAsync({
        id: registrationId,
        body: {
          representative: {
            full_name: rep.full_name,
            phone: rep.phone,
            position: rep.position || undefined,
          },
          company_data: {
            name: (company.name as string) || "",
            legal_name: (company.legal_name as string) || undefined,
            tax_code: (company.tax_code as string) || "",
            registration_number: (company.registration_number as string) || undefined,
            website: (company.website as string) || undefined,
            industry: (company.industry as string) || "",
            company_size:
              (company.company_size as (typeof companySizeOptions)[number]) ||
              DEFAULT_COMPANY_SIZE,
            address: {
              street: (address.street as string) || "",
              city: (address.city as string) || "",
              district: (address.district as string) || undefined,
              state_province: (address.state_province as string) || undefined,
              country: (address.country as string) || DEFAULT_COUNTRY,
              postal_code: (address.postal_code as string) || undefined,
            },
            short_description: (company.short_description as string) || undefined,
            description: (company.description as string) || undefined,
          },
          legal_documents: documents.map((doc) => ({
            document_type: doc.document_type,
            file_name: doc.file_name,
            file_url: doc.file_url,
            file_size: doc.file_size,
          })),
          version: draft.version,
        },
      });

      if (receipt) {
        onSubmitSuccess(receipt);
      }
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setServerError(errorObj.message || t("enterpriseRegistration.step4.submitFailed"));
    }
  };

  const row = (label: string, value: React.ReactNode) => <DetailRow label={label} layout="grid" value={value} />;

  return (
    <div className="flex flex-col gap-[18px]">
      <SectionCard description={t("enterpriseRegistration.step4.subtitle")} title={t("enterpriseRegistration.step4.title")}>
        {serverError ? <InlineBanner tone="error">{serverError}</InlineBanner> : null}
      </SectionCard>

      <SectionCard title={t("enterpriseRegistration.step4.company")}>
        <dl className="m-0">
          {row(t("enterpriseRegistration.step4.tradingName"), String(company.name || empty))}
          {row(t("enterpriseRegistration.step4.legalName"), String(company.legal_name || empty))}
          {row(t("enterpriseRegistration.step4.taxCode"), <span className="font-mono">{String(company.tax_code || empty)}</span>)}
          {row(t("enterpriseRegistration.step4.industry"), industry ? t(`enterpriseRegistration.industries.${industry.key}`) : String(company.industry || empty))}
          {row(t("enterpriseRegistration.step4.scale"), company.company_size ? t("enterpriseRegistration.step1.sizeOption", { size: String(company.company_size) }) : empty)}
          {row(t("enterpriseRegistration.step4.website"), String(company.website || empty))}
          {row(t("enterpriseRegistration.step4.hq"), [address.street, address.city, address.country].filter(Boolean).join(", ") || empty)}
        </dl>
      </SectionCard>

      <SectionCard title={t("enterpriseRegistration.step4.representative")}>
        <dl className="m-0">
          {row(t("enterpriseRegistration.step4.fullName"), rep.full_name || empty)}
          {row(t("enterpriseRegistration.step4.email"), draft?.corporate_email || empty)}
          {row(t("enterpriseRegistration.step4.phone"), rep.phone || empty)}
          {row(t("enterpriseRegistration.step4.position"), rep.position || empty)}
          {row(t("enterpriseRegistration.step4.status"), t(isLegalRepresentative ? "enterpriseRegistration.step4.legalRep" : "enterpriseRegistration.step4.delegate"))}
        </dl>
      </SectionCard>

      <SectionCard title={t("enterpriseRegistration.step4.documents", { count: documents.length })}>
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {documents.map((doc, idx) => (
            <li className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3.5 py-2.5 text-xs" key={`${doc.file_name}-${idx}`}>
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="truncate font-semibold text-foreground">{doc.file_name}</span>
                <Badge>{t(`enterpriseRegistration.documentTypes.${doc.document_type}`)}</Badge>
              </div>
              {doc.file_url ? (
                <a className="inline-flex shrink-0 items-center gap-1 text-[12px] font-semibold text-fg-link hover:underline" href={doc.file_url} rel="noreferrer" target="_blank">
                  {t("enterpriseRegistration.step4.view")}
                  <ExternalLink aria-hidden className="size-3" />
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard>
        <form className="flex flex-col gap-6" noValidate onSubmit={handleSubmit(onSubmit)}>
          <ConsentCheckbox
            error={errors.agreed_to_terms?.message}
            hint={t("enterpriseRegistration.step4.certifyBody")}
            id="agreed_to_terms"
            label={t("enterpriseRegistration.step4.certify")}
            {...register("agreed_to_terms")}
          />

          <StepActions backDisabled={submitMutation.isPending} onBack={onBack}>
            <Button className={AUTH_ACTION_CLASS} disabled={submitMutation.isPending} shape="xl" type="submit">
              <ShieldCheck aria-hidden />
              {submitMutation.isPending ? t("enterpriseRegistration.step4.submitting") : t("enterpriseRegistration.step4.submit")}
            </Button>
          </StepActions>
        </form>
      </SectionCard>
    </div>
  );
}
