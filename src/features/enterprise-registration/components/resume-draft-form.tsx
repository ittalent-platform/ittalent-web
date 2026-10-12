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
      <div className="w-full max-w-[460px] rounded-2xl border border-border bg-card p-8 text-center shadow-xs">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-(--status-success-bg) text-(--status-success-fg)">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Resume link sent
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
          If an active registration exists for{" "}
          <span className="font-semibold text-foreground">{email}</span>, we have emailed
          a link to resume your draft.
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="mt-6 w-full"
        >
          Return to registration
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[460px] rounded-2xl border border-border bg-card p-8 shadow-xs">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Continue your registration
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
          Enter the work email you registered with. We&apos;ll send a link that opens your draft or shows its review status.
        </p>
      </div>

      {error && (
        <div className="mb-6">
          <InlineBanner tone="error">{error}</InlineBanner>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
          />
        </FormField>

        <Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
          {isSubmitting ? "Sending link..." : "Send link"}
        </Button>
      </form>

      <p className="mt-5 text-[12.5px] leading-relaxed text-muted-foreground">
        For your privacy we show the same message whether or not this email has a registration.
      </p>

      <div className="mt-6 border-t border-border pt-5 text-[13px] text-muted-foreground">
        New here?{" "}
        <button
          type="button"
          onClick={onBack}
          className="font-semibold text-primary hover:underline"
        >
          Register your company
        </button>
      </div>
    </div>
  );
}
