import { useState } from "react";
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
          No enterprise profile linked
        </h2>
        <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
          Your account is not currently affiliated with an enterprise workspace.
          Please contact your organization administrator.
        </p>
        <div className="mt-4 flex justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
            className="text-xs"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const benefitsList = [
    "13th-month salary",
    "Premium health insurance",
    "Hybrid work flexibility",
    "Annual learning budget",
    "Top-tier equipment",
  ];

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
        <span>Workspace</span>
        <span className="mx-2">/</span>
        <span className="text-foreground">Company profile</span>
      </nav>

      {/* Cover Banner with Floating Action */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-r from-zinc-800 to-zinc-900 shadow-sm">
        <div className="relative h-48 w-full sm:h-56">
          {enterprise.coverUrl ? (
            <img
              src={enterprise.coverUrl}
              alt={`${enterprise.name} Cover Banner`}
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/30 via-primary/10 to-transparent">
              <span className="text-xs font-medium text-white/60">
                No cover image set
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
          <span>Change cover</span>
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
              title="Change logo"
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
                Active
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
              <span>
                {[
                  enterprise.industry || "Technology",
                  enterprise.companySize
                    ? `${enterprise.companySize} employees`
                    : "201–500 employees",
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
              <span>View public page</span>
            </Link>
          </Button>
          <Button
            size="sm"
            onClick={() => navigate(recruiterCompanyProfileEditPath())}
            className="gap-1.5 text-xs"
          >
            <Edit className="size-3.5" />
            <span>Edit profile</span>
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
              <CardTitle className="text-base font-semibold">About</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {enterprise.shortDescription ? (
                <p className="text-sm font-semibold text-foreground">
                  {enterprise.shortDescription}
                </p>
              ) : null}
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {enterprise.description ||
                  `${enterprise.name} provides cutting-edge digital technology solutions and enterprise software. Our team delivers high-impact systems with a customer-first focus.`}
              </p>
            </CardContent>
          </Card>

          {/* Culture and Benefits */}
          <Card className="shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                Culture and benefits
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 text-sm">
              <p className="text-sm text-muted-foreground">
                {enterprise.cultureSummary ||
                  "Small squads, weekly demos and a written-first culture."}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Benefits & Perks
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
                    Tech stack
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
                  Working days:{" "}
                  <strong className="text-foreground">
                    {(enterprise as unknown as { working_days?: string }).working_days || "Monday – Friday"}
                  </strong>
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Media Gallery */}
          <Card className="shadow-xs">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold">
                Media gallery
              </CardTitle>
              <span className="text-xs text-muted-foreground">
                {enterprise.mediaGallery?.length || 3} of 10
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
                        alt={`Gallery ${i + 1}`}
                        className="size-full object-cover"
                      />
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex h-28 flex-col justify-end rounded-xl border border-border bg-gradient-to-br from-amber-500/10 to-orange-500/20 p-2.5 text-xs font-medium text-foreground">
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <ImageIcon className="size-3" /> Office space
                      </span>
                    </div>
                    <div className="flex h-28 flex-col justify-end rounded-xl border border-border bg-gradient-to-br from-blue-500/10 to-indigo-500/20 p-2.5 text-xs font-medium text-foreground">
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <ImageIcon className="size-3" /> Team meeting
                      </span>
                    </div>
                    <div className="flex h-28 flex-col justify-end rounded-xl border border-border bg-gradient-to-br from-emerald-500/10 to-teal-500/20 p-2.5 text-xs font-medium text-foreground">
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <ImageIcon className="size-3" /> Community event
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
                Addresses
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 rounded-xl border border-border/80 bg-muted/20 p-3.5">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-foreground">
                        Headquarters
                      </span>
                      <Badge variant="neutral" className="text-[10px] py-0">
                        Main office
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
                      Branch office
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
              <CardTitle className="text-base font-semibold">Business</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <span className="text-muted-foreground">Industry</span>
                <span className="font-semibold text-foreground">
                  {enterprise.industry || "Information Technology"}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <span className="text-muted-foreground">Sub-industries</span>
                <span className="font-semibold text-foreground text-right">
                  {enterprise.subIndustries?.length
                    ? enterprise.subIndustries.join(", ")
                    : "Payments, Digital banking, Cloud"}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <span className="text-muted-foreground">Company type</span>
                <span className="font-semibold text-foreground">
                  {(enterprise as unknown as { company_type?: string }).company_type ||
                    enterprise.companyType ||
                    "Product"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Founded year</span>
                <span className="font-semibold text-foreground">
                  {enterprise.foundedYear ? `${enterprise.foundedYear}` : "Established"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Contact Card */}
          <Card className="shadow-xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <span className="text-muted-foreground">Corporate email</span>
                <span className="font-semibold text-foreground truncate max-w-[180px]">
                  {enterprise.email}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <span className="text-muted-foreground">Phone</span>
                <span className="font-mono font-semibold text-foreground">
                  {enterprise.phone || "—"}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <span className="text-muted-foreground">Website</span>
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
                <span className="text-muted-foreground">Social</span>
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
                Job postings
              </CardTitle>
              <Link
                to="/recruiter/job-postings"
                className="text-xs font-semibold text-primary hover:underline"
              >
                Manage
              </Link>
            </CardHeader>
            <CardContent className="text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Active openings</span>
                <Badge
                  variant="neutral"
                  className="rounded-full px-2.5 py-0.5 font-semibold text-xs"
                >
                  <Briefcase className="mr-1 size-3" />
                  {enterprise.activeJobsCount ?? 0} active
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Legal & Corporate Card */}
          <Card className="shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                Legal & Corporate
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="space-y-1 border-b border-border/60 pb-2.5">
                <span className="text-muted-foreground">
                  Legal corporate name
                </span>
                <p className="font-semibold text-foreground">
                  {(enterprise as unknown as { legal_name?: string })
                    .legal_name || enterprise.name}
                </p>
              </div>

              <div className="space-y-1 border-b border-border/60 pb-2.5">
                <span className="text-muted-foreground">
                  Tax identification code
                </span>
                <p className="font-mono font-semibold text-foreground">
                  {enterprise.taxCode || "9999999999"}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-muted-foreground">
                  Registration number
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
              <span>Keep your company profile fresh</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Updated company information and brand imagery attract 40% more
              candidate applications.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(recruiterCompanyProfileEditPath())}
              className="w-full text-xs"
            >
              Update company profile
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
