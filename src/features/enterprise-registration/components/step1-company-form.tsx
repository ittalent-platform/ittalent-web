import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormField } from "@/components/common/form-field";
import { InlineBanner } from "@/components/common/inline-banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  step1CompanyDetailsSchema,
  type Step1CompanyDetailsFormData,
  companySizeOptions,
} from "@/features/enterprise-registration/enterprise-registration.schemas";
import { useRegistrationWizard } from "@/features/enterprise-registration/context/registration-wizard-context";

const INDUSTRY_OPTIONS = [
  "Logistics technology",
  "Software & IT Services",
  "Fintech & Banking",
  "E-commerce & Retail",
  "Healthcare & Biotech",
  "Education & Edtech",
  "Telecommunications",
  "Gaming & Entertainment",
  "Artificial Intelligence & Data",
  "Hardware & Electronics",
  "Other",
] as const;

export function Step1CompanyForm({
  onNext,
}: {
  onNext: () => void;
}) {
  const { draft, saveDraft, isSaving } = useRegistrationWizard();
  const [serverError, setServerError] = useState<string | null>(null);

  const rawCompany = (draft?.company_data || {}) as Record<string, unknown>;
  const rawAddress = (rawCompany.address || {}) as Record<string, unknown>;

  const defaultValues: Step1CompanyDetailsFormData = {
    legal_name: (rawCompany.legal_name as string) || "",
    name: (rawCompany.name as string) || "",
    tax_code: (rawCompany.tax_code as string) || "",
    website: (rawCompany.website as string) || "",
    industry: (rawCompany.industry as string) || "Logistics technology",
    company_size: (rawCompany.company_size as (typeof companySizeOptions)[number]) || "51-200",
    address: {
      street: (rawAddress.street as string) || "18 Duy Tân, Cầu Giấy, Hà Nội",
      city: (rawAddress.city as string) || "Hà Nội",
      country: (rawAddress.country as string) || "Vietnam",
    },
  };

  const [companyPhone, setCompanyPhone] = useState(
    (rawCompany.phone as string) || "024 3999 1188",
  );
  const [corporateEmail, setCorporateEmail] = useState(
    (rawCompany.corporate_email as string) || draft?.corporate_email || "contact@lumenlogistics.vn",
  );

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
          legal_name: data.legal_name,
          name: data.name,
          tax_code: data.tax_code,
          website: data.website || undefined,
          industry: data.industry,
          company_size: data.company_size,
          address: {
            street: data.address.street,
            city: data.address.city || "Hà Nội",
            country: data.address.country || "Vietnam",
          },
        },
        version: draft?.version,
      });
      onNext();
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setServerError(errorObj.message || "Failed to save company details. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <section className="rounded-2xl border border-border bg-card p-6 sm:p-7 flex flex-col gap-5">
        <div>
          <h2 className="text-[15px] font-bold tracking-tight text-foreground">
            Company details
          </h2>
        </div>

        {serverError && (
          <InlineBanner tone="error">{serverError}</InlineBanner>
        )}

        {/* Field Grid matching Screen 13 layout */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Row 1: Legal name (left) | Trading name (right) */}
          <FormField
            htmlFor="legal_name"
            label="Legal name"
            required
            hint="As on the business registration certificate"
            error={errors.legal_name?.message}
          >
            <Input
              id="legal_name"
              placeholder="Công ty Cổ phần Lumen Logistics"
              {...register("legal_name")}
            />
          </FormField>

          <FormField
            htmlFor="name"
            label="Trading name"
            required
            hint="Shown to candidates"
            error={errors.name?.message}
          >
            <Input
              id="name"
              placeholder="Lumen Logistics JSC"
              {...register("name")}
            />
          </FormField>

          {/* Row 2: Tax code (left) | Corporate email (right) */}
          <FormField
            htmlFor="tax_code"
            label="Tax code"
            required
            hint="10 or 13 digits · leading zeros are kept"
            error={errors.tax_code?.message}
          >
            <Input
              id="tax_code"
              placeholder="0109876543"
              {...register("tax_code")}
            />
          </FormField>

          <FormField
            htmlFor="corporate_email"
            label="Corporate email"
            required
            hint="Company domain"
          >
            <Input
              id="corporate_email"
              type="email"
              value={corporateEmail}
              onChange={(e) => setCorporateEmail(e.target.value)}
              placeholder="contact@lumenlogistics.vn"
            />
          </FormField>

          {/* Row 3: Industry (left) | Company size (right) */}
          <FormField
            htmlFor="industry"
            label="Industry"
            required
            error={errors.industry?.message}
          >
            <Controller
              control={control}
              name="industry"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="industry">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRY_OPTIONS.map((ind) => (
                      <SelectItem key={ind} value={ind}>
                        {ind}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>

          <FormField
            htmlFor="company_size"
            label="Company size"
            required
            error={errors.company_size?.message}
          >
            <Controller
              control={control}
              name="company_size"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="company_size">
                    <SelectValue placeholder="Select size" />
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

          {/* Row 4: Website (left) | Phone (right) */}
          <FormField
            htmlFor="website"
            label="Website"
            error={errors.website?.message}
          >
            <Input
              id="website"
              placeholder="lumenlogistics.vn"
              {...register("website")}
            />
          </FormField>

          <FormField
            htmlFor="company_phone"
            label="Phone"
            required
          >
            <Input
              id="company_phone"
              type="tel"
              value={companyPhone}
              onChange={(e) => setCompanyPhone(e.target.value)}
              placeholder="024 3999 1188"
            />
          </FormField>

          {/* Row 5: Address (full width single input) */}
          <div className="col-span-1 md:col-span-2">
            <FormField
              htmlFor="address_street"
              label="Address"
              required
              error={errors.address?.street?.message}
            >
              <Input
                id="address_street"
                placeholder="18 Duy Tân, Cầu Giấy, Hà Nội"
                {...register("address.street")}
              />
            </FormField>
          </div>
        </div>
      </section>

      {/* Action buttons on background */}
      <div className="flex items-center justify-end gap-3 pt-1">
        <Button
          type="button"
          variant="outline"
          disabled={isSaving}
          className="h-12 min-w-[120px] rounded-xl px-5 text-[14px] font-semibold"
          onClick={async () => {
            const values = control._formValues;
            try {
              await saveDraft({
                company_data: {
                  legal_name: values.legal_name,
                  name: values.name,
                  tax_code: values.tax_code,
                  website: values.website || undefined,
                  industry: values.industry,
                  company_size: values.company_size,
                  address: {
                    street: values.address?.street,
                    city: values.address?.city || "Hà Nội",
                    country: values.address?.country || "Vietnam",
                  },
                },
                version: draft?.version,
              });
            } catch (err: unknown) {
              const errorObj = err as { message?: string };
              setServerError(errorObj.message || "Failed to save draft.");
            }
          }}
        >
          Save draft
        </Button>
        <Button
          type="submit"
          disabled={isSaving}
          className="h-12 min-w-[140px] rounded-xl px-6 text-[14.5px] font-semibold"
        >
          {isSaving ? "Saving..." : "Continue"}
        </Button>
      </div>
    </form>
  );
}
