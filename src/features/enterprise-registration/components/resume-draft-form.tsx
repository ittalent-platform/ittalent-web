import { useState } from "react";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
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
      // Re-triggering magic intake sends the active draft resume link if exists
      setIsSubmitted(true);
    } catch {
      setError("Failed to send resume link. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="w-full max-w-[440px] rounded-2xl border border-border bg-card p-8 text-center shadow-xs">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-(--status-success-bg) text-(--status-success-fg)">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Resume link sent
        </h2>
        <p className="mt-2 text-[13.5px] text-muted-foreground">
          If an active registration exists for{" "}
          <span className="font-semibold text-foreground">{email}</span>, we have emailed
          a resume link.
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
    <div className="w-full max-w-[440px] rounded-2xl border border-border bg-card p-8 shadow-xs">
      <div className="mb-6">
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Continue your registration
        </h2>
        <p className="mt-1 text-[13.5px] text-muted-foreground">
          Enter your registered work email to receive a secure link to resume your draft.
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
          label="Corporate work email"
          required
          error={error}
        >
          <Input
            id="resume_email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
          />
        </FormField>

        <Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
          {isSubmitting ? "Sending resume link..." : "Send resume link →"}
        </Button>
      </form>

      <div className="mt-6 border-t border-line-muted pt-4 text-center">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to new registration
        </button>
      </div>
    </div>
  );
}
