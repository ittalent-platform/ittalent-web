import { useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, Ban, Check, ExternalLink, Globe, Mail, MapPin, Pencil, Phone } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Breadcrumb } from "@/components/common/breadcrumb";
import { DetailRow } from "@/components/common/detail-row";
import { RailCard } from "@/components/common/rail-card";
import { ErrorState } from "@/components/common/error-state";
import { useToast } from "@/components/toast/toast-provider";
import {
  EnterpriseAvatar,
  EnterpriseStatusBadge,
  CompanyTypeBadge,
} from "./enterprise-badges";
import { formatEnterpriseDateTime, formatTaxCode } from "./enterprises.formatters";
import {
  useEnterpriseDetailQuery,
  useUpdateEnterpriseStatusMutation,
} from "./enterprises.queries";
import {
  ActivateEnterpriseDialog,
  SuspendEnterpriseDialog,
} from "./enterprise-dialogs";

export function AdminEnterpriseDetailPage() {
  const { t } = useTranslation();
  const { enterpriseId = "" } = useParams<{ enterpriseId: string }>();
  const toast = useToast();

  const [isSuspendOpen, setIsSuspendOpen] = useState(false);
  const [isActivateOpen, setIsActivateOpen] = useState(false);

  const detailQuery = useEnterpriseDetailQuery(enterpriseId);
  const updateStatusMutation = useUpdateEnterpriseStatusMutation(enterpriseId);

  const enterprise = detailQuery.data;

  if (detailQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-48 rounded" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="size-16 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-64 rounded" />
              <Skeleton className="h-4 w-32 rounded" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24 rounded-lg" />
            <Skeleton className="h-10 w-28 rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
          <div className="lg:col-span-4 space-y-6">
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (detailQuery.isError || !enterprise) {
    return (
      <ErrorState
        title={t("adminEnterprises.detail.notFoundTitle", "Enterprise not found")}
        description={t(
          "adminEnterprises.detail.notFoundDescription",
          "The requested enterprise profile could not be loaded or was removed.",
        )}
      />
    );
  }

  const isActive = enterprise.status?.toLowerCase() === "active";
  const address = enterprise.address as {
    street?: string;
    district?: string;
    city?: string;
    postal_code?: string;
    postalCode?: string;
    country?: string;
  } | undefined;
  const postalCode = address?.postal_code || address?.postalCode;

  async function handleConfirmSuspend(reason: string) {
    try {
      await updateStatusMutation.mutateAsync({
        status: "suspended",
        reason,
      });
      toast.showToast({
        tone: "warning",
        title: "Enterprise suspended",
        message: `${enterprise?.name} has been suspended.`,
      });
      setIsSuspendOpen(false);
    } catch {
      toast.showToast({
        tone: "error",
        title: "Suspension failed",
        message: "Could not suspend enterprise. Please try again.",
      });
    }
  }

  async function handleConfirmActivate(reason?: string) {
    try {
      await updateStatusMutation.mutateAsync({
        status: "active",
        reason,
      });
      toast.showToast({
        tone: "success",
        title: "Enterprise activated",
        message: `${enterprise?.name} is now active.`,
      });
      setIsActivateOpen(false);
    } catch {
      toast.showToast({
        tone: "error",
        title: "Activation failed",
        message: "Could not activate enterprise. Please try again.",
      });
    }
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        ariaLabel={t("adminEnterprises.page.title", "Enterprise Profiles")}
        items={[
          { label: t("adminEnterprises.page.title", "Enterprise Profiles"), to: "/admin/enterprises" },
          { label: enterprise.name, mono: false },
        ]}
      />

      {/* Flat Header: Title + Status + Action buttons (Edit & Suspend only, NO delete button) */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-4 min-w-0">
          <EnterpriseAvatar
            name={enterprise.name}
            logoUrl={enterprise.logoUrl}
            size="xl"
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="itt-display text-2xl font-bold tracking-tight text-foreground truncate">
                {enterprise.name}
              </h1>
              <EnterpriseStatusBadge status={enterprise.status} />
              <CompanyTypeBadge type={enterprise.companyType} />
            </div>
            {enterprise.shortDescription ? (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                {enterprise.shortDescription}
              </p>
            ) : null}
          </div>
        </div>

        {/* Header Actions: Back, Edit, and Suspend/Activate */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button asChild variant="outline" size="sm" className="h-9 px-3 gap-1.5 border-border">
            <Link to="/admin/enterprises">
              <ArrowLeft className="size-4" />
              <span>{t("adminEnterprises.detail.back", "Back to enterprises")}</span>
            </Link>
          </Button>

          <Button asChild variant="outline" size="sm" className="h-9 px-3.5 gap-1.5 border-border">
            <Link to={`/admin/enterprises/${enterprise.id}/edit`}>
              <Pencil className="size-4 text-muted-foreground" />
              <span>{t("adminEnterprises.detail.edit", "Edit")}</span>
            </Link>
          </Button>

          {isActive ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setIsSuspendOpen(true)}
              className="h-9 px-3.5 gap-1.5 shadow-xs"
            >
              <Ban className="size-4" />
              <span>{t("adminEnterprises.detail.suspend", "Suspend")}</span>
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={() => setIsActivateOpen(true)}
              className="h-9 px-3.5 gap-1.5 bg-(--status-success-fg) hover:bg-(--status-success-fg)/90 text-white shadow-xs"
            >
              <Check className="size-4" />
              <span>{t("adminEnterprises.detail.activate", "Activate")}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Overview, Contact & Address, Tech Stack & Benefits */}
        <div className="lg:col-span-8 space-y-6">
          {/* Overview Card */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-2xs">
            <h2 className="text-base font-bold text-foreground mb-4">
              {t("adminEnterprises.detail.overview", "Company Overview")}
            </h2>
            <div className="space-y-0.5">
              <DetailRow
                layout="grid"
                label={t("adminEnterprises.detail.legalName", "Legal name")}
                value={enterprise.legalName || "—"}
              />
              <DetailRow
                layout="grid"
                label={t("adminEnterprises.detail.taxCode", "Tax code")}
                value={
                  <span className="font-mono font-semibold">
                    {formatTaxCode(enterprise.taxCode)}
                  </span>
                }
              />
              <DetailRow
                layout="grid"
                label={t("adminEnterprises.detail.registrationNumber", "Business registration")}
                value={enterprise.registrationNumber || "—"}
              />
              <DetailRow
                layout="grid"
                label={t("adminEnterprises.detail.industry", "Industry")}
                value={enterprise.industry || "—"}
              />
              <DetailRow
                layout="grid"
                label={t("adminEnterprises.detail.companyType", "Company type")}
                value={enterprise.companyType || "—"}
              />
              <DetailRow
                layout="grid"
                label={t("adminEnterprises.detail.companySize", "Company size")}
                value={enterprise.companySize || "—"}
              />
              <DetailRow
                layout="grid"
                label={t("adminEnterprises.detail.foundedYear", "Founded year")}
                value={enterprise.foundedYear ? String(enterprise.foundedYear) : "—"}
              />
              <DetailRow
                layout="grid"
                label={t("adminEnterprises.detail.activeJobs", "Active jobs")}
                value={enterprise.activeJobsCount}
              />
              {enterprise.description ? (
                <DetailRow
                  layout="grid"
                  label="Description"
                  value={
                    <p className="whitespace-pre-line text-sm text-foreground/90 leading-relaxed">
                      {enterprise.description}
                    </p>
                  }
                />
              ) : null}
            </div>
          </section>

          {/* Contact & Location Card */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-2xs">
            <h2 className="text-base font-bold text-foreground mb-4">
              {t("adminEnterprises.detail.contact", "Contact & Location")}
            </h2>
            <div className="space-y-0.5">
              <DetailRow
                layout="grid"
                label={t("adminEnterprises.detail.website", "Website")}
                value={
                  enterprise.website ? (
                    <a
                      href={enterprise.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-primary hover:underline font-medium"
                    >
                      <Globe className="size-3.5" />
                      <span>{enterprise.website}</span>
                      <ExternalLink className="size-3" />
                    </a>
                  ) : (
                    "—"
                  )
                }
              />
              <DetailRow
                layout="grid"
                label={t("adminEnterprises.detail.email", "Corporate email")}
                value={
                  <div className="inline-flex items-center gap-1.5">
                    <Mail className="size-3.5 text-muted-foreground" />
                    <span className="font-mono text-xs">{enterprise.email}</span>
                  </div>
                }
              />
              <DetailRow
                layout="grid"
                label={t("adminEnterprises.detail.phone", "Phone")}
                value={
                  <div className="inline-flex items-center gap-1.5">
                    <Phone className="size-3.5 text-muted-foreground" />
                    <span>{enterprise.phone}</span>
                  </div>
                }
              />
              <DetailRow
                layout="grid"
                label={t("adminEnterprises.detail.address", "Address")}
                value={
                  <div className="flex items-start gap-1.5">
                    <MapPin className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <span>
                      {[
                        address?.street,
                        address?.district,
                        address?.city,
                        postalCode ? `Postal: ${postalCode}` : null,
                        address?.country,
                      ]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </span>
                  </div>
                }
              />
            </div>
          </section>

          {/* Tech Stack & Benefits Card */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-2xs">
            <h2 className="text-base font-bold text-foreground mb-4">
              {t("adminEnterprises.detail.techStack", "Tech Stack & Benefits")}
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Tech Stack
                </h3>
                {enterprise.techStack && enterprise.techStack.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {enterprise.techStack.map((tech) => (
                      <Badge
                        key={tech}
                        variant="neutral"
                        className="bg-secondary text-secondary-foreground text-xs px-2.5 py-1 rounded-md"
                      >
                        {tech}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {t("adminEnterprises.detail.noTechStack", "No tech stack specified")}
                  </p>
                )}
              </div>

              <div className="border-t border-border pt-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Benefits & Perks
                </h3>
                {enterprise.benefits && enterprise.benefits.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {enterprise.benefits.map((benefit) => (
                      <Badge
                        key={benefit}
                        variant="neutral"
                        className="border border-border text-foreground text-xs px-2.5 py-1 rounded-md"
                      >
                        {benefit}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {t("adminEnterprises.detail.noBenefits", "No benefits specified")}
                  </p>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Right Column (4 cols): Metadata Rail Card */}
        <div className="lg:col-span-4 space-y-6">
          <RailCard title={t("adminEnterprises.detail.metadata", "Profile Metadata")}>
            <div className="space-y-1">
              <DetailRow
                layout="split"
                label={t("adminEnterprises.table.status", "Status")}
                value={<EnterpriseStatusBadge status={enterprise.status} />}
              />
              <DetailRow
                layout="split"
                label={t("adminEnterprises.detail.createdAt", "Created at")}
                value={formatEnterpriseDateTime(enterprise.createdAt)}
              />
              <DetailRow
                layout="split"
                label={t("adminEnterprises.detail.createdBy", "Created by")}
                value={<span className="font-mono text-xs">{enterprise.creatorAccountId || "admin"}</span>}
              />
              <DetailRow
                layout="split"
                label={t("adminEnterprises.detail.updatedAt", "Last updated")}
                value={formatEnterpriseDateTime(enterprise.updatedAt)}
              />
              {enterprise.statusReason ? (
                <DetailRow
                  layout="split"
                  label="Status reason"
                  value={<span className="text-xs text-destructive">{enterprise.statusReason}</span>}
                />
              ) : null}
            </div>
          </RailCard>
        </div>
      </div>

      {/* Suspend and Activate Dialogs */}
      {isSuspendOpen && (
        <SuspendEnterpriseDialog
          isOpen={true}
          enterpriseName={enterprise.name}
          activeJobsCount={enterprise.activeJobsCount}
          onClose={() => setIsSuspendOpen(false)}
          onConfirm={handleConfirmSuspend}
        />
      )}

      {isActivateOpen && (
        <ActivateEnterpriseDialog
          isOpen={true}
          enterpriseName={enterprise.name}
          previousReason={enterprise.statusReason}
          onClose={() => setIsActivateOpen(false)}
          onConfirm={handleConfirmActivate}
        />
      )}
    </div>
  );
}
