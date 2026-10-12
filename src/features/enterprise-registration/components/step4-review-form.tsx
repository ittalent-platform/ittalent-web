import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, User, FileText, ExternalLink, ShieldCheck } from "lucide-react";
import { InlineBanner } from "@/components/common/inline-banner";
import { Button } from "@/components/ui/button";
import { DOCUMENT_TYPE_LABELS } from "@/features/enterprise-registration/enterprise-registration.constants";
import type { SubmissionReceiptResponse } from "@/features/enterprise-registration/enterprise-registration.types";
import {
  companySizeOptions,
  step4ReviewSubmitSchema,
  type Step4ReviewSubmitFormData,
} from "@/features/enterprise-registration/enterprise-registration.schemas";
import { useRegistrationWizard } from "@/features/enterprise-registration/context/registration-wizard-context";
import { useSubmitRegistrationMutation } from "@/features/enterprise-registration/enterprise-registration.queries";

export function Step4ReviewForm({
  onBack,
  onSubmitSuccess,
}: {
  onBack: () => void;
  onSubmitSuccess: (receipt: SubmissionReceiptResponse) => void;
}) {
  const { registrationId, draft, isLegalRepresentative } =
    useRegistrationWizard();
  const [serverError, setServerError] = useState<string | null>(null);

  const submitMutation = useSubmitRegistrationMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Step4ReviewSubmitFormData>({
    resolver: zodResolver(step4ReviewSubmitSchema),
    defaultValues: {
      agreed_to_terms: undefined,
    },
  });

  const company = (draft?.company_data || {}) as Record<string, unknown>;
  const address = (company.address || {}) as Record<string, unknown>;
  const rep = draft?.representative || {
    full_name: "",
    phone: "",
    position: "",
  };
  const documents = draft?.legal_documents || [];

  const onSubmit = async () => {
    setServerError(null);

    if (!registrationId) {
      setServerError("Registration ID is missing. Please restart intake.");
      return;
    }

    if (!draft) {
      setServerError("Registration details not loaded.");
      return;
    }

    try {
      const receipt = await submitMutation.mutateAsync({
        id: registrationId,
        body: {
          representative: {
            full_name: rep.full_name,
            phone: rep.phone,
            position: rep.position || undefined,
          },
          company_data: {
            name: (company.name as string) || "",
            legal_name: (company.legal_name as string) || undefined,
            tax_code: (company.tax_code as string) || "",
            registration_number: (company.registration_number as string) || undefined,
            website: (company.website as string) || undefined,
            industry: (company.industry as string) || "",
            company_size:
              (company.company_size as (typeof companySizeOptions)[number]) ||
              "11-50",
            address: {
              street: (address.street as string) || "",
              city: (address.city as string) || "",
              district: (address.district as string) || undefined,
              state_province: (address.state_province as string) || undefined,
              country: (address.country as string) || "Vietnam",
              postal_code: (address.postal_code as string) || undefined,
            },
            short_description: (company.short_description as string) || undefined,
            description: (company.description as string) || undefined,
          },
          legal_documents: documents.map((doc) => ({
            document_type: doc.document_type,
            file_name: doc.file_name,
            file_url: doc.file_url,
            file_size: doc.file_size,
          })),
          version: draft.version,
        },
      });

      if (receipt) {
        onSubmitSuccess(receipt);
      }
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setServerError(
        errorObj.message || "Failed to submit enterprise registration. Please review and try again.",
      );
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-xs sm:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Review & Submit Registration
        </h2>
        <p className="mt-1 text-[13.5px] text-muted-foreground">
          Carefully review your organization details and legal documentation before final submission.
        </p>
      </div>

      {serverError && (
        <div className="mb-6">
          <InlineBanner tone="error">{serverError}</InlineBanner>
        </div>
      )}

      <div className="space-y-6">
        {/* Section 1: Organization Details */}
        <div className="rounded-xl border border-border bg-muted p-5">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-bold text-foreground">
              Enterprise Details
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-y-3 gap-x-6 text-[13px] sm:grid-cols-2">
            <div>
              <span className="text-muted-foreground">Trading / Brand Name:</span>
              <p className="font-semibold text-foreground">{String(company.name || "—")}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Official Legal Name:</span>
              <p className="font-semibold text-foreground">{String(company.legal_name || "—")}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Tax Code (Mã số thuế):</span>
              <p className="font-semibold text-foreground font-mono">{String(company.tax_code || "—")}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Primary Industry:</span>
              <p className="font-semibold text-foreground">{String(company.industry || "—")}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Company Scale:</span>
              <p className="font-semibold text-foreground">{String(company.company_size || "—")} employees</p>
            </div>
            <div>
              <span className="text-muted-foreground">Official Website:</span>
              <p className="font-semibold text-foreground">{String(company.website || "—")}</p>
            </div>
            <div className="sm:col-span-2">
              <span className="text-muted-foreground">Headquarters Location:</span>
              <p className="font-semibold text-foreground">
                {[address.street, address.city, address.country].filter(Boolean).join(", ") || "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Authorized Representative */}
        <div className="rounded-xl border border-border bg-muted p-5">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-bold text-foreground">
              Authorized Representative
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-y-3 gap-x-6 text-[13px] sm:grid-cols-2">
            <div>
              <span className="text-muted-foreground">Full Name:</span>
              <p className="font-semibold text-foreground">{rep.full_name || "—"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Corporate Email:</span>
              <p className="font-semibold text-foreground">{draft?.corporate_email || "—"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Direct Phone:</span>
              <p className="font-semibold text-foreground">{rep.phone || "—"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Position / Title:</span>
              <p className="font-semibold text-foreground">{rep.position || "—"}</p>
            </div>
            <div className="sm:col-span-2">
              <span className="text-muted-foreground">Representation Status:</span>
              <p className="font-semibold text-foreground">
                {isLegalRepresentative
                  ? "Primary Legal Representative (Người đại diện pháp luật)"
                  : "Authorized Delegate (Người được ủy quyền)"}
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Attached Documents */}
        <div className="rounded-xl border border-border bg-muted p-5">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-bold text-foreground">
              Attached Legal Records ({documents.length})
            </h3>
          </div>

          <div className="space-y-2">
            {documents.map((doc, idx) => (
              <div
                key={`${doc.file_name}-${idx}`}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-3.5 py-2.5 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className="h-4 w-4 text-primary shrink-0" />
                  <span className="font-semibold text-foreground truncate">
                    {doc.file_name}
                  </span>
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10.5px] font-medium text-muted-foreground">
                    {DOCUMENT_TYPE_LABELS[doc.document_type] || doc.document_type}
                  </span>
                </div>
                {doc.file_url && (
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[11.5px] font-semibold text-primary hover:underline"
                  >
                    View <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Certification Disclaimer Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-2">
          <div className="rounded-xl border border-border bg-card p-4.5">
            <div className="flex items-start gap-3">
              <input
                id="agreed_to_terms"
                type="checkbox"
                className="mt-1 size-4.5 shrink-0 accent-primary"
                {...register("agreed_to_terms")}
              />
              <div className="space-y-1">
                <label
                  htmlFor="agreed_to_terms"
                  className="cursor-pointer text-[13px] font-semibold text-foreground"
                >
                  I certify that all provided information is accurate and legally authorized
                </label>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  By submitting this request, I certify under penalty of law that I am authorized to represent this enterprise, all attached documentation is genuine, and ITTalent may verify this submission with state registries.
                </p>
                {errors.agreed_to_terms && (
                  <p className="mt-1 text-xs font-semibold text-destructive">
                    {errors.agreed_to_terms.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-line-muted pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              disabled={submitMutation.isPending}
            >
              ← Back
            </Button>

            <Button
              type="submit"
              disabled={submitMutation.isPending}
              className="min-w-[170px]"
            >
              <ShieldCheck className="mr-2 h-4 w-4" />
              {submitMutation.isPending ? "Submitting..." : "Submit Registration"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
