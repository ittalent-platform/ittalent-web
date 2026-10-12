import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { FormField } from "@/components/common/form-field";
import { InlineBanner } from "@/components/common/inline-banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { validationMessage } from "@/features/auth/auth-validation";
import { corporateEmailSchema } from "@/features/enterprise-registration/enterprise-registration.schemas";
import { REGISTRATION_CONFIG, START_PHONE_PLACEHOLDER } from "@/features/enterprise-registration/enterprise-registration.constants";
import { useStartRegistrationMutation } from "@/features/enterprise-registration/enterprise-registration.queries";

const startIntakeFormSchema = z.object({
  representative_name: z
    .string()
    .trim()
    .min(REGISTRATION_CONFIG.REPRESENTATIVE_NAME_MIN_LENGTH, validationMessage("enterpriseRegistration.validation.repNameMin", { count: REGISTRATION_CONFIG.REPRESENTATIVE_NAME_MIN_LENGTH }))
    .max(REGISTRATION_CONFIG.REPRESENTATIVE_NAME_MAX_LENGTH, validationMessage("enterpriseRegistration.validation.repNameMax", { count: REGISTRATION_CONFIG.REPRESENTATIVE_NAME_MAX_LENGTH })),
  corporate_email: corporateEmailSchema,
});

export type StartIntakeFormData = z.infer<typeof startIntakeFormSchema>;

const LINK_CLASS = "cursor-pointer font-bold text-fg-link hover:underline";

export function StartRegistrationForm({
  onSuccess,
  onContinueLaterClick,
}: {
  onSuccess: (values: StartIntakeFormData) => void;
  onContinueLaterClick: () => void;
}) {
  const { t } = useTranslation();
  const [serverError, setServerError] = useState<string | null>(null);
  const startMutation = useStartRegistrationMutation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<StartIntakeFormData>({
    resolver: zodResolver(startIntakeFormSchema),
    defaultValues: {
      representative_name: "",
      corporate_email: "",
    },
  });

  const onSubmit = async (data: StartIntakeFormData) => {
    setServerError(null);
    try {
      await startMutation.mutateAsync({
        representative_name: data.representative_name,
        corporate_email: data.corporate_email,
        representative_phone: START_PHONE_PLACEHOLDER,
      });
      onSuccess(data);
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setServerError(errorObj.message || t("enterpriseRegistration.start.failed"));
    }
  };

  const pending = isSubmitting || startMutation.isPending;

  return (
    <div className="flex w-full flex-col gap-[22px]">
      <div className="flex flex-col gap-2.5">
        <h1 className="font-heading text-2xl font-semibold tracking-[-0.01em] text-foreground sm:text-[30px]">{t("enterpriseRegistration.start.title")}</h1>
        <p className="text-[14.5px] leading-[1.6] text-muted-foreground">{t("enterpriseRegistration.start.subtitle")}</p>
      </div>

      {serverError ? <InlineBanner tone="error">{serverError}</InlineBanner> : null}

      <form className="flex flex-col gap-[18px]" noValidate onSubmit={handleSubmit(onSubmit)}>
        <FormField error={errors.representative_name?.message} htmlFor="representative_name" label={t("enterpriseRegistration.start.name")} required>
          <Input aria-invalid={Boolean(errors.representative_name)} id="representative_name" placeholder={t("enterpriseRegistration.start.namePlaceholder")} {...register("representative_name")} />
        </FormField>

        <FormField error={errors.corporate_email?.message} hint={t("enterpriseRegistration.start.emailHint")} htmlFor="corporate_email" label={t("enterpriseRegistration.start.email")} required>
          <Input aria-invalid={Boolean(errors.corporate_email)} id="corporate_email" placeholder={t("enterpriseRegistration.start.emailPlaceholder")} type="email" {...register("corporate_email")} />
        </FormField>

        <Button className="h-12 w-full rounded-xl text-[14.5px] font-semibold" disabled={pending} type="submit">
          {pending ? t("enterpriseRegistration.start.submitting") : t("enterpriseRegistration.start.submit")}
        </Button>
      </form>

      <div className="flex flex-col gap-2 pt-1 text-[13.5px] text-muted-foreground">
        <div>
          {t("enterpriseRegistration.start.resumePrompt")}{" "}
          <button className={LINK_CLASS} onClick={onContinueLaterClick} type="button">
            {t("enterpriseRegistration.start.resumeLink")}
          </button>
        </div>
        <div>
          {t("enterpriseRegistration.start.signInPrompt")}{" "}
          <Link className={LINK_CLASS} to="/login">
            {t("enterpriseRegistration.start.signInLink")}
          </Link>
        </div>
      </div>
    </div>
  );
}
