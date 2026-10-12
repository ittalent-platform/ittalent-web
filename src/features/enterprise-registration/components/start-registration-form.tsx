import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router";
import { FormField } from "@/components/common/form-field";
import { InlineBanner } from "@/components/common/inline-banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { corporateEmailSchema } from "@/features/enterprise-registration/enterprise-registration.schemas";
import { REGISTRATION_CONFIG } from "@/features/enterprise-registration/enterprise-registration.constants";
import { z } from "zod";
import { useStartRegistrationMutation } from "@/features/enterprise-registration/enterprise-registration.queries";

const startIntakeFormSchema = z.object({
  representative_name: z
    .string()
    .trim()
    .min(
      REGISTRATION_CONFIG.REPRESENTATIVE_NAME_MIN_LENGTH,
      `Full name must be at least ${REGISTRATION_CONFIG.REPRESENTATIVE_NAME_MIN_LENGTH} characters`,
    )
    .max(
      REGISTRATION_CONFIG.REPRESENTATIVE_NAME_MAX_LENGTH,
      `Full name cannot exceed ${REGISTRATION_CONFIG.REPRESENTATIVE_NAME_MAX_LENGTH} characters`,
    ),
  corporate_email: corporateEmailSchema,
});

type StartIntakeFormData = z.infer<typeof startIntakeFormSchema>;

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
  } = useForm<StartIntakeFormData>({
    resolver: zodResolver(startIntakeFormSchema),
    defaultValues: {
      representative_name: "",
      corporate_email: "",
    },
  });

  const onSubmit = async (data: StartIntakeFormData) => {
    setServerError(null);
    try {
      await startMutation.mutateAsync({
        representative_name: data.representative_name,
        corporate_email: data.corporate_email,
        representative_phone: "0900000000",
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
    <div className="w-full max-w-[460px] rounded-2xl border border-border bg-card p-8 shadow-xs">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Register your company
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
          Start with your work email. We&apos;ll send a link to confirm it. You won&apos;t need a password until your company is approved.
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
          label="Full name"
          required
          error={errors.representative_name?.message}
        >
          <Input
            id="representative_name"
            placeholder="Đỗ Minh Châu"
            {...register("representative_name")}
          />
        </FormField>

        <FormField
          htmlFor="corporate_email"
          label="Work email"
          required
          hint="Use your company domain, not a personal email."
          error={errors.corporate_email?.message}
        >
          <Input
            id="corporate_email"
            type="email"
            placeholder="chau.do@lumenlogistics.vn"
            {...register("corporate_email")}
          />
        </FormField>

        <Button
          type="submit"
          className="mt-2 w-full"
          disabled={isSubmitting || startMutation.isPending}
        >
          {isSubmitting || startMutation.isPending
            ? "Sending confirmation link..."
            : "Send confirmation link"}
        </Button>
      </form>

      <div className="mt-6 flex flex-col gap-2.5 border-t border-border pt-5 text-[13px] text-muted-foreground">
        <div>
          Started a registration before?{" "}
          <button
            type="button"
            onClick={onContinueLaterClick}
            className="font-semibold text-primary hover:underline"
          >
            Continue it
          </button>
        </div>
        <div>
          Already work at a company on ITTalent?{" "}
          <Link
            to="/login"
            className="font-semibold text-primary hover:underline"
          >
            Employer sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
