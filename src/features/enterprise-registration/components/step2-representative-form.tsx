import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";

import { FormField } from "@/components/common/form-field";
import { InlineBanner } from "@/components/common/inline-banner";
import { SectionCard } from "@/components/common/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AUTH_ACTION_CLASS } from "@/features/auth/auth-status.constants";
import {
  step2RepresentativeSchema,
  type Step2RepresentativeFormData,
} from "@/features/enterprise-registration/enterprise-registration.schemas";
import { useRegistrationWizard } from "@/features/enterprise-registration/context/registration-wizard-context";

import { ConsentCheckbox } from "./consent-checkbox";
import { StepActions } from "./step-actions";

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

  const rawRep = draft?.representative || {
    full_name: "",
    phone: "",
    position: "",
  };

  const defaultValues: Step2RepresentativeFormData = {
    full_name: rawRep.full_name || "",
    phone: rawRep.phone || "",
    position: rawRep.position || "",
    is_legal_representative: isLegalRepresentative,
  };

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Step2RepresentativeFormData>({
    resolver: zodResolver(step2RepresentativeSchema),
    defaultValues,
  });

  const isLegalRep = useWatch({ control, name: "is_legal_representative" });

  const onSubmit = async (data: Step2RepresentativeFormData) => {
    setServerError(null);
    try {
      setIsLegalRepresentative(data.is_legal_representative);
      await saveDraft({
        representative: {
          full_name: data.full_name,
          phone: data.phone,
          position: data.position || undefined,
        },
        version: draft?.version,
      });
      onNext();
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setServerError(errorObj.message || t("enterpriseRegistration.step2.saveFailed"));
    }
  };

  return (
    <form className="flex flex-col gap-6" noValidate onSubmit={handleSubmit(onSubmit)}>
      <SectionCard description={t("enterpriseRegistration.step2.subtitle")} title={t("enterpriseRegistration.step2.title")}>
        {serverError ? <InlineBanner tone="error">{serverError}</InlineBanner> : null}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField error={errors.full_name?.message} htmlFor="full_name" label={t("enterpriseRegistration.step2.fullName")} required>
            <Input aria-invalid={Boolean(errors.full_name)} id="full_name" placeholder={t("enterpriseRegistration.step2.fullNamePlaceholder")} {...register("full_name")} />
          </FormField>

          <FormField error={errors.phone?.message} hint={t("enterpriseRegistration.step2.phoneHint")} htmlFor="phone" label={t("enterpriseRegistration.step2.phone")} required>
            <Input aria-invalid={Boolean(errors.phone)} id="phone" placeholder={t("enterpriseRegistration.step2.phonePlaceholder")} type="tel" {...register("phone")} />
          </FormField>
        </div>

        <FormField
          error={errors.position?.message}
          hint={t("enterpriseRegistration.step2.positionHint")}
          htmlFor="position"
          label={t("enterpriseRegistration.step2.position")}
          labelAddon={<span className="text-[12.5px] font-normal text-muted-foreground">{t("enterpriseRegistration.common.optional")}</span>}
        >
          <Input id="position" placeholder={t("enterpriseRegistration.step2.positionPlaceholder")} {...register("position")} />
        </FormField>

        <ConsentCheckbox
          hint={t("enterpriseRegistration.step2.legalRepHint")}
          id="is_legal_representative"
          label={t("enterpriseRegistration.step2.legalRep")}
          {...register("is_legal_representative")}
        />

        {!isLegalRep ? (
          <InlineBanner tone="warning">
            <span className="font-semibold">{t("enterpriseRegistration.step2.delegateTitle")}</span> {t("enterpriseRegistration.step2.delegateBody")}
          </InlineBanner>
        ) : null}
      </SectionCard>

      <StepActions backDisabled={isSaving} onBack={onBack}>
        <Button className={AUTH_ACTION_CLASS} disabled={isSaving} shape="xl" type="submit">
          {isSaving ? t("enterpriseRegistration.common.saving") : t("enterpriseRegistration.common.saveContinue")}
          {isSaving ? null : <ArrowRight aria-hidden />}
        </Button>
      </StepActions>
    </form>
  );
}
