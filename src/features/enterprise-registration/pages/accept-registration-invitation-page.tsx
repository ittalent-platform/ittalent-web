import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Loader2, TriangleAlert } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router";

import { InlineBanner } from "@/components/common/inline-banner";
import { StatusPanel } from "@/components/common/status-panel";
import { Button } from "@/components/ui/button";
import { AUTH_FULL_ACTION_CLASS } from "@/features/auth/auth-status.constants";
import { AuthCardPage, AuthFormHeader, AuthStatusCard } from "@/features/auth/auth-status-card";
import { PasswordField } from "@/features/auth/password-field";
import { PASSWORD_RULES } from "@/features/auth/password-rules";
import { cn } from "@/lib/utils";
import { Circle, Check as CheckIcon, X } from "lucide-react";

import {
  acceptInvitationFormSchema,
  type AcceptInvitationFormData,
} from "../enterprise-registration.schemas";
import { useAcceptRegistrationInvitationMutation } from "../enterprise-registration.queries";

function PasswordRuleList({ password }: { password: string }) {
  const { t } = useTranslation();
  const touched = password.length > 0;
  return (
    <ul aria-live="polite" className="flex flex-col gap-1 text-[13px]">
      {PASSWORD_RULES.map(({ id, test }) => {
        const ok = test(password);
        const Icon = !touched ? Circle : ok ? CheckIcon : X;
        return (
          <li
            className={cn(
              "flex items-center gap-2",
              !touched
                ? "text-muted-foreground"
                : ok
                  ? "text-(--status-success-fg)"
                  : "text-destructive",
            )}
            key={id}
          >
            <Icon
              aria-hidden
              className={touched ? "size-3.5" : "size-2"}
              strokeWidth={touched ? 2.5 : 2}
            />
            {t(`accountInvitation.rule.${id}`)}
          </li>
        );
      })}
    </ul>
  );
}

export function AcceptRegistrationInvitationPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [done, setDone] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const acceptMutation = useAcceptRegistrationInvitationMutation();

  const form = useForm<AcceptInvitationFormData>({
    resolver: zodResolver(acceptInvitationFormSchema),
    defaultValues: {
      password: "",
      confirm_password: "",
      agree_to_terms: false as never,
    },
    mode: "onChange",
  });

  const [password = "", confirmPassword = ""] = useWatch({
    control: form.control,
    name: ["password", "confirm_password"],
  });

  const onSubmit = async (values: AcceptInvitationFormData) => {
    setErrorMessage(null);
    try {
      await acceptMutation.mutateAsync({
        token,
        password: values.password,
      });
      setDone(true);
      form.reset();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err && typeof err.message === "string"
          ? err.message
          : t("accountInvitation.failed", "Failed to activate administrator account.");
      setErrorMessage(msg);
    }
  };

  const signInButton = (
    <Button asChild className={AUTH_FULL_ACTION_CLASS} shape="xl">
      <Link to="/login">{t("accountInvitation.signIn", "Sign in to ITTalent")}</Link>
    </Button>
  );

  let content: ReactNode;

  if (done) {
    content = (
      <StatusPanel
        actions={signInButton}
        description={t(
          "enterpriseRegistration.invitationSuccessDesc",
          "Your Enterprise Administrator account is now active. You can sign in and manage your company workspace.",
        )}
        icon={Check}
        title={t("accountInvitation.successTitle", "Account activated")}
        tone="success"
      />
    );
  } else if (!token) {
    content = (
      <StatusPanel
        actions={
          <Button asChild className={AUTH_FULL_ACTION_CLASS} shape="xl" variant="outline">
            <Link to="/">{t("common.backToHome", "Back to Home")}</Link>
          </Button>
        }
        description={t(
          "accountInvitation.invalidDescription",
          "This invitation link is missing or invalid. Please check the link from your email.",
        )}
        icon={TriangleAlert}
        title={t("accountInvitation.invalidTitle", "Invalid invitation")}
        tone="warning"
      />
    );
  } else {
    const passwordError =
      form.formState.errors.password && password
        ? t("accountInvitation.passwordRules", "Password does not meet all requirements")
        : undefined;

    content = (
      <div className="flex flex-col gap-[22px]">
        <AuthFormHeader
          description={t(
            "enterpriseRegistration.invitationDesc",
            "Set your password to activate your Enterprise Administrator account and access your organization.",
          )}
          title={t("enterpriseRegistration.invitationTitle", "Activate your administrator account")}
        />

        {errorMessage ? <InlineBanner tone="error">{errorMessage}</InlineBanner> : null}

        <form className="flex flex-col gap-5" noValidate onSubmit={form.handleSubmit(onSubmit)}>
          <fieldset className="flex flex-col gap-5" disabled={acceptMutation.isPending}>
            <div className="flex flex-col gap-2.5">
              <PasswordField
                error={passwordError}
                id="invite-password"
                label={t("accountInvitation.password", "New password")}
                registration={form.register("password")}
              />
              <PasswordRuleList password={password} />
            </div>

            <PasswordField
              error={
                form.formState.errors.confirm_password && confirmPassword
                  ? form.formState.errors.confirm_password.message
                  : undefined
              }
              id="invite-confirm-password"
              label={t("accountInvitation.confirmPassword", "Confirm password")}
              registration={form.register("confirm_password")}
            />

            <div className="flex flex-col gap-1.5 pt-1">
              <label
                className="flex cursor-pointer items-start gap-2.5 text-[13.5px] leading-[1.5] text-muted-foreground"
                htmlFor="agree-to-terms"
              >
                <input
                  className="mt-1 size-4 cursor-pointer accent-(--primary)"
                  id="agree-to-terms"
                  type="checkbox"
                  {...form.register("agree_to_terms")}
                />
                <span>
                  {t(
                    "enterpriseRegistration.validation.termsRequired",
                    "You must agree to the Employer Terms of Service",
                  )}
                </span>
              </label>
              {form.formState.errors.agree_to_terms?.message ? (
                <p className="text-[12.5px] text-destructive">
                  {form.formState.errors.agree_to_terms.message}
                </p>
              ) : null}
            </div>
          </fieldset>

          <Button
            className={AUTH_FULL_ACTION_CLASS}
            disabled={acceptMutation.isPending || !form.formState.isValid}
            shape="xl"
            type="submit"
          >
            {acceptMutation.isPending ? (
              <>
                <Loader2 aria-hidden className="size-4 animate-spin" />
                {t("accountInvitation.activating", "Activating account...")}
              </>
            ) : (
              t("accountInvitation.accept", "Activate administrator account")
            )}
          </Button>
        </form>

        <p className="text-[13px] text-muted-foreground">
          {t(
            "accountInvitation.expiresNoteGeneric",
            "This single-use invitation link expires in 7 days.",
          )}
        </p>
      </div>
    );
  }

  return (
    <AuthCardPage tone="employer">
      <AuthStatusCard className="max-w-[460px]">{content}</AuthStatusCard>
    </AuthCardPage>
  );
}
