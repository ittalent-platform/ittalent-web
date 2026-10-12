import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";

import { FormField } from "@/components/common/form-field";
import { InlineBanner } from "@/components/common/inline-banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthFormHeader, AuthStatusCard } from "@/features/auth/auth-status-card";
import { AUTH_FULL_ACTION_CLASS } from "@/features/auth/auth-status.constants";
import {
  startRegistrationSchema,
  type StartRegistrationFormData,
} from "@/features/enterprise-registration/enterprise-registration.schemas";
import { useStartRegistrationMutation } from "@/features/enterprise-registration/enterprise-registration.queries";

export function StartRegistrationForm({
  onSuccess,
  onContinueLaterClick,
}: {
  onSuccess: (values: StartRegistrationFormData) => void;
  onContinueLaterClick: () => void;
}) {
  const { t } = useTranslation();
  const [serverError, setServerError] = useState<string | null>(null);

  const startMutation = useStartRegistrationMutation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<StartRegistrationFormData>({
    resolver: zodResolver(startRegistrationSchema),
    defaultValues: {
      representative_name: "",
      corporate_email: "",
      representative_phone: "",
      representative_position: "",
    },
  });

  const onSubmit = async (data: StartRegistrationFormData) => {
    setServerError(null);
    try {
      await startMutation.mutateAsync({
        representative_name: data.representative_name,
        corporate_email: data.corporate_email,
        representative_phone: data.representative_phone,
        representative_position: data.representative_position || undefined,
      });
      onSuccess(data);
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setServerError(errorObj.message || t("enterpriseRegistration.start.failed"));
    }
  };

  const pending = isSubmitting || startMutation.isPending;

  return (
    <AuthStatusCard className="flex flex-col gap-[22px]">
      <AuthFormHeader description={t("enterpriseRegistration.start.subtitle")} title={t("enterpriseRegistration.start.title")} />

      {serverError ? <InlineBanner tone="error">{serverError}</InlineBanner> : null}

      <form className="flex flex-col gap-[22px]" noValidate onSubmit={handleSubmit(onSubmit)}>
        <FormField error={errors.representative_name?.message} htmlFor="representative_name" label={t("enterpriseRegistration.start.name")} required>
          <Input aria-invalid={Boolean(errors.representative_name)} id="representative_name" placeholder={t("enterpriseRegistration.start.namePlaceholder")} {...register("representative_name")} />
        </FormField>

        <FormField
          error={errors.corporate_email?.message}
          hint={t("enterpriseRegistration.start.emailHint")}
          htmlFor="corporate_email"
          label={t("enterpriseRegistration.start.email")}
          required
        >
          <Input aria-invalid={Boolean(errors.corporate_email)} id="corporate_email" placeholder={t("enterpriseRegistration.start.emailPlaceholder")} type="email" {...register("corporate_email")} />
        </FormField>

        <FormField error={errors.representative_phone?.message} htmlFor="representative_phone" label={t("enterpriseRegistration.start.phone")} required>
          <Input aria-invalid={Boolean(errors.representative_phone)} id="representative_phone" placeholder={t("enterpriseRegistration.start.phonePlaceholder")} type="tel" {...register("representative_phone")} />
        </FormField>

        <FormField
          error={errors.representative_position?.message}
          htmlFor="representative_position"
          label={t("enterpriseRegistration.start.position")}
          labelAddon={<span className="text-[12.5px] font-normal text-muted-foreground">{t("enterpriseRegistration.common.optional")}</span>}
        >
          <Input id="representative_position" placeholder={t("enterpriseRegistration.start.positionPlaceholder")} {...register("representative_position")} />
        </FormField>

        <Button className={AUTH_FULL_ACTION_CLASS} disabled={pending} shape="xl" type="submit">
          {pending ? t("enterpriseRegistration.start.submitting") : t("enterpriseRegistration.start.submit")}
          {pending ? null : <ArrowRight aria-hidden />}
        </Button>
      </form>

      <button className="cursor-pointer self-center text-[13.5px] font-semibold text-fg-link hover:underline" onClick={onContinueLaterClick} type="button">
        {t("enterpriseRegistration.start.resume")}
      </button>
    </AuthStatusCard>
  );
}
