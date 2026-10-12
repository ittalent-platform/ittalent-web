import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";

import { InlineBanner } from "@/components/common/inline-banner";
import { SectionCard } from "@/components/common/section-card";
import { Button } from "@/components/ui/button";
import { DEFAULT_COUNTRY } from "@/features/enterprise-registration/enterprise-registration.constants";
import type { SubmissionReceiptResponse } from "@/features/enterprise-registration/enterprise-registration.types";
import {
  companySizeOptions,
  step4ReviewSubmitSchema,
  type Step4ReviewSubmitFormData,
} from "@/features/enterprise-registration/enterprise-registration.schemas";
import { useRegistrationWizard } from "@/features/enterprise-registration/context/registration-wizard-context";
import { useSubmitRegistrationMutation } from "@/features/enterprise-registration/enterprise-registration.queries";

import { formatFileSize } from "./format-file-size";
import { WIZARD_BUTTON_CLASS, WIZARD_PRIMARY_BUTTON_CLASS } from "./wizard-actions";

const STRONG = { strong: <strong className="text-foreground" /> };

/** A review card: title with an Edit link that jumps back to its step, then a two-column grid of label / value pairs. */
function ReviewCard({ children, onEdit, title }: { children: ReactNode; onEdit: () => void; title: string }) {
  const { t } = useTranslation();
  return (
    <SectionCard
      actions={
        <Button className="font-semibold text-fg-link hover:text-fg-link" onClick={onEdit} size="sm" type="button" variant="ghost">
          {t("enterpriseRegistration.common.edit")}
        </Button>
      }
      className="p-6 sm:p-7"
      title={title}
    >
      <dl className="m-0 grid grid-cols-1 gap-5 text-sm sm:grid-cols-2">{children}</dl>
    </SectionCard>
  );
}

function ReviewField({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="m-0 mt-1 font-semibold text-foreground">{children}</dd>
    </div>
  );
}

export function Step4ReviewForm({
  onBack,
  onSubmitSuccess,
}: {
  onBack: () => void;
  onSubmitSuccess: (receipt: SubmissionReceiptResponse) => void;
}) {
  const { t } = useTranslation();
  const {
    registrationId,
    draft,
    setCurrentStep,
    isLegalRepresentative,
    saveDraft,
    isSaving,
  } = useRegistrationWizard();
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
  const rep = draft?.representative;
  const documents = draft?.legal_documents || [];
  const empty = t("enterpriseRegistration.common.empty");

  const legalName = (company.legal_name as string) || "";
  const tradingName = (company.name as string) || "";
  const bLicenseDoc = documents.find((d) => d.document_type === "business_license");
  const loaDoc = documents.find((d) => d.document_type === "power_of_attorney");
  const pdfLine = (doc?: { file_size?: number }) => t("enterpriseRegistration.step4.pdfSize", { size: formatFileSize(doc?.file_size) ?? empty });

  const onSubmit = async () => {
    setServerError(null);

    if (!registrationId) {
      setServerError(t("enterpriseRegistration.step4.missingId"));
      return;
    }

    if (!draft || !rep) {
      setServerError(t("enterpriseRegistration.step4.notLoaded"));
      return;
    }

    try {
      const receipt = await submitMutation.mutateAsync({
        id: registrationId,
        body: {
          representative: {
            full_name: rep.full_name || "",
            phone: rep.phone || "",
            position: rep.position || undefined,
          },
          company_data: {
            name: tradingName,
            legal_name: legalName || undefined,
            tax_code: (company.tax_code as string) || "",
            registration_number: (company.registration_number as string) || undefined,
            website: (company.website as string) || undefined,
            industry: (company.industry as string) || "",
            company_size: company.company_size as (typeof companySizeOptions)[number],
            address: {
              street: (address.street as string) || "",
              city: (address.city as string) || "",
              country: (address.country as string) || DEFAULT_COUNTRY,
            },
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

      onSubmitSuccess(receipt);
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setServerError(errorObj.message || t("enterpriseRegistration.step4.submitFailed"));
    }
  };

  return (
    <form className="flex flex-col gap-6" noValidate onSubmit={handleSubmit(onSubmit)}>
      <ReviewCard onEdit={() => setCurrentStep("step1")} title={t("enterpriseRegistration.step4.company")}>
        <ReviewField label={t("enterpriseRegistration.step4.legalName")}>
          {legalName || empty}
          {tradingName && tradingName !== legalName ? <span className="block text-xs font-normal text-muted-foreground">{tradingName}</span> : null}
        </ReviewField>
        <ReviewField label={t("enterpriseRegistration.step4.taxCode")}>{(company.tax_code as string) || empty}</ReviewField>
        <ReviewField label={t("enterpriseRegistration.step4.corporateEmail")}>{draft?.corporate_email || empty}</ReviewField>
        <ReviewField label={t("enterpriseRegistration.step4.address")}>{(address.street as string) || empty}</ReviewField>
      </ReviewCard>

      <ReviewCard onEdit={() => setCurrentStep("step2")} title={t("enterpriseRegistration.step4.representative")}>
        <ReviewField label={t("enterpriseRegistration.step4.name")}>{rep?.full_name || empty}</ReviewField>
        <ReviewField label={t("enterpriseRegistration.step4.workEmail")}>
          <span className="flex items-center gap-2">
            {draft?.corporate_email || empty}
            <span className="inline-flex items-center gap-1 rounded-full bg-(--status-success-bg) px-2 py-0.5 text-[11px] font-semibold text-(--status-success-fg)">
              <Check aria-hidden className="size-3" strokeWidth={2.5} /> {t("enterpriseRegistration.step4.verified")}
            </span>
          </span>
        </ReviewField>
        <ReviewField label={t("enterpriseRegistration.step4.position")}>{rep?.position || empty}</ReviewField>
        <ReviewField label={t("enterpriseRegistration.step4.legalRep")}>
          {t(isLegalRepresentative ? "enterpriseRegistration.step4.legalRepYes" : "enterpriseRegistration.step4.legalRepNo")}
        </ReviewField>
      </ReviewCard>

      <ReviewCard onEdit={() => setCurrentStep("step3")} title={t("enterpriseRegistration.step4.documents")}>
        <ReviewField label={t("enterpriseRegistration.step4.brc")}>
          {bLicenseDoc ? (
            <>
              <span className="block">{bLicenseDoc.file_name}</span>
              <span className="text-xs font-normal text-muted-foreground">{pdfLine(bLicenseDoc)}</span>
            </>
          ) : (
            empty
          )}
        </ReviewField>
        <ReviewField label={t("enterpriseRegistration.step4.loa")}>
          {loaDoc ? pdfLine(loaDoc) : isLegalRepresentative ? t("enterpriseRegistration.step4.loaNotRequired") : empty}
        </ReviewField>
      </ReviewCard>

      <div className="rounded-xl border border-border bg-card p-5">
        <p className="m-0 text-[13.5px] leading-relaxed text-muted-foreground">
          <Trans components={STRONG} i18nKey="enterpriseRegistration.step4.reservation" />
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-start gap-3">
          <input className="mt-1 size-4 cursor-pointer accent-(--primary)" id="agreed_to_terms" type="checkbox" {...register("agreed_to_terms")} />
          <label className="cursor-pointer select-none text-[13px] leading-relaxed text-foreground" htmlFor="agreed_to_terms">
            {t("enterpriseRegistration.step4.certify")}
          </label>
        </div>
        {errors.agreed_to_terms ? <p className="m-0 mt-2 text-xs font-medium text-destructive">{errors.agreed_to_terms.message}</p> : null}
      </div>

      {serverError ? <InlineBanner tone="error">{serverError}</InlineBanner> : null}

      <div className="flex items-center justify-between pt-1">
        <Button className={WIZARD_BUTTON_CLASS} onClick={onBack} type="button" variant="outline">
          {t("enterpriseRegistration.common.back")}
        </Button>
        <div className="flex items-center gap-3">
          <Button
            className={WIZARD_BUTTON_CLASS}
            disabled={isSaving || submitMutation.isPending}
            onClick={() => void (draft && saveDraft({ version: draft.version }))}
            type="button"
            variant="outline"
          >
            {t("enterpriseRegistration.common.saveDraft")}
          </Button>
          <Button className={`${WIZARD_PRIMARY_BUTTON_CLASS} min-w-[180px] px-7`} disabled={submitMutation.isPending} type="submit">
            {submitMutation.isPending ? t("enterpriseRegistration.step4.submitting") : t("enterpriseRegistration.step4.submit")}
          </Button>
        </div>
      </div>
    </form>
  );
}
