import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormField } from "@/components/common/form-field";
import { InlineBanner } from "@/components/common/inline-banner";
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
import {
  step1CompanyDetailsSchema,
  type Step1CompanyDetailsFormData,
  companySizeOptions,
} from "../enterprise-registration.schemas";
import { useRegistrationWizard } from "../context/registration-wizard-context";

const INDUSTRY_OPTIONS = [
  "Software & IT Services",
  "Fintech & Banking",
  "E-commerce & Retail",
  "Healthcare & Biotech",
  "Education & Edtech",
  "Telecommunications",
  "Gaming & Entertainment",
  "Logistics & Supply Chain",
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
    name: (rawCompany.name as string) || "",
    legal_name: (rawCompany.legal_name as string) || "",
    tax_code: (rawCompany.tax_code as string) || "",
    registration_number: (rawCompany.registration_number as string) || "",
    website: (rawCompany.website as string) || "",
    industry: (rawCompany.industry as string) || "",
    company_size: (rawCompany.company_size as (typeof companySizeOptions)[number]) || "11-50",
    address: {
      street: (rawAddress.street as string) || "",
      city: (rawAddress.city as string) || "",
      district: (rawAddress.district as string) || "",
      state_province: (rawAddress.state_province as string) || "",
      country: (rawAddress.country as string) || "Vietnam",
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
      setServerError(errorObj.message || "Failed to save company details. Please try again.");
    }
  };

  return (
    <div className="rounded-2xl border border-[#e6e4df] bg-[#ffffff] p-6 shadow-xs sm:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold tracking-tight text-[#19191c]">
          Company Details
        </h2>
        <p className="mt-1 text-[13.5px] text-[#64646b]">
          Provide verified business entity information matching your official registration certificate.
        </p>
      </div>

      {serverError && (
        <div className="mb-6">
          <InlineBanner tone="error">{serverError}</InlineBanner>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 1: Identification */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-[#19191c]">Basic Information</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              htmlFor="company_name"
              label="Company display / trading name"
              required
              hint="The commercial name shown on job boards"
              error={errors.name?.message}
            >
              <Input
                id="company_name"
                placeholder="e.g. VNG Corporation"
                {...register("name")}
              />
            </FormField>

            <FormField
              htmlFor="legal_name"
              label="Official registered legal name"
              hint="As registered on your business license"
              error={errors.legal_name?.message}
            >
              <Input
                id="legal_name"
                placeholder="e.g. Công ty Cổ phần VNG"
                {...register("legal_name")}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              htmlFor="tax_code"
              label="Tax identification number (Mã số thuế)"
              required
              hint="10 or 13 numeric digits"
              error={errors.tax_code?.message}
            >
              <Input
                id="tax_code"
                placeholder="e.g. 0303886515"
                {...register("tax_code")}
              />
            </FormField>

            <FormField
              htmlFor="website"
              label="Company website"
              hint="https://example.com"
              error={errors.website?.message}
            >
              <Input
                id="website"
                type="url"
                placeholder="https://company.com"
                {...register("website")}
              />
            </FormField>
          </div>
        </div>

        {/* Section 2: Industry & Organization */}
        <div className="space-y-4 border-t border-[#efede8] pt-6">
          <h3 className="text-sm font-semibold text-[#19191c]">Industry & Organization</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              htmlFor="industry"
              label="Primary industry"
              required
              error={errors.industry?.message}
            >
              <Controller
                control={control}
                name="industry"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger id="industry">
                      <SelectValue placeholder="Select industry..." />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRY_OPTIONS.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
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
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger id="company_size">
                      <SelectValue placeholder="Select size..." />
                    </SelectTrigger>
                    <SelectContent>
                      {companySizeOptions.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt} employees
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
          </div>
        </div>

        {/* Section 3: Headquarters Location */}
        <div className="space-y-4 border-t border-[#efede8] pt-6">
          <h3 className="text-sm font-semibold text-[#19191c]">Headquarters Address</h3>
          <FormField
            htmlFor="street"
            label="Street address"
            required
            error={errors.address?.street?.message}
          >
            <Input
              id="street"
              placeholder="e.g. 182 Le Dai Hanh, Ward 15, District 11"
              {...register("address.street")}
            />
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              htmlFor="city"
              label="Province / City"
              required
              error={errors.address?.city?.message}
            >
              <Input
                id="city"
                placeholder="e.g. Ho Chi Minh City"
                {...register("address.city")}
              />
            </FormField>

            <FormField
              htmlFor="country"
              label="Country"
              required
              error={errors.address?.country?.message}
            >
              <Input
                id="country"
                defaultValue="Vietnam"
                {...register("address.country")}
              />
            </FormField>
          </div>
        </div>

        {/* Section 4: Overview */}
        <div className="space-y-4 border-t border-[#efede8] pt-6">
          <h3 className="text-sm font-semibold text-[#19191c]">Company Overview</h3>
          <FormField
            htmlFor="short_description"
            label="Short elevator pitch (optional)"
            hint="A quick 1-2 sentence overview of what your company builds"
            error={errors.short_description?.message}
          >
            <Textarea
              id="short_description"
              rows={2}
              placeholder="e.g. Leading digital entertainment and cloud platform provider in Southeast Asia."
              {...register("short_description")}
            />
          </FormField>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[#efede8] pt-6">
          <Button
            type="submit"
            disabled={isSaving}
            className="min-w-[140px]"
          >
            {isSaving ? "Saving..." : "Save & Continue →"}
          </Button>
        </div>
      </form>
    </div>
  );
}
