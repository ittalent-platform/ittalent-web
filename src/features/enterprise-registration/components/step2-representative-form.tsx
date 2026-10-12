import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormField } from "@/components/common/form-field";
import { InlineBanner } from "@/components/common/inline-banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  step2RepresentativeSchema,
  type Step2RepresentativeFormData,
} from "../enterprise-registration.schemas";
import { useRegistrationWizard } from "../context/registration-wizard-context";

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

  const defaultValues: Step2RepresentativeFormData = {
    full_name: rawRep.full_name || "",
    phone: rawRep.phone || "",
    position: rawRep.position || "",
    is_legal_representative: isLegalRepresentative,
  };

  const {
    register,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<Step2RepresentativeFormData>({
    resolver: zodResolver(step2RepresentativeSchema),
    defaultValues,
  });

  const isLegalRep = watch("is_legal_representative");

  const onSubmit = async (data: Step2RepresentativeFormData) => {
    setServerError(null);
    try {
      setIsLegalRepresentative(data.is_legal_representative);
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

  return (
    <div className="rounded-2xl border border-[#e6e4df] bg-[#ffffff] p-6 shadow-xs sm:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold tracking-tight text-[#19191c]">
          Authorized Representative
        </h2>
        <p className="mt-1 text-[13.5px] text-[#64646b]">
          Specify the representative managing this enterprise workspace on ITTalent.
        </p>
      </div>

      {serverError && (
        <div className="mb-6">
          <InlineBanner tone="error">{serverError}</InlineBanner>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            htmlFor="full_name"
            label="Representative full name"
            required
            error={errors.full_name?.message}
          >
            <Input
              id="full_name"
              placeholder="e.g. Nguyễn Văn A"
              {...register("full_name")}
            />
          </FormField>

          <FormField
            htmlFor="phone"
            label="Direct mobile phone"
            required
            hint="For urgent verification SMS or calls"
            error={errors.phone?.message}
          >
            <Input
              id="phone"
              type="tel"
              placeholder="+84 901 234 567"
              {...register("phone")}
            />
          </FormField>
        </div>

        <FormField
          htmlFor="position"
          label="Job title / position"
          hint="e.g. Talent Acquisition Director, HR Manager, General Director"
          error={errors.position?.message}
        >
          <Input
            id="position"
            placeholder="e.g. Head of Talent Acquisition"
            {...register("position")}
          />
        </FormField>

        {/* Legal rep authorization checkbox card */}
        <div className="rounded-xl border border-[#e6e4df] bg-[#faf9f5] p-4.5">
          <div className="flex items-start gap-3">
            <input
              id="is_legal_representative"
              type="checkbox"
              className="mt-1 size-4.5 shrink-0 accent-[#f2470c]"
              {...register("is_legal_representative")}
            />
            <div className="space-y-1">
              <label
                htmlFor="is_legal_representative"
                className="cursor-pointer text-[13.5px] font-semibold text-[#19191c]"
              >
                I am the legal representative named on the Business License (Người đại diện theo pháp luật)
              </label>
              <p className="text-xs text-[#64646b]">
                If checked, you only need to upload the Business Registration Certificate.
              </p>
            </div>
          </div>
        </div>

        {!isLegalRep && (
          <div>
            <InlineBanner tone="warning">
              <span className="font-semibold">Authorization requirement:</span> Because you are not the primary legal representative listed on official government records, you will be required to upload a signed Letter of Authorization (Giấy ủy quyền) in Step 3.
            </InlineBanner>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-[#efede8] pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={isSaving}
          >
            ← Back
          </Button>

          <Button
            type="submit"
            disabled={isSaving}
            className="min-w-[140px]"
          >
            {isSaving ? "Saving..." : "Save & Continue →"}
          </Button>
        </div>
      </form>
    </div>
  );
}
