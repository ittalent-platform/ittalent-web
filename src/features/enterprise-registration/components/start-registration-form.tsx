import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormField } from "@/components/common/form-field";
import { InlineBanner } from "@/components/common/inline-banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  startRegistrationSchema,
  type StartRegistrationFormData,
} from "../enterprise-registration.schemas";
import { useStartRegistrationMutation } from "../enterprise-registration.queries";

export function StartRegistrationForm({
  onSuccess,
  onContinueLaterClick,
}: {
  onSuccess: (email: string) => void;
  onContinueLaterClick: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);

  const startMutation = useStartRegistrationMutation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<StartRegistrationFormData>({
    resolver: zodResolver(startRegistrationSchema),
    defaultValues: {
      representative_name: "",
      corporate_email: "",
      representative_phone: "",
      representative_position: "",
    },
  });

  const onSubmit = async (data: StartRegistrationFormData) => {
    setServerError(null);
    try {
      await startMutation.mutateAsync({
        representative_name: data.representative_name,
        corporate_email: data.corporate_email,
        representative_phone: data.representative_phone,
        representative_position: data.representative_position || undefined,
      });
      onSuccess(data.corporate_email);
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setServerError(
        errorObj.message || "Failed to start registration. Please try again.",
      );
    }
  };

  return (
    <div className="w-full max-w-[440px] rounded-2xl border border-[#e6e4df] bg-[#ffffff] p-8 shadow-xs">
      <div className="mb-6">
        <h2 className="text-xl font-bold tracking-tight text-[#19191c]">
          Register your company
        </h2>
        <p className="mt-1 text-[13.5px] text-[#64646b]">
          Enter your contact details to start and save your organization intake case.
        </p>
      </div>

      {serverError && (
        <div className="mb-6">
          <InlineBanner tone="error">{serverError}</InlineBanner>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormField
          htmlFor="representative_name"
          label="Your full name"
          required
          error={errors.representative_name?.message}
        >
          <Input
            id="representative_name"
            placeholder="e.g. Hoàng Nam"
            {...register("representative_name")}
          />
        </FormField>

        <FormField
          htmlFor="corporate_email"
          label="Corporate work email"
          required
          hint="We will verify your company domain (personal emails not permitted)"
          error={errors.corporate_email?.message}
        >
          <Input
            id="corporate_email"
            type="email"
            placeholder="name@company.com"
            {...register("corporate_email")}
          />
        </FormField>

        <FormField
          htmlFor="representative_phone"
          label="Contact phone number"
          required
          error={errors.representative_phone?.message}
        >
          <Input
            id="representative_phone"
            type="tel"
            placeholder="e.g. 0901234567"
            {...register("representative_phone")}
          />
        </FormField>

        <FormField
          htmlFor="representative_position"
          label="Position in organization"
          hint="Optional"
          error={errors.representative_position?.message}
        >
          <Input
            id="representative_position"
            placeholder="e.g. Talent Acquisition Director"
            {...register("representative_position")}
          />
        </FormField>

        <Button
          type="submit"
          className="mt-2 w-full"
          disabled={isSubmitting || startMutation.isPending}
        >
          {isSubmitting || startMutation.isPending
            ? "Sending confirmation link..."
            : "Continue with work email →"}
        </Button>
      </form>

      <div className="mt-6 border-t border-[#efede8] pt-4 text-center">
        <button
          type="button"
          onClick={onContinueLaterClick}
          className="text-xs font-medium text-[#b33305] hover:text-[#8f2904]"
        >
          Already started? Continue your registration draft →
        </button>
      </div>
    </div>
  );
}
