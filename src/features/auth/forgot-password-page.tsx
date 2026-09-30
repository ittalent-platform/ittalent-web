import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Link } from "react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Mail } from "lucide-react";

import { postApiV1AuthForgotPassword } from "@/api/generated";
import { FormField } from "@/components/common/form-field";
import { InlineBanner } from "@/components/common/inline-banner";
import { StatusPanel } from "@/components/common/status-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthCardPage, AuthFormHeader, AuthStatusCard } from "./auth-status-card";
import { AUTH_ACTION_CLASS, AUTH_FULL_ACTION_CLASS } from "./auth-status.constants";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "./forgot-password.schema";
import { getAuthErrorMessage } from "./auth-utils";

const HTTP_TOO_MANY_REQUESTS = 429;
const HTTP_SERVICE_UNAVAILABLE = 503;

type Banner = { message: string; tone: "error" | "warning" };

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [banner, setBanner] = useState<Banner | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const form = useForm<ForgotPasswordFormValues>({
    defaultValues: { email: "" },
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onSubmit(values: ForgotPasswordFormValues) {
    setBanner(null);

    const response = await postApiV1AuthForgotPassword({ body: { email: values.email } });

    if (response.error) {
      const status = response.response?.status;
      const fallback =
        status === HTTP_TOO_MANY_REQUESTS
          ? t("auth.forgot.tooMany")
          : status === HTTP_SERVICE_UNAVAILABLE
            ? t("auth.forgot.sendFailed")
            : t("auth.forgot.errorFallback");
      setBanner({
        message: getAuthErrorMessage(response.error, fallback),
        // Throttled requests are the visitor's to fix (red); an unavailable mailer is ours (amber).
        tone: status === HTTP_SERVICE_UNAVAILABLE ? "warning" : "error",
      });
      return;
    }

    // The same confirmation for every address, so the page never reveals whether an account exists.
    setSentTo(values.email);
  }

  if (sentTo) {
    return (
      <AuthCardPage>
        <AuthStatusCard>
          <StatusPanel
            actions={
              <Button asChild className={AUTH_ACTION_CLASS} shape="xl">
                <Link to="/login">{t("auth.forgot.backToSignInPlain")}</Link>
              </Button>
            }
            description={
              <Trans
                components={{ strong: <strong className="font-semibold text-foreground" /> }}
                i18nKey="auth.forgot.sentBody"
                values={{ email: sentTo }}
              />
            }
            footer={
              <>
                {t("auth.forgot.wrongEmail")}{" "}
                <button
                  className="cursor-pointer font-semibold text-fg-link hover:underline"
                  onClick={() => setSentTo(null)}
                  type="button"
                >
                  {t("auth.forgot.useDifferentEmail")}
                </button>
              </>
            }
            icon={Mail}
            note={t("auth.forgot.sentNote")}
            title={t("auth.forgot.sentTitle")}
            tone="success"
          />
        </AuthStatusCard>
      </AuthCardPage>
    );
  }

  return (
    <AuthCardPage>
      <AuthStatusCard className="flex flex-col gap-[22px]">
        <AuthFormHeader description={t("auth.forgot.subtitle")} title={t("auth.forgot.title")} />

        {banner ? <InlineBanner tone={banner.tone}>{banner.message}</InlineBanner> : null}

        <form className="flex flex-col gap-[22px]" noValidate onSubmit={form.handleSubmit(onSubmit, () => setBanner(null))}>
          <FormField error={form.formState.errors.email?.message} htmlFor="forgot-password-email" label={t("auth.forgot.email")}>
            <Input
              aria-invalid={form.formState.errors.email ? true : undefined}
              id="forgot-password-email"
              placeholder={t("auth.forgot.emailPlaceholder")}
              type="email"
              {...form.register("email")}
            />
          </FormField>

          <Button className={AUTH_FULL_ACTION_CLASS} disabled={form.formState.isSubmitting} shape="xl" type="submit">
            {form.formState.isSubmitting ? t("auth.forgot.submitting") : t("auth.forgot.submit")}
          </Button>
        </form>

        <Link className="self-start text-[13.5px] font-semibold text-fg-link no-underline hover:underline" to="/login">
          {t("auth.forgot.backToSignInPlain")}
        </Link>
      </AuthStatusCard>
    </AuthCardPage>
  );
}
