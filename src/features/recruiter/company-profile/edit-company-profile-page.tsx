import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
      working_days: t("recruiterCompanyProfile.page.workingDaysDefault"),
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
        working_days: t("recruiterCompanyProfile.page.workingDaysDefault"),
      });
    }
  }, [enterprise, reset, t]);

  const translateOptions = (options: { labelKey: string; value: string }[]) =>
    options.map(({ labelKey, value }) => ({ label: t(labelKey), value }));
  const industryOptions = translateOptions(INDUSTRY_OPTIONS);
  const sizeOptions = translateOptions(COMPANY_SIZE_OPTIONS);
  const typeOptions = translateOptions(COMPANY_TYPE_OPTIONS);

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
        {t("recruiterCompanyProfile.edit.notFound")}
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
        errorObj.message ?? t("recruiterCompanyProfile.edit.saveFailed"),
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
          {t("sidebar.companyProfile")}
        </Link>
        <span>/</span>
        <span className="text-foreground">{t("actions.edit")}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t("recruiterCompanyProfile.edit.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("recruiterCompanyProfile.edit.subtitle")}
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
            {t("recruiterCompanyProfile.edit.back")}
          </Link>
        </Button>
      </div>

      {/* Notification Banner for Locked Fields */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-800 dark:text-amber-300">
        <ShieldAlert className="size-4.5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
        <div className="space-y-0.5">
          <p className="font-semibold">{t("recruiterCompanyProfile.edit.legalBannerTitle")}</p>
          <p className="leading-relaxed">
            {t("recruiterCompanyProfile.edit.legalBannerBody")}
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
          <span>{t("recruiterCompanyProfile.edit.saved")}</span>
        </div>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Section 1: Identity */}
        <Card className="shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              {t("recruiterCompanyProfile.edit.identityTitle")}
            </CardTitle>
            <CardDescription className="text-xs">
              {t("recruiterCompanyProfile.edit.identityDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="space-y-1.5">
              <Label htmlFor="company-name" className="text-sm font-medium">
                {t("recruiterEmployees.form.displayName")} <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="company-name"
                placeholder={t("recruiterCompanyProfile.edit.nameExample")}
                {...register("name")}
                aria-invalid={Boolean(errors.name)}
              />
              {errors.name ? (
                <p className="text-xs text-rose-500">{errors.name.message}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {t("recruiterCompanyProfile.edit.nameHint")}
                </p>
              )}
            </div>

            {/* Readonly Legal Details Grid */}
            <div className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-muted/40 p-4 sm:grid-cols-2 text-xs">
              <div className="space-y-1">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Lock className="size-3" />
                  {t("recruiterCompanyProfile.edit.legalCompanyName")}
                </span>
                <p className="font-medium text-foreground">
                  {(enterprise as unknown as { legal_name?: string })
                    .legal_name || enterprise.name}
                </p>
              </div>

              <div className="space-y-1">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Lock className="size-3" />
                  {t("recruiterCompanyProfile.page.taxCode")}
                </span>
                <p className="font-mono font-medium text-foreground">
                  {enterprise.taxCode || "0312 345 678"}
                </p>
              </div>

              <div className="space-y-1">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Lock className="size-3" />
                  {t("recruiterCompanyProfile.page.registrationNumber")}
                </span>
                <p className="font-medium text-foreground">
                  {t("recruiterCompanyProfile.edit.registrationProvided")}
                </p>
              </div>

              <div className="space-y-1">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Lock className="size-3" />
                  {t("recruiterCompanyProfile.edit.verificationStatus")}
                </span>
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="size-3" /> {t("recruiterCompanyProfile.edit.verifiedActive")}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Contact Information */}
        <Card className="shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              {t("recruiterCompanyProfile.edit.contactTitle")}
            </CardTitle>
            <CardDescription className="text-xs">
              {t("recruiterCompanyProfile.edit.contactDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="company-email" className="text-sm font-medium">
                  {t("adminEnterprises.detail.email")} <span className="text-rose-500">*</span>
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
                  {t("recruiterCompanyProfile.edit.phoneNumber")} <span className="text-rose-500">*</span>
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
                {t("recruiterCompanyProfile.edit.officialWebsite")}
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
              {t("recruiterCompanyProfile.edit.businessTitle")}
            </CardTitle>
            <CardDescription className="text-xs">
              {t("recruiterCompanyProfile.edit.businessDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  {t("adminEnterprises.detail.industry")} <span className="text-rose-500">*</span>
                </Label>
                <FilterSelect
                  value={selectedIndustry || "Information Technology"}
                  onChange={(val: string) =>
                    setValue("industry", val, { shouldDirty: true })
                  }
                  options={industryOptions}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">{t("adminEnterprises.detail.companySize")}</Label>
                <FilterSelect
                  value={selectedSize || "201-500"}
                  onChange={(val: string) =>
                    setValue("company_size", val, { shouldDirty: true })
                  }
                  options={sizeOptions}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">{t("recruiterCompanyProfile.edit.companyModel")}</Label>
                <FilterSelect
                  value={selectedType || "Product"}
                  onChange={(val: string) =>
                    setValue("company_type", val, { shouldDirty: true })
                  }
                  options={typeOptions}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="working-days" className="text-sm font-medium">
                {t("recruiterCompanyProfile.edit.workingDays")}
              </Label>
              <Input
                id="working-days"
                placeholder={t("recruiterCompanyProfile.edit.workingDaysExample")}
                {...register("working_days")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Public Description */}
        <Card className="shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              {t("recruiterCompanyProfile.edit.publicTitle")}
            </CardTitle>
            <CardDescription className="text-xs">
              {t("recruiterCompanyProfile.edit.publicDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="space-y-1.5">
              <Label htmlFor="company-desc" className="text-sm font-medium">
                {t("recruiterCompanyProfile.edit.aboutLabel")}
              </Label>
              <Textarea
                id="company-desc"
                rows={5}
                placeholder={t("recruiterCompanyProfile.edit.aboutPlaceholder")}
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
              {t("recruiterCompanyProfile.edit.addressTitle")}
            </CardTitle>
            <CardDescription className="text-xs">
              {t("recruiterCompanyProfile.edit.addressDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="space-y-1.5">
              <Label htmlFor="addr-street" className="text-sm font-medium">
                {t("recruiterCompanyProfile.edit.street")}
              </Label>
              <Input
                id="addr-street"
                placeholder={t("recruiterCompanyProfile.edit.streetExample")}
                {...register("street")}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="addr-city" className="text-sm font-medium">
                  {t("recruiterCompanyProfile.edit.city")}
                </Label>
                <Input
                  id="addr-city"
                  placeholder={t("recruiterCompanyProfile.edit.cityExample")}
                  {...register("city")}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="addr-country" className="text-sm font-medium">
                  {t("adminEnterprises.form.countryLabel")}
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
            {t("actions.cancel")}
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || updateMutation.isPending}
            className="gap-2"
          >
            <Save className="size-4" />
            <span>
              {isSubmitting || updateMutation.isPending
                ? t("state.saving")
                : t("adminUsers.form.save")}
            </span>
          </Button>
        </div>
      </form>
    </div>
  );
}

export { RecruiterEditCompanyProfilePage as EditCompanyProfilePage };
