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
    <div className="flex w-full flex-col gap-[22px]">
      <div className="flex flex-col gap-2.5">
        <h1 className="font-heading text-2xl font-semibold tracking-[-0.01em] text-foreground sm:text-[30px]">
          Register your company
        </h1>
        <p className="text-[14.5px] leading-[1.6] text-muted-foreground">
          Start with your work email. We&apos;ll send a link to confirm it. You won&apos;t need a password until your company is approved.
        </p>
      </div>

      {serverError && (
        <InlineBanner tone="error">{serverError}</InlineBanner>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-[18px]">
        <FormField
          htmlFor="representative_name"
          label="Full name"
          required
          error={errors.representative_name?.message}
        >
          <Input
            id="representative_name"
            placeholder="Đỗ Minh Châu"
            className="h-12 rounded-xl border-border bg-card px-[15px] text-[14px]"
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
            className="h-12 rounded-xl border-border bg-card px-[15px] text-[14px]"
            {...register("corporate_email")}
          />
        </FormField>

        <Button
          type="submit"
          className="h-12 w-full rounded-xl text-[14.5px] font-semibold"
          disabled={isSubmitting || startMutation.isPending}
        >
          {isSubmitting || startMutation.isPending
            ? "Sending confirmation link..."
            : "Send confirmation link"}
        </Button>
      </form>

      <div className="flex flex-col gap-2 pt-1 text-[13.5px] text-muted-foreground">
        <div>
          Started a registration before?{" "}
          <button
            type="button"
            onClick={onContinueLaterClick}
            className="font-bold text-primary hover:underline"
          >
            Continue it
          </button>
        </div>
        <div>
          Already work at a company on ITTalent?{" "}
          <Link
            to="/login"
            className="font-bold text-primary hover:underline"
          >
            Employer sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
