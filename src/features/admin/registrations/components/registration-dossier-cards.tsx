import { Building2, User, FileText, ExternalLink, Download, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { EnterpriseRegistrationDetail } from "@/features/enterprise-registration/enterprise-registration.types";
import { LEGAL_DOCUMENT_TYPE_LABELS } from "@/features/enterprise-registration/enterprise-registration.constants";

interface RegistrationDossierCardsProps {
  registration: EnterpriseRegistrationDetail;
}

export function RegistrationDossierCards({ registration }: RegistrationDossierCardsProps) {
  const { t } = useTranslation();

  const company = registration.company_data as Record<string, unknown> | undefined;
  const address = company?.address as Record<string, unknown> | undefined;

  const fullAddress = address
    ? [address.street, address.district, address.city, address.country]
        .filter(Boolean)
        .join(", ")
    : "—";

  const legalName = (company?.legal_name as string) || (company?.name as string) || "—";
  const tradingName = (company?.name as string) || "—";
  const taxCode = (company?.tax_code as string) || registration.claim_locks?.tax_code || "—";
  const website = (company?.website as string) || "";
  const industry = (company?.industry as string) || "—";
  const companySize = (company?.company_size as string) || "—";
  const foundedYear = company?.founded_year ? String(company.founded_year) : "—";

  const representative = registration.representative;
  const docs = registration.legal_documents || [];

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Company Snapshot Card */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
        <div className="flex items-center gap-2 pb-4 border-b border-border">
          <Building2 className="size-4.5 text-muted-foreground" />
          <h2 className="font-semibold text-[15px] text-foreground">
            {t("admin.registrations.detail.companySectionTitle", {
              defaultValue: "Company · as submitted in version {{version}}",
              version: registration.version,
            })}
          </h2>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-8">
          <div>
            <span className="block text-[12px] font-medium text-muted-foreground">
              {t("admin.registrations.detail.legalName", "Legal name")}
            </span>
            <span className="mt-1 block text-[14px] font-semibold text-foreground">
              {legalName}
            </span>
          </div>

          <div>
            <span className="block text-[12px] font-medium text-muted-foreground">
              {t("admin.registrations.detail.tradingName", "Trading name")}
            </span>
            <span className="mt-1 block text-[14px] font-semibold text-foreground">
              {tradingName}
            </span>
          </div>

          <div>
            <span className="block text-[12px] font-medium text-muted-foreground">
              {t("admin.registrations.detail.taxCode", "Tax code")}
            </span>
            <span className="mt-1 block font-mono text-[14px] font-bold text-foreground">
              {taxCode}
            </span>
          </div>

          <div>
            <span className="block text-[12px] font-medium text-muted-foreground">
              {t("admin.registrations.detail.corporateEmail", "Corporate email")}
            </span>
            <span className="mt-1 block text-[14px] font-semibold text-foreground">
              {registration.corporate_email}
            </span>
          </div>

          <div>
            <span className="block text-[12px] font-medium text-muted-foreground">
              {t("admin.registrations.detail.website", "Website")}
            </span>
            {website ? (
              <a
                href={website.startsWith("http") ? website : `https://${website}`}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex items-center gap-1.5 text-[14px] font-medium text-primary hover:underline"
              >
                <span>{website.replace(/^https?:\/\//, "")}</span>
                <ExternalLink className="size-3.5" />
              </a>
            ) : (
              <span className="mt-1 block text-[14px] text-muted-foreground">—</span>
            )}
          </div>

          <div>
            <span className="block text-[12px] font-medium text-muted-foreground">
              {t("admin.registrations.detail.industry", "Industry")}
            </span>
            <span className="mt-1 block text-[14px] font-medium text-foreground">
              {industry}
            </span>
          </div>

          <div>
            <span className="block text-[12px] font-medium text-muted-foreground">
              {t("admin.registrations.detail.companySize", "Company size")}
            </span>
            <span className="mt-1 block text-[14px] font-medium text-foreground">
              {companySize}
            </span>
          </div>

          <div>
            <span className="block text-[12px] font-medium text-muted-foreground">
              {t("admin.registrations.detail.foundedYear", "Founded year")}
            </span>
            <span className="mt-1 block text-[14px] font-medium text-foreground">
              {foundedYear}
            </span>
          </div>

          <div className="md:col-span-2">
            <span className="block text-[12px] font-medium text-muted-foreground">
              {t("admin.registrations.detail.address", "Address")}
            </span>
            <span className="mt-1 block text-[14px] text-foreground">
              {fullAddress}
            </span>
          </div>
        </div>

        <p className="mt-6 pt-4 border-t border-border text-[12px] text-muted-foreground">
          {t("admin.registrations.detail.snapshotNote", "This snapshot can't change. Leading zeros in the tax code are kept.")}
        </p>
      </div>

      {/* 2. Representative Snapshot Card */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
        <div className="flex items-center gap-2 pb-4 border-b border-border">
          <User className="size-4.5 text-muted-foreground" />
          <h2 className="font-semibold text-[15px] text-foreground">
            {t("admin.registrations.detail.representativeTitle", "Representative")}
          </h2>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-8">
          <div>
            <span className="block text-[12px] font-medium text-muted-foreground">
              {t("admin.registrations.detail.repName", "Name")}
            </span>
            <span className="mt-1 block text-[14px] font-semibold text-foreground">
              {representative.full_name}
            </span>
          </div>

          <div>
            <span className="block text-[12px] font-medium text-muted-foreground">
              {t("admin.registrations.detail.repEmail", "Email (must match the invitation)")}
            </span>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-[14px] font-semibold text-foreground">
                {registration.corporate_email}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                <CheckCircle2 className="size-3" />
                <span>{t("admin.registrations.detail.verified", "Verified")}</span>
              </span>
            </div>
          </div>

          <div>
            <span className="block text-[12px] font-medium text-muted-foreground">
              {t("admin.registrations.detail.repPosition", "Position")}
            </span>
            <span className="mt-1 block text-[14px] font-medium text-foreground">
              {representative.position || t("admin.registrations.detail.legalRep", "Legal Representative")}
            </span>
          </div>

          <div>
            <span className="block text-[12px] font-medium text-muted-foreground">
              {t("admin.registrations.detail.repPhone", "Phone")}
            </span>
            <span className="mt-1 block font-mono text-[14px] font-medium text-foreground">
              {representative.phone}
            </span>
          </div>

          <div className="md:col-span-2">
            <span className="block text-[12px] font-medium text-muted-foreground">
              {t("admin.registrations.detail.invitationRole", "Invitation after approval")}
            </span>
            <span className="mt-1 block text-[13.5px] text-muted-foreground">
              {t("admin.registrations.detail.invitationRoleDesc", "Will receive an Enterprise admin invitation and can sign in to manage the workspace.")}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Evidence / Legal Documents Card */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
        <div className="flex items-center gap-2 pb-4 border-b border-border">
          <FileText className="size-4.5 text-muted-foreground" />
          <h2 className="font-semibold text-[15px] text-foreground">
            {t("admin.registrations.detail.evidenceTitle", "Evidence")}
          </h2>
        </div>

        {docs.length === 0 ? (
          <p className="mt-4 text-[13.5px] text-muted-foreground italic">
            {t("admin.registrations.detail.noDocuments", "No legal documents attached to this case.")}
          </p>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            {docs.map((doc, idx) => {
              const label =
                LEGAL_DOCUMENT_TYPE_LABELS[doc.document_type] || doc.document_type;

              return (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-4 p-4 rounded-xl border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <FileText className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13.5px] font-semibold text-foreground truncate">
                        {label}
                      </div>
                      <div className="text-[12px] text-muted-foreground truncate">
                        {doc.file_name}
                      </div>
                    </div>
                  </div>

                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-[12.5px] font-medium text-foreground transition-colors shrink-0 shadow-2xs"
                  >
                    <Download className="size-3.5 text-muted-foreground" />
                    <span>{t("admin.registrations.detail.viewDoc", "View document")}</span>
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
