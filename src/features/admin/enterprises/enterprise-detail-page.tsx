import { useState } from "react";
import { Link, useParams } from "react-router";
import { Ban, Check, MapPin, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/common/error-state";
import { useToast } from "@/components/toast/toast-provider";
import {
  EnterpriseAvatar,
  EnterpriseStatusBadge,
  CompanyTypeBadge,
  formatEnterpriseId,
} from "./enterprise-badges";
import { getEnterpriseActions, SOCIAL_LINK_LABELS } from "./enterprises.constants";
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
    <div className="space-y-5">
      {/* Breadcrumb matching design */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link to="/admin/enterprises" className="hover:text-foreground transition-colors">
          {t("adminEnterprises.page.title", "Enterprise Profiles")}
        </Link>
        <span aria-hidden="true" className="text-muted-foreground">/</span>
        <span className="font-mono text-foreground font-semibold">
          {formatEnterpriseId(enterprise.id)}
        </span>
      </nav>

      {/* Detail Header: 52px Avatar + Name + Badges + Edit/Suspend Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <EnterpriseAvatar
            name={enterprise.name}
            logoUrl={enterprise.logoUrl}
            size="xl"
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground truncate">
                {enterprise.name}
              </h1>
              <EnterpriseStatusBadge status={enterprise.status} />
              <CompanyTypeBadge type={enterprise.companyType} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
              {[enterprise.email, enterprise.industry, address?.city]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </div>

        {/* Actions matching design: Edit + Suspend/Activate */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button asChild variant="outline" className="h-11 px-5 border border-border rounded-xl bg-card text-foreground font-semibold text-sm inline-flex items-center gap-2 hover:bg-muted transition cursor-pointer">
            <Link to={`/admin/enterprises/${enterprise.id}/edit`}>
              <Pencil className="size-4 text-muted-foreground" />
              <span>{t("adminEnterprises.detail.edit", "Edit")}</span>
            </Link>
          </Button>

          {actions.canSuspend ? (
            <Button
              type="button"
              onClick={() => setIsSuspendOpen(true)}
              className="h-11 px-5 rounded-xl bg-(--status-warning-fg) hover:bg-(--status-warning-fg)/90 text-white font-semibold text-sm inline-flex items-center gap-2 transition cursor-pointer"
            >
              <Ban className="size-4" />
              <span>{t("adminEnterprises.detail.suspend", "Suspend")}</span>
            </Button>
          ) : actions.canActivate ? (
            <Button
              type="button"
              onClick={() => setIsActivateOpen(true)}
              className="h-11 px-5 rounded-xl bg-(--status-success-fg) hover:bg-(--status-success-fg)/90 text-white font-semibold text-sm inline-flex items-center gap-2 transition cursor-pointer"
            >
              <Check className="size-4" />
              <span>{t("adminEnterprises.detail.activate", "Activate")}</span>
            </Button>
          ) : null}
        </div>
      </div>

      {/* Main Grid: minmax(0, 1fr) left column + 380px right rail */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-[18px] items-start">
        {/* Left Column Cards */}
        <div className="flex flex-col gap-[18px]">
          {/* Legal identity Card */}
          <section className="p-[22px] pb-6 rounded-2xl border border-border bg-card flex flex-col gap-[18px]">
            <h2 className="text-[15px] font-bold text-foreground">
              {t("adminEnterprises.form.legalTax", "Legal identity")}
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5 m-0">
              <div className="flex flex-col gap-1.5 min-w-0">
                <dt className="text-[13px] text-muted-foreground">Display name</dt>
                <dd className="m-0 text-[14.5px] font-semibold text-foreground break-words">{enterprise.name}</dd>
              </div>
              <div className="flex flex-col gap-1.5 min-w-0">
                <dt className="text-[13px] text-muted-foreground">Legal name</dt>
                <dd className="m-0 text-[14.5px] font-semibold text-foreground break-words">{enterprise.legalName || "—"}</dd>
              </div>
              <div className="flex flex-col gap-1.5 min-w-0">
                <dt className="text-[13px] text-muted-foreground">Tax code</dt>
                <dd className="m-0 text-[14.5px] font-semibold text-foreground break-words">
                  <span className="font-mono text-xs text-foreground font-semibold">{formatTaxCode(enterprise.taxCode)}</span>
                </dd>
              </div>
              <div className="flex flex-col gap-1.5 min-w-0">
                <dt className="text-[13px] text-muted-foreground">Registration number</dt>
                <dd className="m-0 text-[14.5px] font-semibold text-foreground break-words">{enterprise.registrationNumber || "Not provided"}</dd>
              </div>
              <div className="flex flex-col gap-1.5 min-w-0">
                <dt className="text-[13px] text-muted-foreground">Founded</dt>
                <dd className="m-0 text-[14.5px] font-semibold text-foreground break-words">{enterprise.foundedYear ? String(enterprise.foundedYear) : "—"}</dd>
              </div>
              <div className="flex flex-col gap-1.5 min-w-0">
                <dt className="text-[13px] text-muted-foreground">Enterprise ID</dt>
                <dd className="m-0 text-[14.5px] font-semibold text-foreground break-words">
                  <span className="font-mono text-xs text-foreground font-semibold">{formatEnterpriseId(enterprise.id)}</span>
                </dd>
              </div>
            </dl>
          </section>

          {/* Contact Card */}
          <section className="p-[22px] pb-6 rounded-2xl border border-border bg-card flex flex-col gap-[18px]">
            <h2 className="text-[15px] font-bold text-foreground">
              {t("adminEnterprises.detail.contact", "Contact")}
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5 m-0">
              <div className="flex flex-col gap-1.5 min-w-0">
                <dt className="text-[13px] text-muted-foreground">Corporate email</dt>
                <dd className="m-0 text-[14.5px] font-semibold text-foreground break-words">{enterprise.email || "—"}</dd>
              </div>
              <div className="flex flex-col gap-1.5 min-w-0">
                <dt className="text-[13px] text-muted-foreground">Phone</dt>
                <dd className="m-0 text-[14.5px] font-semibold text-foreground break-words">{enterprise.phone || "—"}</dd>
              </div>
              <div className="flex flex-col gap-1.5 min-w-0">
                <dt className="text-[13px] text-muted-foreground">Website</dt>
                <dd className="m-0 text-[14.5px] font-semibold text-foreground break-words">
                  {enterprise.website ? (
                    <a href={enterprise.website} target="_blank" rel="noopener noreferrer" className="text-foreground hover:underline">
                      {enterprise.website.replace(/^https?:\/\//, "")}
                    </a>
                  ) : "—"}
                </dd>
              </div>
              <div className="flex flex-col gap-1.5 min-w-0">
                <dt className="text-[13px] text-muted-foreground">Social links</dt>
                <dd className="m-0 text-[14.5px] font-semibold text-foreground break-words">
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
                </dd>
              </div>
            </dl>
          </section>

          {/* Business Card */}
          <section className="p-[22px] pb-6 rounded-2xl border border-border bg-card flex flex-col gap-[18px]">
            <h2 className="text-[15px] font-bold text-foreground">
              Business
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5 m-0">
              <div className="flex flex-col gap-1.5 min-w-0">
                <dt className="text-[13px] text-muted-foreground">Industry</dt>
                <dd className="m-0 text-[14.5px] font-semibold text-foreground break-words">{enterprise.industry || "—"}</dd>
              </div>
              <div className="flex flex-col gap-1.5 min-w-0">
                <dt className="text-[13px] text-muted-foreground">Company size</dt>
                <dd className="m-0 text-[14.5px] font-semibold text-foreground break-words">
                  {enterprise.companySize ? `${enterprise.companySize} employees` : "—"}
                </dd>
              </div>
              <div className="flex flex-col gap-1.5 min-w-0">
                <dt className="text-[13px] text-muted-foreground">Company type</dt>
                <dd className="m-0 text-[14.5px] font-semibold text-foreground break-words">{enterprise.companyType || "—"}</dd>
              </div>
              <div className="flex flex-col gap-1.5 min-w-0">
                <dt className="text-[13px] text-muted-foreground">Working days</dt>
                <dd className="m-0 text-[14.5px] font-semibold text-foreground break-words">{enterprise.workingDays || "—"}</dd>
              </div>
              {enterprise.subIndustries && enterprise.subIndustries.length > 0 ? (
                <div className="flex flex-col gap-2 min-w-0 sm:col-span-2">
                  <dt className="text-[13px] text-muted-foreground">{t("adminEnterprises.detail.subIndustries", "Sub-industries")}</dt>
                  <dd className="m-0 flex flex-wrap gap-1.5">
                    {enterprise.subIndustries.map((item) => (
                      <span key={item} className="h-7 px-2.5 rounded-lg bg-surface-readonly dark:bg-muted text-foreground text-xs font-semibold inline-flex items-center">
                        {item}
                      </span>
                    ))}
                  </dd>
                </div>
              ) : null}
            </dl>
          </section>

          {/* Addresses Card */}
          {addresses.length > 0 ? (
            <section className="p-[22px] pb-6 rounded-2xl border border-border bg-card flex flex-col gap-[18px]">
              <h2 className="text-[15px] font-bold text-foreground">Addresses</h2>
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
            </section>
          ) : null}

          {/* Public Profile Card */}
          <section className="p-[22px] pb-6 rounded-2xl border border-border bg-card flex flex-col gap-[18px]">
            <h2 className="text-[15px] font-bold text-foreground">
              Public profile
            </h2>
            <div className="flex flex-col gap-4">
              {/* Gradient cover banner with avatar overlay */}
              <div
                className="h-[120px] rounded-[14px] bg-gradient-to-r from-foreground via-foreground/80 to-brand relative bg-cover bg-center"
                style={enterprise.coverUrl ? { backgroundImage: `url(${enterprise.coverUrl})` } : undefined} /* dynamic: runtime value */
              >
                <span className="absolute left-[18px] -bottom-[22px] border-4 border-card rounded-2xl">
                  <EnterpriseAvatar name={enterprise.name} logoUrl={enterprise.logoUrl} size="lg" />
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
                    <div className="flex flex-wrap gap-1.5">
                      {enterprise.benefits.map((b) => (
                        <span key={b} className="h-7 px-2.5 rounded-lg bg-surface-readonly dark:bg-muted text-foreground text-xs font-semibold inline-flex items-center">
                          {b}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">No benefits specified</span>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-[13px] text-muted-foreground">Tech stack</span>
                  {enterprise.techStack && enterprise.techStack.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {enterprise.techStack.map((tech) => (
                        <span key={tech} className="h-7 px-2.5 rounded-lg bg-surface-readonly dark:bg-muted text-foreground text-xs font-semibold inline-flex items-center">
                          {tech}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">No tech stack specified</span>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column (380px) Cards */}
        <div className="flex flex-col gap-[18px]">
          {/* Status Card */}
          <section className="p-[22px] pb-6 rounded-2xl border border-border bg-card flex flex-col gap-[18px]">
            <h2 className="text-[15px] font-bold text-foreground">Status</h2>
            <div className="flex items-center gap-2.5">
              <EnterpriseStatusBadge status={enterprise.status} />
            </div>
            {enterprise.statusReason ? (
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5 text-[13.5px] m-0">
                <dt className="text-muted-foreground">Reason</dt>
                <dd className="m-0 text-right font-semibold text-foreground">{enterprise.statusReason}</dd>
              </dl>
            ) : null}
            <p className="text-[12.5px] leading-relaxed text-muted-foreground m-0">
              Active enterprises are public and can publish jobs. Suspending hides the company and its jobs.
            </p>
          </section>

          {/* Job Postings Card */}
          <section className="p-[22px] pb-6 rounded-2xl border border-border bg-card flex flex-col gap-[18px]">
            <h2 className="text-[15px] font-bold text-foreground">Job postings</h2>
            <div className="flex gap-2.5">
              {jobCounts.map((item) => (
                <div key={item.key} className="flex-1 p-3.5 rounded-xl border border-border bg-card flex flex-col gap-0.5">
                  <span className="text-xl font-bold text-foreground">{item.value}</span>
                  <span className="text-[12.5px] text-muted-foreground">{item.label}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Record Card */}
          <section className="p-[22px] pb-6 rounded-2xl border border-border bg-card flex flex-col gap-[18px]">
            <h2 className="text-[15px] font-bold text-foreground">Record</h2>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5 text-[13.5px] m-0">
              <dt className="text-muted-foreground">Created</dt>
              <dd className="m-0 text-right font-semibold text-foreground">{formatEnterpriseDateTime(enterprise.createdAt)}</dd>
              <dt className="text-muted-foreground">Last updated</dt>
              <dd className="m-0 text-right font-semibold text-foreground">{formatEnterpriseDateTime(enterprise.updatedAt)}</dd>
            </dl>
            <p className="text-[12.5px] leading-relaxed text-muted-foreground m-0">
              An enterprise can only be deleted when it has no employees, so Delete is not offered here.
            </p>
          </section>
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
