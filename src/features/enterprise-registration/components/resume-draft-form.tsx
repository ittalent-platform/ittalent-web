import { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";

import { FormField } from "@/components/common/form-field";
import { StatusPanel } from "@/components/common/status-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthFormHeader, AuthStatusCard } from "@/features/auth/auth-status-card";
import { AUTH_ACTION_CLASS, AUTH_FULL_ACTION_CLASS } from "@/features/auth/auth-status.constants";
import { corporateEmailSchema } from "@/features/enterprise-registration/enterprise-registration.schemas";

const STRONG = { strong: <strong className="font-semibold text-foreground" /> };

export function ResumeDraftForm({
  onBack,
}: {
  onBack: () => void;
}) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parseResult = corporateEmailSchema.safeParse(email);
    if (!parseResult.success) {
      setError(parseResult.error.issues[0]?.message || t("enterpriseRegistration.resume.invalidEmail"));
      return;
    }

    // Re-triggering magic intake sends the active draft resume link if exists
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <AuthStatusCard>
        <StatusPanel
          actions={
            <Button className={AUTH_ACTION_CLASS} onClick={onBack} shape="xl" type="button" variant="outline">
              {t("enterpriseRegistration.resume.returnToRegistration")}
            </Button>
          }
          description={<Trans components={STRONG} i18nKey="enterpriseRegistration.resume.sentBody" values={{ email }} />}
          icon={CheckCircle2}
          title={t("enterpriseRegistration.resume.sentTitle")}
          tone="success"
        />
      </AuthStatusCard>
    );
  }

  return (
    <AuthStatusCard className="flex flex-col gap-[22px]">
      <AuthFormHeader description={t("enterpriseRegistration.resume.subtitle")} title={t("enterpriseRegistration.resume.title")} />

      <form className="flex flex-col gap-[22px]" noValidate onSubmit={handleSubmit}>
        <FormField error={error} htmlFor="resume_email" label={t("enterpriseRegistration.resume.email")} required>
          <Input
            aria-invalid={Boolean(error)}
            id="resume_email"
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("enterpriseRegistration.start.emailPlaceholder")}
            type="email"
            value={email}
          />
        </FormField>

        <Button className={AUTH_FULL_ACTION_CLASS} shape="xl" type="submit">
          {t("enterpriseRegistration.resume.submit")}
          <ArrowRight aria-hidden />
        </Button>
      </form>

      <button className="inline-flex cursor-pointer items-center gap-1.5 self-center text-[13.5px] font-semibold text-fg-link hover:underline" onClick={onBack} type="button">
        <ArrowLeft aria-hidden className="size-3.5" />
        {t("enterpriseRegistration.resume.back")}
      </button>
    </AuthStatusCard>
  );
}
