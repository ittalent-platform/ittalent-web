import { useState } from "react";
import { Link, useParams } from "react-router";
import { Ban, Check, MapPin, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/common/admin-page-header";
import { Breadcrumb } from "@/components/common/breadcrumb";
import { ErrorState } from "@/components/common/error-state";
import { Field, FieldGrid } from "@/components/common/field-grid";
import { LogoTile } from "@/components/common/logo-tile";
import { SectionCard } from "@/components/common/section-card";
import {
  EnterpriseStatusBadge,
  CompanyTypeBadge,
  formatEnterpriseId,
} from "./enterprise-badges";
import { getEnterpriseActions, SOCIAL_LINK_LABELS } from "./enterprises.constants";
import { formatEnterpriseDateTime, formatTaxCode } from "./enterprises.formatters";
import { useEnterpriseDetailQuery } from "./enterprises.queries";
import { useEnterpriseStatusActions } from "./use-enterprise-status-actions";
import {
  ActivateEnterpriseDialog,
  SuspendEnterpriseDialog,
} from "./enterprise-dialogs";

export function AdminEnterpriseDetailPage() {
  const { t } = useTranslation();
  const { enterpriseId = "" } = useParams<{ enterpriseId: string }>();

  const [isSuspendOpen, setIsSuspendOpen] = useState(false);
  const [isActivateOpen, setIsActivateOpen] = useState(false);

  const detailQuery = useEnterpriseDetailQuery(enterpriseId);
  const statusActions = useEnterpriseStatusActions(detailQuery.data ?? null);

  const enterprise = detailQuery.data;

  if (detailQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-48 rounded" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="size-14 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-64 rounded" />
              <Skeleton className="h-4 w-32 rounded" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-11 w-24 rounded-xl" />
            <Skeleton className="h-11 w-28 rounded-xl" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-[18px]">
          <Skeleton className="h-96 w-full rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
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

  const actions = getEnterpriseActions(enterprise.status);
  const extraJobCounts = enterprise as {
    draftJobsCount?: number;
    closedJobsCount?: number;
  };
  const jobCounts = [
    { key: "open", label: "Open", value: enterprise.activeJobsCount },
    { key: "draft", label: "Draft", value: extraJobCounts.draftJobsCount },
    { key: "closed", label: "Closed", value: extraJobCounts.closedJobsCount },
  ].filter((item) => item.value !== undefined);
  const socialLinks = SOCIAL_LINK_LABELS.flatMap(([key, label]) => {
    const href = enterprise.socialLinks?.[key];
    return href ? [{ label, href }] : [];
  });
  const address = enterprise.address as {
    street?: string;
    district?: string;
    city?: string;
    postal_code?: string;
    postalCode?: string;
    country?: string;
  } | undefined;
  const addresses = [
    ...(address?.street || address?.city ? [{ key: "hq", label: "Headquarters", value: address }] : []),
    ...(enterprise.branches ?? []).map((branch, index) => ({ key: `branch-${index}`, label: "Branch", value: branch })),
  ];

  return (
    <div className="space-y-5">
      <div className="flex">
        <Breadcrumb
          ariaLabel="Breadcrumb"
          items={[
            { label: t("adminEnterprises.page.title", "Enterprise Profiles"), to: "/admin/enterprises" },
            { label: formatEnterpriseId(enterprise.id), mono: true },
          ]}
        />
      </div>

      <PageHeader
        actions={
          <>
            <Button asChild shape="xl" size="xl" variant="outline">
              <Link to={`/admin/enterprises/${enterprise.id}/edit`}>
                <Pencil aria-hidden className="size-4" />
                {t("adminEnterprises.detail.edit", "Edit")}
              </Link>
            </Button>
            {actions.canSuspend ? (
              <Button onClick={() => setIsSuspendOpen(true)} shape="xl" size="xl" type="button" variant="warning-solid">
                <Ban aria-hidden className="size-4" />
                {t("adminEnterprises.detail.suspend", "Suspend")}
              </Button>
            ) : actions.canActivate ? (
              <Button onClick={() => setIsActivateOpen(true)} shape="xl" size="xl" type="button" variant="success-solid">
                <Check aria-hidden className="size-4" />
                {t("adminEnterprises.detail.activate", "Activate")}
              </Button>
            ) : null}
          </>
        }
        description={<span className="line-clamp-1">{[enterprise.email, enterprise.industry, address?.city].filter(Boolean).join(" · ")}</span>}
        leading={<LogoTile logoUrl={enterprise.logoUrl ?? undefined} name={enterprise.name} size="xl" />}
        title={enterprise.name}
        titleAddon={<><EnterpriseStatusBadge status={enterprise.status} /><CompanyTypeBadge type={enterprise.companyType} /></>}
      />

      {/* Main Grid: minmax(0, 1fr) left column + 380px right rail */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-[18px] items-start">
        {/* Left Column Cards */}
        <div className="flex flex-col gap-[18px]">
          {/* Legal identity Card */}
          <SectionCard title={t("adminEnterprises.form.legalTax", "Legal identity")}>
            <FieldGrid>
              <Field label="Display name">{enterprise.name}</Field>
              <Field label="Legal name">{enterprise.legalName || "—"}</Field>
              <Field label="Tax code">
                  <span className="font-mono text-xs text-foreground font-semibold">{formatTaxCode(enterprise.taxCode)}</span>
                </Field>
              <Field label="Registration number">{enterprise.registrationNumber || "Not provided"}</Field>
              <Field label="Founded">{enterprise.foundedYear ? String(enterprise.foundedYear) : "—"}</Field>
              <Field label="Enterprise ID">
                  <span className="font-mono text-xs text-foreground font-semibold">{formatEnterpriseId(enterprise.id)}</span>
                </Field>
            </FieldGrid>
          </SectionCard>

          {/* Contact Card */}
          <SectionCard title={t("adminEnterprises.detail.contact", "Contact")}>
            <FieldGrid>
              <Field label="Corporate email">{enterprise.email || "—"}</Field>
              <Field label="Phone">{enterprise.phone || "—"}</Field>
              <Field label="Website">
                  {enterprise.website ? (
                    <a href={enterprise.website} target="_blank" rel="noopener noreferrer" className="text-foreground hover:underline">
                      {enterprise.website.replace(/^https?:\/\//, "")}
                    </a>
                  ) : "—"}
                </Field>
              <Field label="Social links">
                  {socialLinks.length > 0 ? (
                    <span className="inline-flex flex-wrap gap-3 text-brand">
                      {socialLinks.map((link) => (
                        <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          {link.label}
                        </a>
                      ))}
                    </span>
                  ) : (
                    "—"
                  )}
                </Field>
            </FieldGrid>
          </SectionCard>

          {/* Business Card */}
          <SectionCard title="Business">
            <FieldGrid>
              <Field label="Industry">{enterprise.industry || "—"}</Field>
              <Field label="Company size">
                  {enterprise.companySize ? `${enterprise.companySize} employees` : "—"}
                </Field>
              <Field label="Company type">{enterprise.companyType || "—"}</Field>
              <Field label="Working days">{enterprise.workingDays || "—"}</Field>
              {enterprise.subIndustries && enterprise.subIndustries.length > 0 ? (
                <Field className="sm:col-span-2" label={t("adminEnterprises.detail.subIndustries", "Sub-industries")}>
                  <TagList items={enterprise.subIndustries} />
                </Field>
              ) : null}
            </FieldGrid>
          </SectionCard>

          {/* Addresses Card */}
          {addresses.length > 0 ? (
            <SectionCard title="Addresses">
              {addresses.map((item) => {
                const postal = item.value.postal_code;
                return (
                  <div key={item.key} className="flex gap-3 p-3.5 rounded-xl border border-border/70 bg-background dark:bg-muted/30">
                    <MapPin className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-[13.5px] text-foreground">
                        {item.key === "hq" ? "Headquarters" : t("adminEnterprises.detail.branch", "Branch")}
                      </span>
                      <span className="text-[13.5px] leading-relaxed text-foreground/70 dark:text-muted-foreground">
                        {[item.value.street, item.value.district].filter(Boolean).join(", ")}
                        <br />
                        {[item.value.city, item.value.country].filter(Boolean).join(", ")}
                        {postal ? ` · ${postal}` : ""}
                      </span>
                    </div>
                  </div>
                );
              })}
            </SectionCard>
          ) : null}

          {/* Public Profile Card */}
          <SectionCard title="Public profile">
            <div className="flex flex-col gap-4">
              {/* Gradient cover banner with avatar overlay */}
              <div
                className="h-[120px] rounded-[14px] bg-gradient-to-r from-foreground via-foreground/80 to-brand relative bg-cover bg-center"
                style={enterprise.coverUrl ? { backgroundImage: `url(${enterprise.coverUrl})` } : undefined} /* dynamic: runtime value */
              >
                <span className="absolute left-[18px] -bottom-[22px] border-4 border-card rounded-2xl">
                  <LogoTile logoUrl={enterprise.logoUrl ?? undefined} name={enterprise.name} size="lg" />
                </span>
              </div>
              <div className="h-3" />

              {enterprise.shortDescription ? (
                <div className="flex flex-col gap-1.5">
                  <span className="text-[13px] text-muted-foreground">Short description</span>
                  <p className="text-[14.5px] font-semibold text-foreground">{enterprise.shortDescription}</p>
                </div>
              ) : null}

              {enterprise.description ? (
                <div className="flex flex-col gap-1.5">
                  <span className="text-[13px] text-muted-foreground">Description</span>
                  <p className="text-[14px] text-foreground/70 dark:text-muted-foreground leading-relaxed whitespace-pre-line">
                    {enterprise.description}
                  </p>
                </div>
              ) : null}

              {enterprise.cultureSummary ? (
                <div className="flex flex-col gap-1.5">
                  <span className="text-[13px] text-muted-foreground">{t("adminEnterprises.detail.culture", "Culture")}</span>
                  <p className="text-[14px] text-foreground/70 dark:text-muted-foreground leading-relaxed whitespace-pre-line">
                    {enterprise.cultureSummary}
                  </p>
                </div>
              ) : null}

              {/* Benefits & Tech Stack */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5 pt-2">
                <div className="flex flex-col gap-2">
                  <span className="text-[13px] text-muted-foreground">Benefits</span>
                  {enterprise.benefits && enterprise.benefits.length > 0 ? (
                    <TagList items={enterprise.benefits} />
                  ) : (
                    <span className="text-xs text-muted-foreground">No benefits specified</span>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-[13px] text-muted-foreground">Tech stack</span>
                  {enterprise.techStack && enterprise.techStack.length > 0 ? (
                    <TagList items={enterprise.techStack} />
                  ) : (
                    <span className="text-xs text-muted-foreground">No tech stack specified</span>
                  )}
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Right Column (380px) Cards */}
        <div className="flex flex-col gap-[18px]">
          {/* Status Card */}
          <SectionCard title="Status">
            <div className="flex items-center gap-2.5">
              <EnterpriseStatusBadge status={enterprise.status} />
            </div>
            {enterprise.statusReason ? (
              <dl className={FACT_ROWS_CLASS}>
                <dt className="text-muted-foreground">Reason</dt>
                <dd>{enterprise.statusReason}</dd>
              </dl>
            ) : null}
            <p className="text-[12.5px] leading-relaxed text-muted-foreground m-0">
              Active enterprises are public and can publish jobs. Suspending hides the company and its jobs.
            </p>
          </SectionCard>

          {/* Job Postings Card */}
          <SectionCard title="Job postings">
            <div className="flex gap-2.5">
              {jobCounts.map((item) => (
                <div key={item.key} className="flex-1 p-3.5 rounded-xl border border-border bg-card flex flex-col gap-0.5">
                  <span className="text-xl font-bold text-foreground">{item.value}</span>
                  <span className="text-[12.5px] text-muted-foreground">{item.label}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Record Card */}
          <SectionCard title="Record">
            <dl className={FACT_ROWS_CLASS}>
              <dt className="text-muted-foreground">Created</dt>
              <dd>{formatEnterpriseDateTime(enterprise.createdAt)}</dd>
              <dt className="text-muted-foreground">Last updated</dt>
              <dd>{formatEnterpriseDateTime(enterprise.updatedAt)}</dd>
            </dl>
            <p className="text-[12.5px] leading-relaxed text-muted-foreground m-0">
              An enterprise can only be deleted when it has no employees, so Delete is not offered here.
            </p>
          </SectionCard>
        </div>
      </div>

      {/* Suspend and Activate Dialogs */}
      {isSuspendOpen && (
        <SuspendEnterpriseDialog
          isOpen={true}
          enterpriseName={enterprise.name}
          activeJobsCount={enterprise.activeJobsCount}
          onClose={() => setIsSuspendOpen(false)}
          onConfirm={statusActions.suspend}
        />
      )}

      {isActivateOpen && (
        <ActivateEnterpriseDialog
          isOpen={true}
          enterpriseName={enterprise.name}
          previousReason={enterprise.statusReason}
          onClose={() => setIsActivateOpen(false)}
          onConfirm={statusActions.activate}
        />
      )}
    </div>
  );
}

/** Label-left, value-right rows inside a rail card (status reason, record dates). */
const FACT_ROWS_CLASS = "m-0 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5 text-[13.5px] [&_dd]:m-0 [&_dd]:text-right [&_dd]:font-semibold [&_dd]:text-foreground";

function TagList({ items }: { items: string[] }) {
  return (
    <span className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span key={item} className="inline-flex h-7 items-center rounded-lg bg-surface-readonly px-2.5 text-xs font-semibold text-foreground dark:bg-muted">
          {item}
        </span>
      ))}
    </span>
  );
}
