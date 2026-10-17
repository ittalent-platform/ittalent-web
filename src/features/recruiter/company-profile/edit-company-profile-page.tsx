import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CheckCircle2, Lock, Save, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FilterSelect } from "@/components/ui/filter-select";
import { RECRUITER_COMPANY_PROFILE_PATH } from "@/config/routes";
import {
  useMyEnterpriseProfileQuery,
  useUpdateMyEnterpriseProfileMutation,
} from "./company-profile.queries";
import type { UpdateEnterpriseDto } from "@/api/generated/types.gen";
import {
  COMPANY_SIZE_OPTIONS,
  COMPANY_TYPE_OPTIONS,
  INDUSTRY_OPTIONS,
  updateEnterpriseProfileSchema,
  type UpdateEnterpriseProfileFormValues,
} from "./company-profile.types";

export function RecruiterEditCompanyProfilePage() {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState(false);

  const { data: enterprise, isLoading } = useMyEnterpriseProfileQuery();
  const updateMutation = useUpdateMyEnterpriseProfileMutation(
    enterprise?.id ?? "",
  );

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateEnterpriseProfileFormValues>({
    resolver: zodResolver(updateEnterpriseProfileSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      website: "",
      industry: "Information Technology",
      company_size: "201-500",
      company_type: "Product",
      description: "",
      street: "",
      city: "",
      country: "Vietnam",
      social_linkedin: "",
      social_facebook: "",
      social_github: "",
      social_twitter: "",
      working_days: "Monday – Friday",
    },
  });

  const selectedIndustry = useWatch({ control, name: "industry" });
  const selectedSize = useWatch({ control, name: "company_size" });
  const selectedType = useWatch({ control, name: "company_type" });

  useEffect(() => {
    if (enterprise) {
      reset({
        name: enterprise.name ?? "",
        email: enterprise.email ?? "",
        phone: enterprise.phone ?? "",
        website: enterprise.website ?? "",
        industry: enterprise.industry ?? "Information Technology",
        company_size: enterprise.companySize ?? "201-500",
        company_type:
          (enterprise as unknown as { company_type?: string }).company_type ??
          "Product",
        description: enterprise.description ?? "",
        street: enterprise.address?.street ?? "",
        city: enterprise.address?.city ?? "",
        country: enterprise.address?.country ?? "Vietnam",
        social_linkedin: "",
        social_facebook: "",
        social_github: "",
        social_twitter: "",
        working_days: "Monday – Friday",
      });
    }
  }, [enterprise, reset]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-96 w-full bg-muted rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!enterprise) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No enterprise profile found to edit.
      </div>
    );
  }

  const onSubmit = async (values: UpdateEnterpriseProfileFormValues) => {
    setErrorMessage(null);
    try {
      const hasSocial = Boolean(
        values.social_linkedin ||
        values.social_facebook ||
        values.social_github ||
        values.social_twitter,
      );

      await updateMutation.mutateAsync({
        name: values.name,
        email: values.email,
        phone: values.phone,
        website: values.website || undefined,
        industry: values.industry,
        company_size:
          (values.company_size as NonNullable<
            UpdateEnterpriseDto["company_size"]
          >) || undefined,
        company_type:
          (values.company_type as NonNullable<
            UpdateEnterpriseDto["company_type"]
          >) || undefined,
        description: values.description || undefined,
        working_days: values.working_days || undefined,
        address:
          values.street && values.city
            ? {
                street: values.street,
                city: values.city,
                country: values.country || "Vietnam",
              }
            : undefined,
        social_links: hasSocial
          ? {
              linkedin: values.social_linkedin || undefined,
              facebook: values.social_facebook || undefined,
              github: values.social_github || undefined,
              twitter: values.social_twitter || undefined,
            }
          : undefined,
      });

      setSuccessToast(true);
      setTimeout(() => {
        navigate(RECRUITER_COMPANY_PROFILE_PATH);
      }, 1000);
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setErrorMessage(
        errorObj.message ?? "Failed to save company profile changes.",
      );
    }
  };

  return (
    <div className="space-y-6 max-w-4xl pb-16">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Link
          to={RECRUITER_COMPANY_PROFILE_PATH}
          className="hover:text-foreground"
        >
          Company profile
        </Link>
        <span>/</span>
        <span className="text-foreground">Edit</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Edit company profile
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Changes go live on your public page as soon as you save. Fields
            marked with * are required.
          </p>
        </div>

        <Button
          asChild
          variant="outline"
          size="sm"
          className="gap-2 self-start sm:self-center"
        >
          <Link to={RECRUITER_COMPANY_PROFILE_PATH}>
            <ArrowLeft className="size-4" />
            Back to profile
          </Link>
        </Button>
      </div>

      {/* Notification Banner for Locked Fields */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-800 dark:text-amber-300">
        <ShieldAlert className="size-4.5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
        <div className="space-y-0.5">
          <p className="font-semibold">Legal identity protection</p>
          <p className="leading-relaxed">
            Legal name, tax code, registration number, founded year and status
            are officially verified and locked. To modify these legal
            credentials, please request verification correction with ITTalent
            admin.
          </p>
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}

      {successToast ? (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm font-medium text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="size-5" />
          <span>Profile changes saved successfully! Redirecting...</span>
        </div>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Section 1: Identity */}
        <Card className="shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              1. Identity & Branding
            </CardTitle>
            <CardDescription className="text-xs">
              Display name is what candidates and talent see across the
              marketplace.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="space-y-1.5">
              <Label htmlFor="company-name" className="text-sm font-medium">
                Display name <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="company-name"
                placeholder="e.g. Nova Fintech"
                {...register("name")}
                aria-invalid={Boolean(errors.name)}
              />
              {errors.name ? (
                <p className="text-xs text-rose-500">{errors.name.message}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Shown on your public page · 2–150 characters
                </p>
              )}
            </div>

            {/* Readonly Legal Details Grid */}
            <div className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-muted/40 p-4 sm:grid-cols-2 text-xs">
              <div className="space-y-1">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Lock className="size-3" />
                  Legal company name
                </span>
                <p className="font-medium text-foreground">
                  {(enterprise as unknown as { legal_name?: string })
                    .legal_name || enterprise.name}
                </p>
              </div>

              <div className="space-y-1">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Lock className="size-3" />
                  Tax identification code
                </span>
                <p className="font-mono font-medium text-foreground">
                  {enterprise.taxCode || "0312 345 678"}
                </p>
              </div>

              <div className="space-y-1">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Lock className="size-3" />
                  Registration number
                </span>
                <p className="font-medium text-foreground">
                  Provided during verification
                </p>
              </div>

              <div className="space-y-1">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Lock className="size-3" />
                  Verification status
                </span>
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="size-3" /> Verified Active
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Contact Information */}
        <Card className="shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              2. Contact Information
            </CardTitle>
            <CardDescription className="text-xs">
              Primary official channels for candidate communication and
              notification.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="company-email" className="text-sm font-medium">
                  Corporate email <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="company-email"
                  type="email"
                  placeholder="contact@novafintech.vn"
                  {...register("email")}
                  aria-invalid={Boolean(errors.email)}
                />
                {errors.email ? (
                  <p className="text-xs text-rose-500">
                    {errors.email.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="company-phone" className="text-sm font-medium">
                  Phone number <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="company-phone"
                  placeholder="028 3822 5588"
                  {...register("phone")}
                  aria-invalid={Boolean(errors.phone)}
                />
                {errors.phone ? (
                  <p className="text-xs text-rose-500">
                    {errors.phone.message}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="company-website" className="text-sm font-medium">
                Official website
              </Label>
              <Input
                id="company-website"
                placeholder="https://novafintech.vn"
                {...register("website")}
                aria-invalid={Boolean(errors.website)}
              />
              {errors.website ? (
                <p className="text-xs text-rose-500">
                  {errors.website.message}
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Business Classification */}
        <Card className="shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              3. Business Details
            </CardTitle>
            <CardDescription className="text-xs">
              Used for search filters and talent recommendations on ITTalent
              marketplace.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  Industry <span className="text-rose-500">*</span>
                </Label>
                <FilterSelect
                  value={selectedIndustry || "Information Technology"}
                  onChange={(val: string) =>
                    setValue("industry", val, { shouldDirty: true })
                  }
                  options={INDUSTRY_OPTIONS}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Company size</Label>
                <FilterSelect
                  value={selectedSize || "201-500"}
                  onChange={(val: string) =>
                    setValue("company_size", val, { shouldDirty: true })
                  }
                  options={COMPANY_SIZE_OPTIONS}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Company model</Label>
                <FilterSelect
                  value={selectedType || "Product"}
                  onChange={(val: string) =>
                    setValue("company_type", val, { shouldDirty: true })
                  }
                  options={COMPANY_TYPE_OPTIONS}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="working-days" className="text-sm font-medium">
                Working days
              </Label>
              <Input
                id="working-days"
                placeholder="e.g. Monday – Friday (hybrid schedule)"
                {...register("working_days")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Public Description */}
        <Card className="shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              4. Public Description & About
            </CardTitle>
            <CardDescription className="text-xs">
              Introduce your company mission, team culture, and values to
              attract top candidates.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="space-y-1.5">
              <Label htmlFor="company-desc" className="text-sm font-medium">
                About description
              </Label>
              <Textarea
                id="company-desc"
                rows={5}
                placeholder="Tell candidates what makes your company a great place to work..."
                {...register("description")}
                aria-invalid={Boolean(errors.description)}
              />
              {errors.description ? (
                <p className="text-xs text-rose-500">
                  {errors.description.message}
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {/* Section 5: Primary Address */}
        <Card className="shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              5. Headquarters Address
            </CardTitle>
            <CardDescription className="text-xs">
              Physical office location displayed on your public profile and job
              postings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="space-y-1.5">
              <Label htmlFor="addr-street" className="text-sm font-medium">
                Street address
              </Label>
              <Input
                id="addr-street"
                placeholder="e.g. 12 Tôn Đản, Phường 13, Quận 4"
                {...register("street")}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="addr-city" className="text-sm font-medium">
                  City / Province
                </Label>
                <Input
                  id="addr-city"
                  placeholder="e.g. Hồ Chí Minh"
                  {...register("city")}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="addr-country" className="text-sm font-medium">
                  Country
                </Label>
                <Input
                  id="addr-country"
                  placeholder="Vietnam"
                  {...register("country")}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Bar */}
        <div className="sticky bottom-4 z-20 flex items-center justify-end gap-3 rounded-2xl border border-border bg-card/95 p-4 shadow-lg backdrop-blur-md">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(RECRUITER_COMPANY_PROFILE_PATH)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || updateMutation.isPending}
            className="gap-2"
          >
            <Save className="size-4" />
            <span>
              {isSubmitting || updateMutation.isPending
                ? "Saving..."
                : "Save changes"}
            </span>
          </Button>
        </div>
      </form>
    </div>
  );
}

export { RecruiterEditCompanyProfilePage as EditCompanyProfilePage };
