import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";
import {
  Briefcase,
  Building2,
  Camera,
  Clock,
  Edit,
  ExternalLink,
  Image as ImageIcon,
  MapPin,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { recruiterCompanyProfileEditPath } from "@/config/routes";
import { useMyEnterpriseProfileQuery } from "./company-profile.queries";
import { ChangeLogoDialog } from "./change-logo-dialog";
import { ChangeCoverDialog } from "./change-cover-dialog";

export function RecruiterCompanyProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [isLogoOpen, setIsLogoOpen] = useState(false);
  const [isCoverOpen, setIsCoverOpen] = useState(false);

  const {
    data: enterprise,
    isLoading,
    isError,
    refetch,
  } = useMyEnterpriseProfileQuery();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-48 w-full rounded-2xl bg-muted animate-pulse" />
        <div className="flex items-center gap-4">
          <Skeleton className="size-20 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Skeleton className="h-56 rounded-xl" />
          <Skeleton className="h-56 rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError || !enterprise) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <Building2 className="mx-auto size-10 text-muted-foreground/60 mb-3" />
        <h2 className="text-lg font-semibold text-foreground">
          {t("recruiterCompanyProfile.page.noProfileTitle")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
          {t("recruiterCompanyProfile.page.noProfileBody")}
        </p>
        <div className="mt-4 flex justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
            className="text-xs"
          >
            {t("actions.retry")}
          </Button>
        </div>
      </div>
    );
  }

  const benefitsList = t("recruiterCompanyProfile.page.defaultBenefits", { returnObjects: true }) as string[];

  const techStackList = [
    "React",
    "TypeScript",
    "Node.js",
    "PostgreSQL",
    "Tailwind CSS",
    "Docker",
    "AWS",
  ];

  const address = enterprise.address;
  const fullAddressStr = [address?.street, address?.city, address?.country]
    .filter(Boolean)
    .join(", ");

  const firstBranch = enterprise.branches?.[0];
  const branchAddressStr = firstBranch
    ? [firstBranch.street, firstBranch.city, firstBranch.country].filter(Boolean).join(", ")
    : "Tầng 8, 81 Nguyễn Chí Thanh, Đống Đa, Hà Nội, Vietnam";

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <nav className="text-xs font-medium text-muted-foreground">
        <span>{t("recruiterEmployees.page.workspace")}</span>
        <span className="mx-2">/</span>
        <span className="text-foreground">{t("sidebar.companyProfile")}</span>
      </nav>

      {/* Cover Banner with Floating Action */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-r from-zinc-800 to-zinc-900 shadow-sm">
        <div className="relative h-48 w-full sm:h-56">
          {enterprise.coverUrl ? (
            <img
              src={enterprise.coverUrl}
              alt={t("recruiterCompanyProfile.page.coverAlt", { name: enterprise.name })}
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/30 via-primary/10 to-transparent">
              <span className="text-xs font-medium text-white/60">
                {t("recruiterCompanyProfile.page.noCover")}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsCoverOpen(true)}
          className="absolute right-4 top-4 gap-1.5 backdrop-blur-md bg-white/90 text-zinc-900 hover:bg-white text-xs shadow-xs"
        >
          <Camera className="size-3.5" />
          <span>{t("recruiterCompanyProfile.page.changeCover")}</span>
        </Button>
      </div>

      {/* Profile Header Block */}
      <div className="relative -mt-16 sm:-mt-20 flex flex-col gap-4 px-4 sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
          {/* Logo container with overlay button */}
          <div className="relative group size-24 sm:size-28 shrink-0 overflow-hidden rounded-2xl border-4 border-background bg-card shadow-md">
            {enterprise.logoUrl ? (
              <img
                src={enterprise.logoUrl}
                alt={enterprise.name}
                className="size-full object-contain p-2"
              />
            ) : (
              <div className="flex size-full items-center justify-center bg-primary/10 text-2xl font-bold text-primary">
                {enterprise.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <button
              type="button"
              onClick={() => setIsLogoOpen(true)}
              className="absolute inset-0 flex items-center justify-center bg-black/60 text-white opacity-0 transition group-hover:opacity-100 cursor-pointer"
              title={t("recruiterCompanyProfile.page.changeLogo")}
              aria-label={t("recruiterCompanyProfile.page.changeLogo")}
            >
              <Camera className="size-6" />
            </button>
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {enterprise.name}
              </h1>
              <Badge className="rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium text-xs">
                {t("adminUsers.status.active")}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
              <span>
                {[
                  enterprise.industry || t("recruiterCompanyProfile.page.defaultIndustry"),
                  enterprise.companySize
                    ? t("recruiterCompanyProfile.page.sizeEmployees", { size: enterprise.companySize })
                    : t("recruiterCompanyProfile.companySize.201-500"),
                  enterprise.address?.city || "Hồ Chí Minh",
                ]
                  .filter(Boolean)
                  .join(" • ")}
              </span>
              {enterprise.website ? (
                <>
                  <span>•</span>
                  <a
                    href={
                      enterprise.website.startsWith("http")
                        ? enterprise.website
                        : `https://${enterprise.website}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline font-medium"
                  >
                    {enterprise.website.replace(/^https?:\/\//, "")}
                  </a>
                </>
              ) : null}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center sm:justify-end gap-2.5 shrink-0 pb-1">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
          >
            <Link to={`/enterprises/${enterprise.id}`} target="_blank">
              <ExternalLink className="size-3.5" />
              <span>{t("recruiterCompanyProfile.page.viewPublic")}</span>
            </Link>
          </Button>
          <Button
            size="sm"
            onClick={() => navigate(recruiterCompanyProfileEditPath())}
            className="gap-1.5 text-xs"
          >
            <Edit className="size-3.5" />
            <span>{t("recruiterCompanyProfile.page.editProfile")}</span>
          </Button>
        </div>
      </div>

      {/* Profile Details Sections */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column (2/3): About, Culture & Benefits, Media Gallery, Addresses */}
        <div className="space-y-6 lg:col-span-2">
          {/* About Card */}
          <Card className="shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">{t("recruiterCompanyProfile.page.aboutTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {enterprise.shortDescription ? (
                <p className="text-sm font-semibold text-foreground">
                  {enterprise.shortDescription}
                </p>
              ) : null}
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {enterprise.description ||
                  t("recruiterCompanyProfile.page.aboutDefault", { name: enterprise.name })}
              </p>
            </CardContent>
          </Card>

          {/* Culture and Benefits */}
          <Card className="shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                {t("recruiterCompanyProfile.page.cultureTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 text-sm">
              <p className="text-sm text-muted-foreground">
                {enterprise.cultureSummary ||
                  t("recruiterCompanyProfile.page.cultureDefault")}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("adminEnterprises.form.benefitsLabel")}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {(enterprise.benefits?.length ? enterprise.benefits : benefitsList).map((benefit, i) => (
                      <Badge
                        key={i}
                        variant="neutral"
                        className="rounded-lg px-2.5 py-1 text-xs font-normal"
                      >
                        {benefit}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("recruiterCompanyProfile.page.techStack")}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {(enterprise.techStack?.length ? enterprise.techStack : techStackList).map((tech, i) => (
                      <Badge
                        key={i}
                        variant="neutral"
                        className="rounded-lg border-border px-2.5 py-1 text-xs font-mono text-foreground"
                      >
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-border/60 text-xs text-muted-foreground">
                <Clock className="size-4 text-primary" />
                <span>
                  <Trans
                    components={{ strong: <strong className="text-foreground" /> }}
                    i18nKey="recruiterCompanyProfile.page.workingDays"
                    values={{
                      days:
                        (enterprise as unknown as { working_days?: string }).working_days ||
                        t("recruiterCompanyProfile.page.workingDaysDefault"),
                    }}
                  />
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Media Gallery */}
          <Card className="shadow-xs">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold">
                {t("recruiterCompanyProfile.page.galleryTitle")}
              </CardTitle>
              <span className="text-xs text-muted-foreground">
                {t("recruiterCompanyProfile.page.galleryCount", { count: enterprise.mediaGallery?.length || 3, max: 10 })}
              </span>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {enterprise.mediaGallery?.length ? (
                  enterprise.mediaGallery.map((imgUrl, i) => (
                    <div
                      key={i}
                      className="h-28 overflow-hidden rounded-xl border border-border bg-muted/40"
                    >
                      <img
                        src={imgUrl}
                        alt={t("recruiterCompanyProfile.page.galleryAlt", { n: i + 1 })}
                        className="size-full object-cover"
                      />
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex h-28 flex-col justify-end rounded-xl border border-border bg-gradient-to-br from-amber-500/10 to-orange-500/20 p-2.5 text-xs font-medium text-foreground">
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <ImageIcon className="size-3" /> {t("recruiterCompanyProfile.page.galleryOffice")}
                      </span>
                    </div>
                    <div className="flex h-28 flex-col justify-end rounded-xl border border-border bg-gradient-to-br from-blue-500/10 to-indigo-500/20 p-2.5 text-xs font-medium text-foreground">
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <ImageIcon className="size-3" /> {t("recruiterCompanyProfile.page.galleryMeeting")}
                      </span>
                    </div>
                    <div className="flex h-28 flex-col justify-end rounded-xl border border-border bg-gradient-to-br from-emerald-500/10 to-teal-500/20 p-2.5 text-xs font-medium text-foreground">
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <ImageIcon className="size-3" /> {t("recruiterCompanyProfile.page.galleryEvent")}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Addresses */}
          <Card className="shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                {t("recruiterCompanyProfile.page.addressesTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 rounded-xl border border-border/80 bg-muted/20 p-3.5">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-foreground">
                        {t("recruiterCompanyProfile.page.headquarters")}
                      </span>
                      <Badge variant="neutral" className="text-[10px] py-0">
                        {t("recruiterCompanyProfile.page.mainOffice")}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      {fullAddressStr ||
                        "12 Tôn Đản, Phường 13, Quận 4, Hồ Chí Minh, Vietnam"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-border/80 bg-muted/20 p-3.5">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div>
                    <span className="font-semibold text-xs text-foreground">
                      {t("recruiterCompanyProfile.page.branchOffice")}
                    </span>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      {branchAddressStr}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1/3): Business, Contact, Job Postings, Legal */}
        <div className="space-y-6">
          {/* Business Card */}
          <Card className="shadow-xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">{t("recruiterCompanyProfile.page.businessTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <span className="text-muted-foreground">{t("adminEnterprises.detail.industry")}</span>
                <span className="font-semibold text-foreground">
                  {enterprise.industry || t("recruiterCompanyProfile.page.industryDefault")}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <span className="text-muted-foreground">{t("adminEnterprises.detail.subIndustries")}</span>
                <span className="font-semibold text-foreground text-right">
                  {enterprise.subIndustries?.length
                    ? enterprise.subIndustries.join(", ")
                    : t("recruiterCompanyProfile.page.subIndustriesDefault")}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <span className="text-muted-foreground">{t("adminEnterprises.detail.companyType")}</span>
                <span className="font-semibold text-foreground">
                  {(enterprise as unknown as { company_type?: string }).company_type ||
                    enterprise.companyType ||
                    t("recruiterCompanyProfile.companyType.product")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("adminEnterprises.detail.foundedYear")}</span>
                <span className="font-semibold text-foreground">
                  {enterprise.foundedYear ? `${enterprise.foundedYear}` : t("recruiterCompanyProfile.page.established")}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Contact Card */}
          <Card className="shadow-xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">{t("adminEnterprises.detail.contact")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <span className="text-muted-foreground">{t("adminEnterprises.detail.email")}</span>
                <span className="font-semibold text-foreground truncate max-w-[180px]">
                  {enterprise.email}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <span className="text-muted-foreground">{t("adminEnterprises.detail.phone")}</span>
                <span className="font-mono font-semibold text-foreground">
                  {enterprise.phone || "—"}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <span className="text-muted-foreground">{t("adminEnterprises.detail.website")}</span>
                {enterprise.website ? (
                  <a
                    href={
                      enterprise.website.startsWith("http")
                        ? enterprise.website
                        : `https://${enterprise.website}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-primary hover:underline truncate max-w-[180px]"
                  >
                    {enterprise.website}
                  </a>
                ) : (
                  <span className="font-medium text-muted-foreground">—</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("recruiterCompanyProfile.page.social")}</span>
                <span className="font-semibold text-primary">
                  LinkedIn · Facebook · GitHub
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Job Postings Card */}
          <Card className="shadow-xs">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold">
                {t("sidebar.jobPostings")}
              </CardTitle>
              <Link
                to="/recruiter/job-postings"
                className="text-xs font-semibold text-primary hover:underline"
              >
                {t("recruiterCompanyProfile.page.manage")}
              </Link>
            </CardHeader>
            <CardContent className="text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("recruiterCompanyProfile.page.activeOpenings")}</span>
                <Badge
                  variant="neutral"
                  className="rounded-full px-2.5 py-0.5 font-semibold text-xs"
                >
                  <Briefcase className="mr-1 size-3" />
                  {t("recruiterCompanyProfile.page.activeCount", { count: enterprise.activeJobsCount ?? 0 })}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Legal & Corporate Card */}
          <Card className="shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                {t("recruiterCompanyProfile.page.legalTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="space-y-1 border-b border-border/60 pb-2.5">
                <span className="text-muted-foreground">
                  {t("recruiterCompanyProfile.page.legalName")}
                </span>
                <p className="font-semibold text-foreground">
                  {(enterprise as unknown as { legal_name?: string })
                    .legal_name || enterprise.name}
                </p>
              </div>

              <div className="space-y-1 border-b border-border/60 pb-2.5">
                <span className="text-muted-foreground">
                  {t("recruiterCompanyProfile.page.taxCode")}
                </span>
                <p className="font-mono font-semibold text-foreground">
                  {enterprise.taxCode || "9999999999"}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-muted-foreground">
                  {t("recruiterCompanyProfile.page.registrationNumber")}
                </span>
                <p className="font-mono font-medium text-foreground">
                  {(enterprise as unknown as { registration_number?: string })
                    .registration_number || "REG-VN-031234"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Edit CTA Card */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs space-y-2.5">
            <div className="flex items-center gap-2 font-semibold text-primary">
              <Sparkles className="size-4" />
              <span>{t("recruiterCompanyProfile.page.ctaTitle")}</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              {t("recruiterCompanyProfile.page.ctaBody")}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(recruiterCompanyProfileEditPath())}
              className="w-full text-xs"
            >
              {t("recruiterCompanyProfile.page.ctaButton")}
            </Button>
          </div>
        </div>
      </div>

      {/* Dialogs for Logo and Cover */}
      <ChangeLogoDialog
        open={isLogoOpen}
        onOpenChange={setIsLogoOpen}
        enterprise={enterprise}
      />
      <ChangeCoverDialog
        open={isCoverOpen}
        onOpenChange={setIsCoverOpen}
        enterprise={enterprise}
      />
    </div>
  );
}

export { RecruiterCompanyProfilePage as CompanyProfilePage };
