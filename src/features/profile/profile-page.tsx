import { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import type { MyProfile } from "@/api/generated/types.gen";
import { requestErrorMessage } from "@/api/request-error";
import { ErrorState } from "@/components/common/error-state";
import { FormField } from "@/components/common/form-field";
import { InlineErrorAlert } from "@/components/common/inline-error-alert";
import { PersonAvatar } from "@/components/common/person-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordField } from "@/components/common/password-field";
import { strongPasswordSchema } from "@/lib/password-schema";

import {
  AVATAR_MAX_BYTES,
  AVATAR_TYPES,
  PROFILE_NAME_MAX,
  PROFILE_NAME_MIN,
  PROFILE_PHONE_PATTERN,
} from "./profile.constants";
import {
  useChangeMyPassword,
  useMyProfile,
  useUpdateMyProfile,
  useUploadMyAvatar,
} from "./profile.queries";

type Section = "details" | "password";
type DetailsForm = { fullName: string; phone: string };
type PasswordForm = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export function ProfilePage() {
  const { t } = useTranslation();
  const [section, setSection] = useState<Section>("details");
  const profile = useMyProfile();

  if (profile.isPending)
    return (
      <div
        className="rounded-2xl border border-border bg-card p-6 text-muted-foreground"
        role="status"
      >
        {t("myProfile.loading")}
      </div>
    );
  if (profile.isError)
    return (
      <ErrorState
        description={requestErrorMessage(
          profile.error,
          t("myProfile.loadFailed"),
        )}
        onRetry={() => void profile.refetch()}
        title={t("myProfile.loadFailed")}
      />
    );
  if (!profile.data)
    return (
      <ErrorState
        description={t("myProfile.empty")}
        title={t("myProfile.title")}
      />
    );

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <h1 className="itt-display text-2xl font-semibold">
          {t("myProfile.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("myProfile.subtitle")}
        </p>
      </div>
      <div
        aria-label={t("myProfile.sections")}
        className="flex gap-2 border-b border-border"
        role="tablist"
      >
        <button
          aria-selected={section === "details"}
          className={`px-3 py-2 text-sm font-medium ${section === "details" ? "border-b-2 border-primary text-foreground" : "text-muted-foreground"}`}
          onClick={() => setSection("details")}
          role="tab"
          type="button"
        >
          {t("myProfile.details")}
        </button>
        <button
          aria-selected={section === "password"}
          className={`px-3 py-2 text-sm font-medium ${section === "password" ? "border-b-2 border-primary text-foreground" : "text-muted-foreground"}`}
          onClick={() => setSection("password")}
          role="tab"
          type="button"
        >
          {t("myProfile.password")}
        </button>
      </div>
      {section === "details" ? (
        <ProfileDetails profile={profile.data} />
      ) : (
        <ChangePassword hasPassword={profile.data.hasPassword} />
      )}
    </div>
  );
}

function ProfileDetails({ profile }: { profile: MyProfile }) {
  const { t } = useTranslation();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const update = useUpdateMyProfile();
  const upload = useUploadMyAvatar();
  const schema = z.object({
    fullName: z
      .string()
      .trim()
      .min(PROFILE_NAME_MIN, t("myProfile.nameInvalid"))
      .max(PROFILE_NAME_MAX, t("myProfile.nameInvalid")),
    phone: z
      .string()
      .trim()
      .refine(
        (value) =>
          value === "" ||
          PROFILE_PHONE_PATTERN.test(value.replace(/[\s().-]/g, "")),
        t("myProfile.phoneInvalid"),
      ),
  });
  const form = useForm<DetailsForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: profile.fullName ?? "",
      phone: profile.phone ?? "",
    },
  });
  useEffect(() => {
    if (!form.formState.isDirty)
      form.reset({
        fullName: profile.fullName ?? "",
        phone: profile.phone ?? "",
      });
  }, [profile.fullName, profile.phone, form]);
  useEffect(
    () => () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    },
    [avatarPreview],
  );

  function selectAvatar(file?: File) {
    setAvatarError(null);
    setAvatarFile(null);
    setAvatarPreview(null);
    if (!file) return;
    if (!AVATAR_TYPES.includes(file.type as (typeof AVATAR_TYPES)[number])) {
      setAvatarError(t("myProfile.avatarType"));
      return;
    }
    if (file.size === 0 || file.size > AVATAR_MAX_BYTES) {
      setAvatarError(t("myProfile.avatarSize"));
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function save(values: DetailsForm) {
    setSaveError(null);
    setSaved(false);
    try {
      const updated = await update.mutateAsync({
        fullName: values.fullName.trim(),
        phone: values.phone.replace(/[\s().-]/g, "") || null,
      });
      form.reset({
        fullName: updated.fullName ?? "",
        phone: updated.phone ?? "",
      });
      setSaved(true);
    } catch (error) {
      setSaveError(requestErrorMessage(error, t("myProfile.saveFailed")));
    }
  }

  async function saveAvatar() {
    if (!avatarFile) return;
    setAvatarError(null);
    try {
      await upload.mutateAsync(avatarFile);
      setAvatarFile(null);
      setAvatarPreview(null);
      if (fileInput.current) fileInput.current.value = "";
    } catch (error) {
      setAvatarError(requestErrorMessage(error, t("myProfile.avatarFailed")));
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-5">
          <PersonAvatar
            className="size-20 text-xl"
            name={profile.fullName ?? profile.username}
            src={avatarPreview ?? profile.avatarUrl}
          />
          <div className="space-y-2">
            <p className="font-semibold">
              {profile.fullName || profile.username}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("myProfile.avatarHint")}
            </p>
            <input
              ref={fileInput}
              accept="image/jpeg,image/png,image/webp"
              aria-label={t("myProfile.chooseAvatar")}
              className="sr-only"
              onChange={(event) => selectAvatar(event.target.files?.[0])}
              type="file"
            />
            <div className="flex gap-2">
              <Button
                onClick={() => fileInput.current?.click()}
                type="button"
                variant="outline"
              >
                {t("myProfile.chooseAvatar")}
              </Button>
              {avatarFile ? (
                <Button
                  disabled={upload.isPending}
                  onClick={() => void saveAvatar()}
                  type="button"
                >
                  {upload.isPending
                    ? t("myProfile.uploading")
                    : t("myProfile.uploadAvatar")}
                </Button>
              ) : null}
            </div>
          </div>
        </div>
        {avatarError ? (
          <div className="mt-3" role="alert">
            <InlineErrorAlert>{avatarError}</InlineErrorAlert>
          </div>
        ) : null}
      </section>
      <form
        className="space-y-5 rounded-2xl border border-border bg-card p-5 sm:p-6"
        onSubmit={form.handleSubmit(save)}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            error={form.formState.errors.fullName?.message}
            htmlFor="profile-name"
            label={t("myProfile.fullName")}
          >
            <Input id="profile-name" {...form.register("fullName")} />
          </FormField>
          <FormField
            error={form.formState.errors.phone?.message}
            htmlFor="profile-phone"
            label={t("myProfile.phone")}
          >
            <Input
              id="profile-phone"
              inputMode="tel"
              {...form.register("phone")}
            />
          </FormField>
          <FormField htmlFor="profile-email" label={t("myProfile.email")}>
            <Input id="profile-email" readOnly value={profile.email} />
          </FormField>
          <FormField htmlFor="profile-role" label={t("myProfile.role")}>
            <Input id="profile-role" readOnly value={profile.role} />
          </FormField>
        </div>
        {saveError ? <InlineErrorAlert>{saveError}</InlineErrorAlert> : null}
        {saved ? (
          <p className="text-sm text-(--status-success-fg)" role="status">
            {t("myProfile.saved")}
          </p>
        ) : null}
        <div className="flex justify-end">
          <Button
            disabled={update.isPending || !form.formState.isDirty}
            size="xl"
            type="submit"
          >
            {update.isPending ? t("myProfile.saving") : t("myProfile.save")}
          </Button>
        </div>
      </form>
    </div>
  );
}

function ChangePassword({ hasPassword }: { hasPassword: boolean }) {
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const change = useChangeMyPassword();
  const schema = z
    .object({
      currentPassword: z.string().min(1, t("myProfile.currentRequired")),
      newPassword: strongPasswordSchema.regex(
        /[!@#$%^&*]/,
        t("myProfile.passwordHint"),
      ),
      confirmPassword: z.string().min(1, t("myProfile.confirmRequired")),
    })
    .refine((value) => value.newPassword === value.confirmPassword, {
      path: ["confirmPassword"],
      message: t("myProfile.passwordMismatch"),
    })
    .refine((value) => value.currentPassword !== value.newPassword, {
      path: ["newPassword"],
      message: t("myProfile.passwordSame"),
    });
  const form = useForm<PasswordForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  if (!hasPassword)
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        {t("myProfile.socialAccount")}
      </div>
    );

  async function save(values: PasswordForm) {
    setError(null);
    setSuccess(false);
    try {
      await change.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      form.reset();
      setSuccess(true);
    } catch (failure) {
      setError(requestErrorMessage(failure, t("myProfile.passwordFailed")));
    }
  }

  return (
    <form
      className="space-y-5 rounded-2xl border border-border bg-card p-5 sm:p-6"
      onSubmit={form.handleSubmit(save)}
    >
      <PasswordField
        error={form.formState.errors.currentPassword?.message}
        id="current-password"
        label={t("myProfile.currentPassword")}
        registration={form.register("currentPassword")}
      />
      <PasswordField
        error={form.formState.errors.newPassword?.message}
        hint={t("myProfile.passwordHint")}
        id="new-password"
        label={t("myProfile.newPassword")}
        registration={form.register("newPassword")}
      />
      <PasswordField
        error={form.formState.errors.confirmPassword?.message}
        id="confirm-password"
        label={t("myProfile.confirmPassword")}
        registration={form.register("confirmPassword")}
      />
      {error ? <InlineErrorAlert>{error}</InlineErrorAlert> : null}
      {success ? (
        <p className="text-sm text-(--status-success-fg)" role="status">
          {t("myProfile.passwordChanged")}
        </p>
      ) : null}
      <div className="flex justify-end">
        <Button disabled={change.isPending} size="xl" type="submit">
          {change.isPending
            ? t("myProfile.changingPassword")
            : t("myProfile.changePassword")}
        </Button>
      </div>
    </form>
  );
}
