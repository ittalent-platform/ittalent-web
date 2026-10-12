import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";

import { FormField } from "@/components/common/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { corporateEmailSchema } from "@/features/enterprise-registration/enterprise-registration.schemas";

const STRONG = { strong: <strong className="font-semibold text-foreground" /> };
const ACTION_CLASS = "h-12 w-full rounded-xl text-[14.5px] font-semibold";
const TITLE_CLASS = "font-heading text-2xl font-semibold tracking-[-0.01em] text-foreground sm:text-[30px]";

export function ResumeDraftForm({ onBack }: { onBack: () => void }) {
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
      <div className="flex w-full flex-col gap-[22px]">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-(--status-success-bg) text-(--status-success-fg)">
          <CheckCircle2 aria-hidden className="size-7" />
        </div>
        <div className="flex flex-col gap-2.5">
          <h1 className={TITLE_CLASS}>{t("enterpriseRegistration.resume.sentTitle")}</h1>
          <p className="text-[14.5px] leading-[1.6] text-muted-foreground">
            <Trans components={STRONG} i18nKey="enterpriseRegistration.resume.sentBody" values={{ email }} />
          </p>
        </div>
        <Button className={ACTION_CLASS} onClick={onBack} type="button" variant="outline">
          {t("enterpriseRegistration.resume.returnToRegistration")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-[22px]">
      <div className="flex flex-col gap-2.5">
        <h1 className={TITLE_CLASS}>{t("enterpriseRegistration.resume.title")}</h1>
        <p className="text-[14.5px] leading-[1.6] text-muted-foreground">{t("enterpriseRegistration.resume.subtitle")}</p>
      </div>

      <form className="flex flex-col gap-[18px]" noValidate onSubmit={handleSubmit}>
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

        <Button className={ACTION_CLASS} type="submit">
          {t("enterpriseRegistration.resume.submit")}
        </Button>
      </form>

      <div className="pt-1 text-[13.5px] text-muted-foreground">
        {t("enterpriseRegistration.resume.newPrompt")}{" "}
        <button className="cursor-pointer font-bold text-fg-link hover:underline" onClick={onBack} type="button">
          {t("enterpriseRegistration.resume.newLink")}
        </button>
      </div>
    </div>
  );
}
