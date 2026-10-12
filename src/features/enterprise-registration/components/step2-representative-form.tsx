import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check } from "lucide-react";
import { FormField } from "@/components/common/form-field";
import { InlineBanner } from "@/components/common/inline-banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  step2RepresentativeSchema,
  type Step2RepresentativeFormData,
} from "@/features/enterprise-registration/enterprise-registration.schemas";
import { useRegistrationWizard } from "@/features/enterprise-registration/context/registration-wizard-context";
import { cn } from "@/lib/utils";

export function Step2RepresentativeForm({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const {
    draft,
    saveDraft,
    isSaving,
    isLegalRepresentative,
    setIsLegalRepresentative,
  } = useRegistrationWizard();
  const [serverError, setServerError] = useState<string | null>(null);

  const rawRep = draft?.representative || {
    full_name: "",
    phone: "",
    position: "",
  };

  const [isLegalRep, setIsLegalRep] = useState<boolean>(isLegalRepresentative);

  const defaultValues: Step2RepresentativeFormData = {
    full_name: rawRep.full_name || "Đỗ Minh Châu",
    phone: rawRep.phone || "0912 778 456",
    position: rawRep.position || "Head of Operations",
    is_legal_representative: isLegalRepresentative,
    legal_representative_name: "Nguyễn Văn Lâm",
  };

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<Step2RepresentativeFormData>({
    resolver: zodResolver(step2RepresentativeSchema),
    defaultValues,
  });

  const verifiedEmail = draft?.corporate_email || "chau.do@lumenlogistics.vn";

  const handleSelectLegalRep = (isLegal: boolean) => {
    setIsLegalRep(isLegal);
    setValue("is_legal_representative", isLegal);
    setIsLegalRepresentative(isLegal);
  };

  const onSubmit = async (data: Step2RepresentativeFormData) => {
    setServerError(null);
    try {
      setIsLegalRepresentative(isLegalRep);
      await saveDraft({
        representative: {
          full_name: data.full_name,
          phone: data.phone,
          position: data.position || undefined,
        },
        version: draft?.version,
      });
      onNext();
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setServerError(
        errorObj.message || "Failed to save representative information. Please try again.",
      );
    }
  };

  const handleSaveDraftOnly = async () => {
    setServerError(null);
    try {
      setIsLegalRepresentative(isLegalRep);
      await saveDraft({
        representative: {
          full_name: defaultValues.full_name,
          phone: defaultValues.phone,
          position: defaultValues.position || undefined,
        },
        version: draft?.version,
      });
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setServerError(errorObj.message || "Failed to save draft. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <section className="rounded-2xl border border-border bg-card p-6 sm:p-7 flex flex-col gap-5">
        <div>
          <h2 className="text-[15px] font-bold tracking-tight text-foreground">
            Representative
          </h2>
          <p className="mt-1 text-[13.5px] text-muted-foreground">
            You will become the company&apos;s first Enterprise admin after approval.
          </p>
        </div>

        {serverError && (
          <InlineBanner tone="error">{serverError}</InlineBanner>
        )}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Row 1: Full name (left) | Work email with Verified pill (right) */}
          <FormField
            htmlFor="full_name"
            label="Full name"
            required
            error={errors.full_name?.message}
          >
            <Input
              id="full_name"
              placeholder="Đỗ Minh Châu"
              {...register("full_name")}
            />
          </FormField>

          <div>
            <label
              htmlFor="verified_work_email"
              className="mb-1.5 block text-xs font-semibold tracking-wide text-foreground"
            >
              Work email <span className="text-destructive">*</span>
            </label>
            <div className="relative flex items-center">
              <Input
                id="verified_work_email"
                type="email"
                value={verifiedEmail}
                readOnly
                className="pr-24 bg-muted/30"
              />
              <span className="absolute right-2.5 inline-flex items-center gap-1 rounded-full bg-(--status-success-bg) px-2.5 py-0.5 text-xs font-medium text-(--status-success-fg)">
                <Check className="h-3 w-3 stroke-[2.5]" /> Verified
              </span>
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Confirmed. The invitation goes here.
            </p>
          </div>

          {/* Row 2: Position (left) | Phone (right) */}
          <FormField
            htmlFor="position"
            label="Position"
            required
            error={errors.position?.message}
          >
            <Input
              id="position"
              placeholder="Head of Operations"
              {...register("position")}
            />
          </FormField>

          <FormField
            htmlFor="phone"
            label="Phone"
            required
            error={errors.phone?.message}
          >
            <Input
              id="phone"
              type="tel"
              placeholder="0912 778 456"
              {...register("phone")}
            />
          </FormField>
        </div>

        {/* Radio choice cards: Are you the company's legal representative? */}
        <div className="space-y-2 pt-2">
          <label className="block text-xs font-semibold tracking-wide text-foreground">
            Are you the company&apos;s legal representative?{" "}
            <span className="text-destructive">*</span>
          </label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Yes card */}
            <button
              type="button"
              onClick={() => handleSelectLegalRep(true)}
              className={cn(
                "flex items-start gap-3 rounded-xl border p-4 text-left transition-all",
                isLegalRep
                  ? "border-primary bg-primary/5 shadow-2xs"
                  : "border-border bg-card hover:bg-muted/40",
              )}
            >
              <div
                className={cn(
                  "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                  isLegalRep
                    ? "border-primary bg-primary text-white"
                    : "border-border",
                )}
              >
                {isLegalRep && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
              </div>
              <div className="text-xs">
                <p className="font-semibold text-foreground text-sm">Yes</p>
                <p className="mt-0.5 text-muted-foreground leading-relaxed">
                  The person named on the business registration certificate.
                </p>
              </div>
            </button>

            {/* No card */}
            <button
              type="button"
              onClick={() => handleSelectLegalRep(false)}
              className={cn(
                "flex items-start gap-3 rounded-xl border p-4 text-left transition-all",
                !isLegalRep
                  ? "border-primary bg-primary/5 shadow-2xs"
                  : "border-border bg-card hover:bg-muted/40",
              )}
            >
              <div
                className={cn(
                  "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                  !isLegalRep
                    ? "border-primary bg-primary text-white"
                    : "border-border",
                )}
              >
                {!isLegalRep && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
              </div>
              <div className="text-xs">
                <p className="font-semibold text-foreground text-sm">No</p>
                <p className="mt-0.5 text-muted-foreground leading-relaxed">
                  You&apos;ll upload a letter of authorization in the next step.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Conditional legal representative name field when "No" */}
        {!isLegalRep && (
          <div className="pt-1">
            <FormField
              htmlFor="legal_representative_name"
              label="Legal representative's name"
              required
              hint="As on the certificate"
              error={errors.legal_representative_name?.message}
            >
              <Input
                id="legal_representative_name"
                placeholder="Nguyễn Văn Lâm"
                {...register("legal_representative_name")}
              />
            </FormField>
          </div>
        )}

      </section>

      {/* Footer actions on background */}
      <div className="flex items-center justify-between pt-1">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={isSaving}
            onClick={handleSaveDraftOnly}
          >
            Save draft
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Continue"}
          </Button>
        </div>
      </div>
    </form>
  );
}
