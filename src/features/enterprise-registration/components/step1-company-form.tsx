import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";

import { FormField } from "@/components/common/form-field";
import { InlineBanner } from "@/components/common/inline-banner";
import { SectionCard } from "@/components/common/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DEFAULT_COUNTRY, INDUSTRY_OPTIONS } from "@/features/enterprise-registration/enterprise-registration.constants";
import {
  step1CompanyDetailsSchema,
  type Step1CompanyDetailsFormData,
  companySizeOptions,
} from "@/features/enterprise-registration/enterprise-registration.schemas";
import { useRegistrationWizard } from "@/features/enterprise-registration/context/registration-wizard-context";

import { WIZARD_PRIMARY_BUTTON_CLASS, WizardActions } from "./wizard-actions";

/** The design asks for one address line; the API also wants a city, so the last comma-separated part stands in for it. */
function cityFromAddress(address: string): string {
  const parts = address.split(",").map((part) => part.trim()).filter(Boolean);
  return parts[parts.length - 1] ?? "";
}

export function Step1CompanyForm({
  onNext,
}: {
  onNext: () => void;
}) {
  const { t } = useTranslation();
  const { draft, saveDraft, isSaving } = useRegistrationWizard();
  const [serverError, setServerError] = useState<string | null>(null);

  const rawCompany = (draft?.company_data || {}) as Record<string, unknown>;
  const rawAddress = (rawCompany.address || {}) as Record<string, unknown>;
  const street = (rawAddress.street as string) || "";

  // Company phone and email are in the design but the API has no field for them yet, so they are not saved.
  const [companyPhone, setCompanyPhone] = useState("");
  const [corporateEmail, setCorporateEmail] = useState("");

  const {
    register,
    control,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<Step1CompanyDetailsFormData>({
    resolver: zodResolver(step1CompanyDetailsSchema),
    defaultValues: {
      legal_name: (rawCompany.legal_name as string) || "",
      name: (rawCompany.name as string) || "",
      tax_code: (rawCompany.tax_code as string) || "",
      website: (rawCompany.website as string) || "",
      industry: (rawCompany.industry as string) || "",
      company_size: (rawCompany.company_size as (typeof companySizeOptions)[number]) || undefined,
      address: {
        street,
        city: (rawAddress.city as string) || cityFromAddress(street),
        country: (rawAddress.country as string) || DEFAULT_COUNTRY,
      },
    },
  });

  const toCompanyData = (values: Step1CompanyDetailsFormData) => ({
    legal_name: values.legal_name,
    name: values.name,
    tax_code: values.tax_code,
    website: values.website || undefined,
    industry: values.industry,
    company_size: values.company_size,
    address: {
      street: values.address.street,
      city: values.address.city || cityFromAddress(values.address.street),
      country: values.address.country || DEFAULT_COUNTRY,
    },
  });

  const onSubmit = async (data: Step1CompanyDetailsFormData) => {
    setServerError(null);
    try {
      await saveDraft({ company_data: toCompanyData(data), version: draft?.version });
      onNext();
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setServerError(errorObj.message || t("enterpriseRegistration.step1.saveFailed"));
    }
  };

  const onSaveDraft = async () => {
    setServerError(null);
    try {
      await saveDraft({ company_data: toCompanyData(getValues()), version: draft?.version });
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setServerError(errorObj.message || t("enterpriseRegistration.step1.saveFailed"));
    }
  };

  return (
    <form className="flex flex-col gap-5" noValidate onSubmit={handleSubmit(onSubmit)}>
      <SectionCard className="gap-5 p-6 sm:p-7" title={t("enterpriseRegistration.step1.title")}>
        {serverError ? <InlineBanner tone="error">{serverError}</InlineBanner> : null}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <FormField error={errors.legal_name?.message} hint={t("enterpriseRegistration.step1.legalNameHint")} htmlFor="legal_name" label={t("enterpriseRegistration.step1.legalName")} required>
            <Input aria-invalid={Boolean(errors.legal_name)} id="legal_name" placeholder={t("enterpriseRegistration.step1.legalNamePlaceholder")} {...register("legal_name")} />
          </FormField>

          <FormField error={errors.name?.message} hint={t("enterpriseRegistration.step1.nameHint")} htmlFor="name" label={t("enterpriseRegistration.step1.name")} required>
            <Input aria-invalid={Boolean(errors.name)} id="name" placeholder={t("enterpriseRegistration.step1.namePlaceholder")} {...register("name")} />
          </FormField>

          <FormField error={errors.tax_code?.message} hint={t("enterpriseRegistration.step1.taxCodeHint")} htmlFor="tax_code" label={t("enterpriseRegistration.step1.taxCode")} required>
            <Input aria-invalid={Boolean(errors.tax_code)} id="tax_code" placeholder={t("enterpriseRegistration.step1.taxCodePlaceholder")} {...register("tax_code")} />
          </FormField>

          <FormField hint={t("enterpriseRegistration.step1.corporateEmailHint")} htmlFor="corporate_email" label={t("enterpriseRegistration.step1.corporateEmail")} required>
            <Input
              id="corporate_email"
              onChange={(e) => setCorporateEmail(e.target.value)}
              placeholder={t("enterpriseRegistration.step1.corporateEmailPlaceholder")}
              type="email"
              value={corporateEmail}
            />
          </FormField>

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
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>

          <FormField error={errors.website?.message} htmlFor="website" label={t("enterpriseRegistration.step1.website")}>
            <Input aria-invalid={Boolean(errors.website)} id="website" placeholder={t("enterpriseRegistration.step1.websitePlaceholder")} {...register("website")} />
          </FormField>

          <FormField htmlFor="company_phone" label={t("enterpriseRegistration.step1.phone")} required>
            <Input id="company_phone" onChange={(e) => setCompanyPhone(e.target.value)} placeholder={t("enterpriseRegistration.step1.phonePlaceholder")} type="tel" value={companyPhone} />
          </FormField>

          <div className="col-span-1 md:col-span-2">
            <FormField error={errors.address?.street?.message} htmlFor="address_street" label={t("enterpriseRegistration.step1.address")} required>
              <Input
                aria-invalid={Boolean(errors.address?.street)}
                id="address_street"
                placeholder={t("enterpriseRegistration.step1.addressPlaceholder")}
                {...register("address.street", { onChange: (e) => setValue("address.city", cityFromAddress(e.target.value)) })}
              />
            </FormField>
          </div>
        </div>
      </SectionCard>

      <WizardActions onSaveDraft={() => void onSaveDraft()} saveDisabled={isSaving}>
        <Button className={WIZARD_PRIMARY_BUTTON_CLASS} disabled={isSaving} type="submit">
          {isSaving ? t("enterpriseRegistration.common.saving") : t("enterpriseRegistration.common.continue")}
        </Button>
      </WizardActions>
    </form>
  );
}
