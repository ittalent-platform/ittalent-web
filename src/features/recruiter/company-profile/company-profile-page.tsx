import { useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  Building2,
  Camera,
  Clock,
  Edit,
  ExternalLink,
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
              <span>{enterprise.industry || "Technology"}</span>
              <span>•</span>
              <span>
                {enterprise.companySize
                  ? `${enterprise.companySize} employees`
                  : "201–500 employees"}
              </span>
              <span>•</span>
              <span>{enterprise.address?.city || "Hồ Chí Minh"}</span>
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
        {/* Left Column (2/3): About, Culture & Benefits */}
        <div className="space-y-6 lg:col-span-2">
          {/* About Card */}
          <Card className="shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">About</CardTitle>
            </CardHeader>
            <CardContent>
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
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Benefits & Perks
                </span>
                <div className="flex flex-wrap gap-2">
                  {benefitsList.map((benefit, i) => (
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
                  {techStackList.map((tech, i) => (
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

              <div className="flex items-center gap-2 pt-2 border-t border-border/60 text-xs text-muted-foreground">
                <Clock className="size-4 text-primary" />
                <span>
                  Working days: <strong>Monday – Friday</strong>
                </span>
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
              <div className="flex items-start gap-3 rounded-lg border border-border/80 bg-muted/20 p-3.5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">
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
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1/3): Legal & Contact Info */}
        <div className="space-y-6">
          <Card className="shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                Legal & Corporate
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5 text-xs">
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
                  {enterprise.taxCode || "0312 345 678"}
                </p>
              </div>

              <div className="space-y-1 border-b border-border/60 pb-2.5">
                <span className="text-muted-foreground">Corporate email</span>
                <p className="font-medium text-foreground">
                  {enterprise.email}
                </p>
              </div>

              <div className="space-y-1 border-b border-border/60 pb-2.5">
                <span className="text-muted-foreground">Phone number</span>
                <p className="font-mono font-medium text-foreground">
                  {enterprise.phone}
                </p>
              </div>

              {enterprise.website ? (
                <div className="space-y-1">
                  <span className="text-muted-foreground">
                    Official website
                  </span>
                  <a
                    href={
                      enterprise.website.startsWith("http")
                        ? enterprise.website
                        : `https://${enterprise.website}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="block font-medium text-primary hover:underline truncate"
                  >
                    {enterprise.website}
                  </a>
                </div>
              ) : null}
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
