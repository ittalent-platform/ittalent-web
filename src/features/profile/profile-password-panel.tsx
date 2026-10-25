import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Monitor } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { expireSession } from "@/api/client";
import { HTTP_TOO_MANY_REQUESTS, HTTP_UNAUTHORIZED } from "@/api/http-status";
import { requestCode, requestStatus } from "@/api/request-error";
import { InlineBanner } from "@/components/common/inline-banner";
import { InlineErrorAlert } from "@/components/common/inline-error-alert";
import { PasswordField } from "@/components/common/password-field";
import { SectionCard } from "@/components/common/section-card";
import { useToast } from "@/components/toast/toast-provider";
import { Button } from "@/components/ui/button";
import { PASSWORD_RULES } from "@/lib/password-rules";
import { strongPasswordSchema } from "@/lib/password-schema";
import { cn } from "@/lib/utils";

import { useChangeMyPassword } from "./profile.queries";

type PasswordForm = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const PASSWORD_POLICY_ERROR_CODES = new Set([
  "INVALID_NEW_PASSWORD",
  "PASSWORD_POLICY_INVALID",
]);
const PASSWORD_CONFIRMATION_ERROR_CODE = "PASSWORD_CONFIRMATION_INVALID";
const PASSWORD_UNCHANGED_ERROR_CODE = "PASSWORD_UNCHANGED";
const SESSION_REVOKED_ERROR_CODE = "SESSION_REVOKED";
const CURRENT_CREDENTIAL_ERROR_CODE = "CURRENT_CREDENTIAL_INVALID";

export function ChangePasswordPanel({
  hasPassword,
  onCancel,
}: {
  hasPassword: boolean;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const change = useChangeMyPassword();
  const schema = z
    .object({
      currentPassword: z.string().min(1, t("myProfile.currentRequired")),
      newPassword: strongPasswordSchema,
      confirmPassword: z.string().min(1, t("myProfile.confirmRequired")),
    })
    .refine((value) => value.currentPassword !== value.newPassword, {
      path: ["newPassword"],
      message: t("myProfile.passwordSameAsCurrent"),
    })
    .refine((value) => value.newPassword === value.confirmPassword, {
      path: ["confirmPassword"],
      message: t("myProfile.passwordMismatch"),
    });
  const form = useForm<PasswordForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    mode: "onSubmit",
  });
  const newPassword = useWatch({
    control: form.control,
    name: "newPassword",
  });
  const passwordRules = PASSWORD_RULES.map((rule) => ({
    key: rule.id,
    met: rule.test(newPassword ?? ""),
    text: t(`myProfile.passwordRules.${rule.id}`),
  }));

  if (!hasPassword) {
    return (
      <SectionCard className="p-6">
        <InlineBanner tone="info">{t("myProfile.socialAccount")}</InlineBanner>
        <div className="flex justify-end">
          <Button onClick={onCancel} size="xl" type="button" variant="outline">
            {t("myProfile.backToProfile")}
          </Button>
        </div>
      </SectionCard>
    );
  }

  async function save(values: PasswordForm) {
    setError(null);
    try {
      await change.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        confirmation: values.confirmPassword,
      });
      form.reset();
      showToast({
        message: t("myProfile.passwordChanged"),
        title: t("myProfile.passwordChanged"),
        tone: "success",
      });
      onCancel();
    } catch (failure) {
      const code = requestCode(failure);
      if (requestStatus(failure) === HTTP_TOO_MANY_REQUESTS || code === "RATE_LIMITED") {
        setError(t("myProfile.passwordRateLimited"));
      } else if (code && PASSWORD_POLICY_ERROR_CODES.has(code)) {
        form.setError("newPassword", {
          message: t("myProfile.passwordPolicyRejected"),
          type: "server",
        });
      } else if (code === PASSWORD_CONFIRMATION_ERROR_CODE) {
        form.setError("confirmPassword", {
          message: t("myProfile.passwordMismatch"),
          type: "server",
        });
      } else if (code === PASSWORD_UNCHANGED_ERROR_CODE) {
        form.setError("newPassword", {
          message: t("myProfile.passwordSameAsCurrent"),
          type: "server",
        });
      } else if (code === "ACCOUNT_HAS_NO_PASSWORD") {
        setError(t("myProfile.socialAccount"));
      } else if (
        requestStatus(failure) === HTTP_UNAUTHORIZED ||
        code === SESSION_REVOKED_ERROR_CODE
      ) {
        expireSession();
        setError(t("myProfile.passwordSessionExpired"));
      } else if (code === CURRENT_CREDENTIAL_ERROR_CODE) {
        setError(t("myProfile.passwordIncorrect"));
      } else {
        setError(t("myProfile.passwordFailed"));
      }
    }
  }

  return (
    <form onSubmit={form.handleSubmit(save)}>
      <SectionCard className="gap-[18px] p-6">
        <div className="flex max-w-[560px] flex-col gap-[18px]">
          <PasswordField
            error={form.formState.errors.currentPassword?.message}
            id="current-password"
            label={t("myProfile.currentPassword")}
            registration={form.register("currentPassword")}
            required
          />
          <div className="space-y-2.5">
            <PasswordField
              error={form.formState.errors.newPassword?.message}
              id="new-password"
              label={t("myProfile.newPassword")}
              registration={form.register("newPassword")}
              required
            />
            <ul
              aria-label={t("myProfile.passwordRules.label")}
              className="grid list-none gap-2 p-0 sm:grid-cols-2 sm:gap-x-4"
            >
              {passwordRules.map((rule) => (
                <li
                  className={cn(
                    "flex items-center gap-2 text-[13px]",
                    rule.met
                      ? "text-(--status-success-fg)"
                      : "text-muted-foreground",
                  )}
                  key={rule.key}
                >
                  <span
                    className={cn(
                      "grid size-4 shrink-0 place-items-center rounded-full",
                      rule.met
                        ? "bg-(--status-success-fg) text-card"
                        : "border border-border-dashed",
                    )}
                  >
                    {rule.met ? (
                      <Check aria-hidden className="size-2.5" strokeWidth={3.5} />
                    ) : null}
                  </span>
                  {rule.text}
                </li>
              ))}
            </ul>
          </div>
          <PasswordField
            error={form.formState.errors.confirmPassword?.message}
            id="confirm-password"
            label={t("myProfile.confirmPassword")}
            registration={form.register("confirmPassword")}
            required
          />
        </div>
        {error ? <InlineErrorAlert>{error}</InlineErrorAlert> : null}
        <div className="flex flex-wrap items-center gap-3 border-t border-border/60 pt-[18px]">
          <p className="flex min-w-0 flex-1 items-start gap-2 text-[13px] text-muted-foreground">
            <Monitor aria-hidden className="mt-0.5 size-4 shrink-0" />
            <span>{t("myProfile.passwordSessionNote")}</span>
          </p>
          <Button
            disabled={change.isPending}
            onClick={onCancel}
            size="xl"
            type="button"
            variant="outline"
          >
            {t("myProfile.cancel")}
          </Button>
          <Button disabled={change.isPending} size="xl" type="submit">
            {change.isPending
              ? t("myProfile.changingPassword")
              : t("myProfile.changePassword")}
          </Button>
        </div>
      </SectionCard>
    </form>
  );
}
