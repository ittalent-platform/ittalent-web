import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";

import { FormField } from "@/components/common/form-field";
import { InlineBanner } from "@/components/common/inline-banner";
import { SectionCard } from "@/components/common/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { START_PHONE_PLACEHOLDER } from "@/features/enterprise-registration/enterprise-registration.constants";
import {
  step2RepresentativeSchema,
  type Step2RepresentativeFormData,
} from "@/features/enterprise-registration/enterprise-registration.schemas";
import { useRegistrationWizard } from "@/features/enterprise-registration/context/registration-wizard-context";
import { cn } from "@/lib/utils";

import { WIZARD_PRIMARY_BUTTON_CLASS, WizardActions } from "./wizard-actions";

/** One of the two radio cards ("Yes" / "No") that answer whether the user is the legal representative. */
function LegalChoice({ checked, description, label, onSelect }: { checked: boolean; description: string; label: string; onSelect: () => void }) {
  return (
    <button
      aria-checked={checked}
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-left transition-all",
        checked ? "border-primary bg-primary/5 shadow-2xs" : "border-border bg-card hover:bg-muted/40",
      )}
      onClick={onSelect}
      role="radio"
      type="button"
    >
      <div className={cn("mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border", checked ? "border-primary bg-primary text-primary-foreground" : "border-border")}>
        {checked ? <div className="size-1.5 rounded-full bg-primary-foreground" /> : null}
      </div>
      <div className="text-xs">
        <p className="m-0 text-sm font-semibold text-foreground">{label}</p>
        <p className="m-0 mt-0.5 leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </button>
  );
}

export function Step2RepresentativeForm({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const { t } = useTranslation();
  const {
    draft,
    saveDraft,
    isSaving,
    isLegalRepresentative,
    setIsLegalRepresentative,
  } = useRegistrationWizard();
  const [serverError, setServerError] = useState<string | null>(null);

  const rawRep = draft?.representative;
  const [isLegalRep, setIsLegalRep] = useState<boolean>(isLegalRepresentative);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<Step2RepresentativeFormData>({
    resolver: zodResolver(step2RepresentativeSchema),
    defaultValues: {
      full_name: rawRep?.full_name || "",
      // The start screen has no phone field, so the API got a placeholder there; step 2 asks for the real one.
      phone: rawRep?.phone && rawRep.phone !== START_PHONE_PLACEHOLDER ? rawRep.phone : "",
      position: rawRep?.position || "",
      is_legal_representative: isLegalRepresentative,
      legal_representative_name: "",
    },
  });

  const toRepresentative = (values: Step2RepresentativeFormData) => ({
    full_name: values.full_name,
    phone: values.phone,
    position: values.position || undefined,
  });

  const onSubmit = async (data: Step2RepresentativeFormData) => {
    setServerError(null);
    try {
      setIsLegalRepresentative(isLegalRep);
      await saveDraft({ representative: toRepresentative(data), version: draft?.version });
      onNext();
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setServerError(errorObj.message || t("enterpriseRegistration.step2.saveFailed"));
    }
  };

  const onSaveDraft = async () => {
    setServerError(null);
    try {
      setIsLegalRepresentative(isLegalRep);
      await saveDraft({ representative: toRepresentative(getValues()), version: draft?.version });
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setServerError(errorObj.message || t("enterpriseRegistration.step2.saveFailed"));
    }
  };

  return (
    <form className="flex flex-col gap-5" noValidate onSubmit={handleSubmit(onSubmit)}>
      <SectionCard className="gap-5 p-6 sm:p-7" description={t("enterpriseRegistration.step2.subtitle")} title={t("enterpriseRegistration.step2.title")}>
        {serverError ? <InlineBanner tone="error">{serverError}</InlineBanner> : null}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <FormField error={errors.full_name?.message} htmlFor="full_name" label={t("enterpriseRegistration.step2.fullName")} required>
            <Input aria-invalid={Boolean(errors.full_name)} id="full_name" placeholder={t("enterpriseRegistration.step2.fullNamePlaceholder")} {...register("full_name")} />
          </FormField>

          <FormField hint={t("enterpriseRegistration.step2.workEmailHint")} htmlFor="verified_work_email" label={t("enterpriseRegistration.step2.workEmail")} required>
            <div className="relative flex items-center">
              <Input className="bg-muted/30 pr-28" id="verified_work_email" readOnly type="email" value={draft?.corporate_email ?? ""} />
              <span className="absolute right-2.5 inline-flex items-center gap-1 rounded-full bg-(--status-success-bg) px-2.5 py-0.5 text-xs font-medium text-(--status-success-fg)">
                <Check aria-hidden className="size-3" strokeWidth={2.5} /> {t("enterpriseRegistration.step2.verified")}
              </span>
            </div>
          </FormField>

          <FormField error={errors.position?.message} htmlFor="position" label={t("enterpriseRegistration.step2.position")} required>
            <Input aria-invalid={Boolean(errors.position)} id="position" placeholder={t("enterpriseRegistration.step2.positionPlaceholder")} {...register("position")} />
          </FormField>

          <FormField error={errors.phone?.message} htmlFor="phone" label={t("enterpriseRegistration.step2.phone")} required>
            <Input aria-invalid={Boolean(errors.phone)} id="phone" placeholder={t("enterpriseRegistration.step2.phonePlaceholder")} type="tel" {...register("phone")} />
          </FormField>
        </div>

        <div className="flex flex-col gap-2 pt-2" role="radiogroup" aria-labelledby="legal-rep-question">
          <span className="text-xs font-semibold tracking-wide text-foreground" id="legal-rep-question">
            {t("enterpriseRegistration.step2.legalQuestion")} <span className="text-destructive">*</span>
          </span>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <LegalChoice checked={isLegalRep} description={t("enterpriseRegistration.step2.yesHint")} label={t("enterpriseRegistration.step2.yes")} onSelect={() => setIsLegalRep(true)} />
            <LegalChoice checked={!isLegalRep} description={t("enterpriseRegistration.step2.noHint")} label={t("enterpriseRegistration.step2.no")} onSelect={() => setIsLegalRep(false)} />
          </div>
        </div>

        {!isLegalRep ? (
          <FormField
            error={errors.legal_representative_name?.message}
            hint={t("enterpriseRegistration.step2.legalNameHint")}
            htmlFor="legal_representative_name"
            label={t("enterpriseRegistration.step2.legalName")}
            required
          >
            <Input id="legal_representative_name" placeholder={t("enterpriseRegistration.step2.legalNamePlaceholder")} {...register("legal_representative_name")} />
          </FormField>
        ) : null}
      </SectionCard>

      <WizardActions onBack={onBack} onSaveDraft={() => void onSaveDraft()} saveDisabled={isSaving}>
        <Button className={WIZARD_PRIMARY_BUTTON_CLASS} disabled={isSaving} type="submit">
          {isSaving ? t("enterpriseRegistration.common.saving") : t("enterpriseRegistration.common.continue")}
        </Button>
      </WizardActions>
    </form>
  );
}
