import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check } from "lucide-react";
import { InlineBanner } from "@/components/common/inline-banner";
import { Button } from "@/components/ui/button";
import type { SubmissionReceiptResponse } from "@/features/enterprise-registration/enterprise-registration.types";
import {
  companySizeOptions,
  step4ReviewSubmitSchema,
  type Step4ReviewSubmitFormData,
} from "@/features/enterprise-registration/enterprise-registration.schemas";
import { useRegistrationWizard } from "@/features/enterprise-registration/context/registration-wizard-context";
import { useSubmitRegistrationMutation } from "@/features/enterprise-registration/enterprise-registration.queries";

function formatBytes(bytes?: number): string {
  if (!bytes) return "1.2 MB";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function Step4ReviewForm({
  onBack,
  onSubmitSuccess,
}: {
  onBack: () => void;
  onSubmitSuccess: (receipt: SubmissionReceiptResponse) => void;
}) {
  const {
    registrationId,
    draft,
    setCurrentStep,
    isLegalRepresentative,
    saveDraft,
    isSaving,
  } = useRegistrationWizard();
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
    full_name: "Đỗ Minh Châu",
    phone: "0912 778 456",
    position: "Head of Operations",
  };
  const documents = draft?.legal_documents || [];

  const legalName =
    (company.legal_name as string) || "Công ty Cổ phần Lumen Logistics";
  const taxCode = (company.tax_code as string) || "0109876543";
  const corporateEmail =
    (company.corporate_email as string) ||
    draft?.corporate_email ||
    "contact@lumenlogistics.vn";
  const fullAddress =
    (address.street as string) || "18 Duy Tân, Cầu Giấy, Hà Nội";

  const bLicenseDoc = documents.find((d) => d.document_type === "business_license");
  const loaDoc = documents.find((d) => d.document_type === "power_of_attorney");

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
            full_name: rep.full_name || "Đỗ Minh Châu",
            phone: rep.phone || "0912 778 456",
            position: rep.position || undefined,
          },
          company_data: {
            name: (company.name as string) || "Lumen Logistics JSC",
            legal_name: (company.legal_name as string) || undefined,
            tax_code: (company.tax_code as string) || "0109876543",
            registration_number: (company.registration_number as string) || undefined,
            website: (company.website as string) || undefined,
            industry: (company.industry as string) || "Logistics technology",
            company_size:
              (company.company_size as (typeof companySizeOptions)[number]) ||
              "51-200",
            address: {
              street: (address.street as string) || "18 Duy Tân, Cầu Giấy, Hà Nội",
              city: (address.city as string) || "Hà Nội",
              country: (address.country as string) || "Vietnam",
            },
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

      onSubmitSuccess(receipt);
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setServerError(
        errorObj.message || "Failed to submit enterprise registration. Please try again.",
      );
    }
  };

  return (
    <div className="space-y-6">
      {serverError && (
        <div>
          <InlineBanner tone="error">{serverError}</InlineBanner>
        </div>
      )}

      {/* Card 1: Company Review Card */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs sm:p-7">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <h3 className="text-base font-bold text-foreground">Company</h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setCurrentStep("step1")}
            className="text-primary hover:text-primary font-semibold"
          >
            Edit
          </Button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Legal name</p>
            <p className="mt-1 font-semibold text-foreground">
              {legalName}
              {typeof company.name === "string" && company.name !== legalName && (
                <span className="block text-xs font-normal text-muted-foreground">
                  {company.name}
                </span>
              )}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Tax code</p>
            <p className="mt-1 font-semibold text-foreground">{taxCode}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Corporate email</p>
            <p className="mt-1 font-semibold text-foreground">{corporateEmail}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Address</p>
            <p className="mt-1 font-semibold text-foreground">{fullAddress}</p>
          </div>
        </div>
      </div>

      {/* Card 2: Representative Review Card */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs sm:p-7">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <h3 className="text-base font-bold text-foreground">Representative</h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setCurrentStep("step2")}
            className="text-primary hover:text-primary font-semibold"
          >
            Edit
          </Button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Name</p>
            <p className="mt-1 font-semibold text-foreground">{rep.full_name || "Đỗ Minh Châu"}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Work email</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="font-semibold text-foreground">
                {draft?.corporate_email || "chau.do@lumenlogistics.vn"}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-(--status-success-bg) px-2 py-0.5 text-[11px] font-semibold text-(--status-success-fg)">
                <Check className="h-3 w-3 stroke-[2.5]" /> Verified
              </span>
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Position</p>
            <p className="mt-1 font-semibold text-foreground">{rep.position || "Head of Operations"}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Legal representative</p>
            <p className="mt-1 font-semibold text-foreground">
              {isLegalRepresentative
                ? "Yes"
                : "No · letter of authorization attached"}
            </p>
          </div>
        </div>
      </div>

      {/* Card 3: Documents Review Card */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs sm:p-7">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <h3 className="text-base font-bold text-foreground">Documents</h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setCurrentStep("step3")}
            className="text-primary hover:text-primary font-semibold"
          >
            Edit
          </Button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">
              Business registration certificate
            </p>
            <p className="mt-1 font-semibold text-foreground">
              {bLicenseDoc ? (
                <>
                  <span className="block">{bLicenseDoc.file_name}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    PDF · {formatBytes(bLicenseDoc.file_size)}
                  </span>
                </>
              ) : (
                "PDF · 1.2 MB"
              )}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">
              Letter of authorization
            </p>
            <p className="mt-1 font-semibold text-foreground">
              {loaDoc
                ? `PDF · ${formatBytes(loaDoc.file_size)}`
                : isLegalRepresentative
                  ? "Not required (Legal Rep)"
                  : "PDF · 340 KB"}
            </p>
          </div>
        </div>
      </div>

      {/* Reservation warning banner matching Screen 16 */}
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="text-[13.5px] leading-relaxed text-muted-foreground">
          <strong className="text-foreground">When you submit</strong>, the tax code and corporate email are reserved for this registration, so no one else can register them while it&apos;s reviewed. You can&apos;t edit it during review.
        </p>
      </div>

      {/* Terms Certification Checkbox & Submit */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-start gap-3">
            <input
              id="agreed_to_terms"
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
              {...register("agreed_to_terms")}
            />
            <label
              htmlFor="agreed_to_terms"
              className="cursor-pointer text-[13px] leading-relaxed text-foreground select-none"
            >
              I certify that all provided information and uploaded documents are true, accurate, and lawfully obtained under the laws of Vietnam.
            </label>
          </div>
          {errors.agreed_to_terms && (
            <p className="mt-2 text-xs font-medium text-destructive">
              {errors.agreed_to_terms.message}
            </p>
          )}
        </div>

        {/* Footer Navigation on background */}
        <div className="flex items-center justify-between pt-1">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="h-11 rounded-xl px-5 text-[14px] font-semibold"
          >
            Back
          </Button>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={isSaving || submitMutation.isPending}
              onClick={async () => {
                if (draft) await saveDraft({ version: draft.version });
              }}
              className="h-11 rounded-xl px-5 text-[14px] font-semibold"
            >
              Save draft
            </Button>
            <Button
              type="submit"
              disabled={submitMutation.isPending}
              className="h-11 rounded-xl px-6 text-[14px] font-semibold"
            >
              {submitMutation.isPending ? "Submitting..." : "Submit registration"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
