import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";

import { FormField } from "@/components/common/form-field";
import { InlineBanner } from "@/components/common/inline-banner";
import { SectionCard } from "@/components/common/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AUTH_ACTION_CLASS } from "@/features/auth/auth-status.constants";
import {
  DEFAULT_COMPANY_SIZE,
  DEFAULT_COUNTRY,
  INDUSTRY_OPTIONS,
} from "@/features/enterprise-registration/enterprise-registration.constants";
import {
  step1CompanyDetailsSchema,
  type Step1CompanyDetailsFormData,
  companySizeOptions,
} from "@/features/enterprise-registration/enterprise-registration.schemas";
import { useRegistrationWizard } from "@/features/enterprise-registration/context/registration-wizard-context";

import { StepActions } from "./step-actions";

const OPTIONAL_CLASS = "text-[12.5px] font-normal text-muted-foreground";

function Section({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div className="flex flex-col gap-4 border-t border-line-muted pt-6 first:border-t-0 first:pt-0">
      <h3 className="m-0 text-[13.5px] font-bold text-foreground">{title}</h3>
      {children}
    </div>
  );
}

export function Step1CompanyForm({
  onNext,
}: {
  onNext: () => void;
}) {
  const { t } = useTranslation();
  const { draft, saveDraft, isSaving } = useRegistrationWizard();
  const [serverError, setServerError] = useState<string | null>(null);
  const optional = <span className={OPTIONAL_CLASS}>{t("enterpriseRegistration.common.optional")}</span>;

  const rawCompany = (draft?.company_data || {}) as Record<string, unknown>;
  const rawAddress = (rawCompany.address || {}) as Record<string, unknown>;

  const defaultValues: Step1CompanyDetailsFormData = {
    name: (rawCompany.name as string) || "",
    legal_name: (rawCompany.legal_name as string) || "",
    tax_code: (rawCompany.tax_code as string) || "",
    registration_number: (rawCompany.registration_number as string) || "",
    website: (rawCompany.website as string) || "",
    industry: (rawCompany.industry as string) || "",
    company_size: (rawCompany.company_size as (typeof companySizeOptions)[number]) || DEFAULT_COMPANY_SIZE,
    address: {
      street: (rawAddress.street as string) || "",
      city: (rawAddress.city as string) || "",
      district: (rawAddress.district as string) || "",
      state_province: (rawAddress.state_province as string) || "",
      country: (rawAddress.country as string) || DEFAULT_COUNTRY,
      postal_code: (rawAddress.postal_code as string) || "",
    },
    short_description: (rawCompany.short_description as string) || "",
    description: (rawCompany.description as string) || "",
  };

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Step1CompanyDetailsFormData>({
    resolver: zodResolver(step1CompanyDetailsSchema),
    defaultValues,
  });

  const onSubmit = async (data: Step1CompanyDetailsFormData) => {
    setServerError(null);
    try {
      await saveDraft({
        company_data: {
          name: data.name,
          legal_name: data.legal_name || undefined,
          tax_code: data.tax_code,
          registration_number: data.registration_number || undefined,
          website: data.website || undefined,
          industry: data.industry,
          company_size: data.company_size,
          address: {
            street: data.address.street,
            city: data.address.city,
            district: data.address.district || undefined,
            state_province: data.address.state_province || undefined,
            country: data.address.country,
            postal_code: data.address.postal_code || undefined,
          },
          short_description: data.short_description || undefined,
          description: data.description || undefined,
        },
        version: draft?.version,
      });
      onNext();
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setServerError(errorObj.message || t("enterpriseRegistration.step1.saveFailed"));
    }
  };

  return (
    <SectionCard description={t("enterpriseRegistration.step1.subtitle")} title={t("enterpriseRegistration.step1.title")}>
      {serverError ? <InlineBanner tone="error">{serverError}</InlineBanner> : null}

      <form className="flex flex-col gap-6" noValidate onSubmit={handleSubmit(onSubmit)}>
        <Section title={t("enterpriseRegistration.step1.basic")}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              error={errors.name?.message}
              hint={t("enterpriseRegistration.step1.nameHint")}
              htmlFor="company_name"
              label={t("enterpriseRegistration.step1.name")}
              required
            >
              <Input aria-invalid={Boolean(errors.name)} id="company_name" placeholder={t("enterpriseRegistration.step1.namePlaceholder")} {...register("name")} />
            </FormField>

            <FormField
              error={errors.legal_name?.message}
              hint={t("enterpriseRegistration.step1.legalNameHint")}
              htmlFor="legal_name"
              label={t("enterpriseRegistration.step1.legalName")}
            >
              <Input id="legal_name" placeholder={t("enterpriseRegistration.step1.legalNamePlaceholder")} {...register("legal_name")} />
            </FormField>

            <FormField
              error={errors.tax_code?.message}
              hint={t("enterpriseRegistration.step1.taxCodeHint")}
              htmlFor="tax_code"
              label={t("enterpriseRegistration.step1.taxCode")}
              required
            >
              <Input aria-invalid={Boolean(errors.tax_code)} id="tax_code" placeholder={t("enterpriseRegistration.step1.taxCodePlaceholder")} {...register("tax_code")} />
            </FormField>

            <FormField error={errors.website?.message} htmlFor="website" label={t("enterpriseRegistration.step1.website")} labelAddon={optional}>
              <Input aria-invalid={Boolean(errors.website)} id="website" placeholder={t("enterpriseRegistration.step1.websitePlaceholder")} type="url" {...register("website")} />
            </FormField>
          </div>
        </Section>

        <Section title={t("enterpriseRegistration.step1.industrySection")}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField error={errors.industry?.message} htmlFor="industry" label={t("enterpriseRegistration.step1.industry")} required>
              <Controller
                control={control}
                name="industry"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger aria-invalid={Boolean(errors.industry)} id="industry">
                      <SelectValue placeholder={t("enterpriseRegistration.step1.industryPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRY_OPTIONS.map((item) => (
                        <SelectItem key={item.key} value={item.value}>
                          {t(`enterpriseRegistration.industries.${item.key}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>

            <FormField error={errors.company_size?.message} htmlFor="company_size" label={t("enterpriseRegistration.step1.size")} required>
              <Controller
                control={control}
                name="company_size"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger aria-invalid={Boolean(errors.company_size)} id="company_size">
                      <SelectValue placeholder={t("enterpriseRegistration.step1.sizePlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {companySizeOptions.map((size) => (
                        <SelectItem key={size} value={size}>
                          {t("enterpriseRegistration.step1.sizeOption", { size })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
          </div>
        </Section>

        <Section title={t("enterpriseRegistration.step1.hq")}>
          <FormField error={errors.address?.street?.message} htmlFor="street" label={t("enterpriseRegistration.step1.street")} required>
            <Input aria-invalid={Boolean(errors.address?.street)} id="street" placeholder={t("enterpriseRegistration.step1.streetPlaceholder")} {...register("address.street")} />
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField error={errors.address?.city?.message} htmlFor="city" label={t("enterpriseRegistration.step1.city")} required>
              <Input aria-invalid={Boolean(errors.address?.city)} id="city" placeholder={t("enterpriseRegistration.step1.cityPlaceholder")} {...register("address.city")} />
            </FormField>

            <FormField error={errors.address?.country?.message} htmlFor="country" label={t("enterpriseRegistration.step1.country")} required>
              <Input aria-invalid={Boolean(errors.address?.country)} id="country" {...register("address.country")} />
            </FormField>
          </div>
        </Section>

        <Section title={t("enterpriseRegistration.step1.overview")}>
          <FormField
            error={errors.short_description?.message}
            hint={t("enterpriseRegistration.step1.pitchHint")}
            htmlFor="short_description"
            label={t("enterpriseRegistration.step1.pitch")}
            labelAddon={optional}
          >
            <Textarea id="short_description" placeholder={t("enterpriseRegistration.step1.pitchPlaceholder")} rows={2} {...register("short_description")} />
          </FormField>
        </Section>

        <StepActions>
          <Button className={AUTH_ACTION_CLASS} disabled={isSaving} shape="xl" type="submit">
            {isSaving ? t("enterpriseRegistration.common.saving") : t("enterpriseRegistration.common.saveContinue")}
            {isSaving ? null : <ArrowRight aria-hidden />}
          </Button>
        </StepActions>
      </form>
    </SectionCard>
  );
}
