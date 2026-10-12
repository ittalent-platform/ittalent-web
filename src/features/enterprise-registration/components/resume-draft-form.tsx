import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { FormField } from "@/components/common/form-field";
import { InlineBanner } from "@/components/common/inline-banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { corporateEmailSchema } from "@/features/enterprise-registration/enterprise-registration.schemas";

export function ResumeDraftForm({
  onBack,
}: {
  onBack: () => void;
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parseResult = corporateEmailSchema.safeParse(email);
    if (!parseResult.success) {
      setError(parseResult.error.issues[0]?.message || "Invalid work email");
      return;
    }

    setIsSubmitting(true);
    try {
      setIsSubmitted(true);
    } catch {
      setError("Failed to send resume link. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="flex w-full flex-col gap-[22px]">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-(--status-success-bg) text-(--status-success-fg)">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <div className="flex flex-col gap-2.5">
          <h1 className="font-heading text-2xl font-semibold tracking-[-0.01em] text-foreground sm:text-[30px]">
            Resume link sent
          </h1>
          <p className="text-[14.5px] leading-[1.6] text-muted-foreground">
            If an active registration exists for{" "}
            <strong className="font-semibold text-foreground">{email}</strong>, we have emailed
            a link to resume your draft.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="h-12 w-full rounded-xl text-[14.5px] font-semibold"
        >
          Return to registration
        </Button>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-[22px]">
      <div className="flex flex-col gap-2.5">
        <h1 className="font-heading text-2xl font-semibold tracking-[-0.01em] text-foreground sm:text-[30px]">
          Continue your registration
        </h1>
        <p className="text-[14.5px] leading-[1.6] text-muted-foreground">
          Enter the work email you registered with. We&apos;ll send a link that opens your draft or shows its review status.
        </p>
      </div>

      {error && (
        <InlineBanner tone="error">{error}</InlineBanner>
      )}

      <form id="resume-draft-form" onSubmit={handleSubmit} className="flex flex-col gap-[18px]">
        <FormField
          htmlFor="resume_email"
          label="Work email"
          required
          error={error}
        >
          <Input
            id="resume_email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="chau.do@lumenlogistics.vn"
            className="h-[46px] rounded-xl border-border bg-card px-[15px] text-[14px]"
          />
        </FormField>
      </form>

      <Button
        type="submit"
        form="resume-draft-form"
        disabled={isSubmitting}
        className="h-12 w-full rounded-xl text-[14.5px] font-semibold"
      >
        {isSubmitting ? "Sending link..." : "Send link"}
      </Button>

      <div className="pt-1 text-[13.5px] text-muted-foreground">
        New here?{" "}
        <button
          type="button"
          onClick={onBack}
          className="font-bold text-primary hover:underline"
        >
          Register your company
        </button>
      </div>
    </div>
  );
}
