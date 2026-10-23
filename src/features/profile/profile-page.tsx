import { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Camera,
  Check,
  LockKeyhole,
  Monitor,
  Pencil,
  RefreshCw,
} from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { z } from "zod";

import type { MyProfile } from "@/api/generated/types.gen";
import { requestErrorMessage } from "@/api/request-error";
import { useSession } from "@/auth/use-session";
import { DetailRow } from "@/components/common/detail-row";
import { ErrorState } from "@/components/common/error-state";
import { FormField } from "@/components/common/form-field";
import { InlineBanner } from "@/components/common/inline-banner";
import { InlineErrorAlert } from "@/components/common/inline-error-alert";
import { PasswordField } from "@/components/common/password-field";
import { PersonAvatar } from "@/components/common/person-avatar";
import { SectionCard } from "@/components/common/section-card";
import { useToast } from "@/components/toast/toast-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/format";
import { strongPasswordSchema } from "@/lib/password-schema";
import { cn } from "@/lib/utils";

import {
  AVATAR_MAX_BYTES,
  AVATAR_TYPES,
  PASSWORD_RULES,
  PROFILE_NAME_MAX,
  PROFILE_NAME_MIN,
  PROFILE_PHONE_PATTERN,
  PROFILE_ROLE_KEYS,
  PROFILE_STATUS_LABEL_KEYS,
  PROFILE_STATUS_STYLES,
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
  const [editing, setEditing] = useState(false);
  const profile = useMyProfile();

  if (profile.isPending) return <ProfileSkeleton />;
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

  const title =
    section === "password"
      ? t("myProfile.password")
      : editing
        ? t("myProfile.editTitle")
        : t("myProfile.title");
  const subtitle =
    section === "password"
      ? t("myProfile.passwordSubtitle")
      : editing
        ? t("myProfile.editSubtitle")
        : t("myProfile.subtitle");

  return (
    <div className="mx-auto flex w-full max-w-[1028px] flex-col gap-5">
      <header className="flex flex-wrap items-end gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="itt-display text-[28px] font-semibold leading-tight">
            {title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {section === "details" && !editing ? (
          <Button
            className="text-muted-foreground"
            disabled={profile.isFetching}
            onClick={() => void profile.refetch()}
            shape="pill"
            size="lg"
            type="button"
            variant="ghost"
          >
            <RefreshCw
              aria-hidden
              className={cn("size-4", profile.isFetching && "animate-spin")}
            />
            {t("myProfile.refresh")}
          </Button>
        ) : (
          <Button
            onClick={() => {
              setSection("details");
              setEditing(false);
            }}
            size="lg"
            type="button"
            variant="ghost"
          >
            <ArrowLeft aria-hidden className="size-4" />
            {t("myProfile.backToProfile")}
          </Button>
        )}
      </header>

      {section === "details" ? (
        <ProfileDetails
          editing={editing}
          onEditChange={setEditing}
          onOpenPassword={() => {
            setEditing(false);
            setSection("password");
          }}
          profile={profile.data}
        />
      ) : (
        <ChangePassword
          hasPassword={profile.data.hasPassword}
          onCancel={() => setSection("details")}
        />
      )}
    </div>
  );
}

function ProfileSkeleton() {
  const { t } = useTranslation();
  return (
    <div
      className="mx-auto flex w-full max-w-[1028px] flex-col gap-5"
      role="status"
    >
      <span className="sr-only">{t("myProfile.loading")}</span>
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="surface-card flex items-center gap-5 p-6">
        <Skeleton className="size-[88px] rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}

function ProfileDetails({
  editing,
  onEditChange,
  onOpenPassword,
  profile,
}: {
  editing: boolean;
  onEditChange: (editing: boolean) => void;
  onOpenPassword: () => void;
  profile: MyProfile;
}) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
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

  const displayName = profile.fullName || profile.username;
  const roleKey =
    PROFILE_ROLE_KEYS[profile.role as keyof typeof PROFILE_ROLE_KEYS];
  const statusKey =
    PROFILE_STATUS_LABEL_KEYS[
      profile.status as keyof typeof PROFILE_STATUS_LABEL_KEYS
    ];
  const statusStyle =
    PROFILE_STATUS_STYLES[
      profile.status as keyof typeof PROFILE_STATUS_STYLES
    ] ?? "bg-muted text-muted-foreground";

  function clearAvatarSelection() {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileInput.current) fileInput.current.value = "";
  }

  function selectAvatar(file?: File) {
    setAvatarError(null);
    clearAvatarSelection();
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
    try {
      const updated = await update.mutateAsync({
        fullName: values.fullName.trim(),
        phone: values.phone.replace(/[\s().-]/g, "") || null,
      });
      form.reset({
        fullName: updated.fullName ?? "",
        phone: updated.phone ?? "",
      });
      onEditChange(false);
      showToast({
        message: t("myProfile.saved"),
        title: t("myProfile.saved"),
        tone: "success",
      });
    } catch (error) {
      setSaveError(requestErrorMessage(error, t("myProfile.saveFailed")));
    }
  }

  async function saveAvatar() {
    if (!avatarFile) return;
    setAvatarError(null);
    try {
      await upload.mutateAsync(avatarFile);
      clearAvatarSelection();
      showToast({
        message: t("myProfile.avatarSaved"),
        title: t("myProfile.avatarSaved"),
        tone: "success",
      });
    } catch (error) {
      setAvatarError(requestErrorMessage(error, t("myProfile.avatarFailed")));
    }
  }

  function cancelEditing() {
    form.reset({
      fullName: profile.fullName ?? "",
      phone: profile.phone ?? "",
    });
    setSaveError(null);
    onEditChange(false);
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionCard className="gap-[18px] p-6">
        <div className="flex flex-wrap items-center gap-[22px]">
          <div className="relative shrink-0">
            <PersonAvatar
              className="size-[88px] itt-display text-[26px]"
              name={displayName}
              src={avatarPreview ?? profile.avatarUrl}
            />
            <input
              ref={fileInput}
              accept="image/jpeg,image/png,image/webp"
              aria-label={t("myProfile.chooseAvatar")}
              className="sr-only"
              onChange={(event) => selectAvatar(event.target.files?.[0])}
              type="file"
            />
            <button
              aria-label={t("myProfile.changeAvatar")}
              className="absolute -bottom-0.5 -right-0.5 grid size-8 place-items-center rounded-full border-[3px] border-card bg-foreground text-card transition-colors hover:bg-foreground/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              onClick={() => fileInput.current?.click()}
              type="button"
            >
              <Camera aria-hidden className="size-3.5" />
            </button>
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="itt-display truncate text-2xl font-semibold">
              {displayName}
            </p>
            <div className="flex flex-wrap items-center gap-2 text-[13.5px] text-muted-foreground">
              <span className="wrap-anywhere">{profile.email}</span>
              <VerificationBadge verified={profile.emailVerified} />
            </div>
            <p className="text-[12.5px] text-muted-foreground">
              {t("myProfile.avatarHint")}
            </p>
          </div>
          {!editing ? (
            <Button
              onClick={() => onEditChange(true)}
              shape="pill"
              size="xl"
              type="button"
              variant="outline"
            >
              <Pencil aria-hidden className="size-4" />
              {t("myProfile.editProfile")}
            </Button>
          ) : null}
        </div>
        {avatarFile ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-[18px]">
            <p className="min-w-0 flex-1 truncate text-[13px] text-muted-foreground">
              {avatarFile.name}
            </p>
            <div className="flex gap-2">
              <Button
                disabled={upload.isPending}
                onClick={clearAvatarSelection}
                size="lg"
                type="button"
                variant="outline"
              >
                {t("myProfile.cancel")}
              </Button>
              <Button
                disabled={upload.isPending}
                onClick={() => void saveAvatar()}
                size="lg"
                type="button"
              >
                {upload.isPending
                  ? t("myProfile.uploading")
                  : t("myProfile.saveAvatar")}
              </Button>
            </div>
          </div>
        ) : null}
        {avatarError ? (
          <div role="alert">
            <InlineErrorAlert>{avatarError}</InlineErrorAlert>
          </div>
        ) : null}
      </SectionCard>

      {editing ? (
        <form
          className="flex flex-col gap-5"
          onSubmit={form.handleSubmit(save)}
        >
          <SectionCard
            className="gap-[18px] p-6"
            description={t("myProfile.personalDescription")}
            title={t("myProfile.details")}
            titleSize="lg"
          >
            <div className="grid gap-[18px] sm:grid-cols-2 sm:gap-4">
              <FormField
                error={form.formState.errors.fullName?.message}
                hint={t("myProfile.nameHint")}
                htmlFor="profile-name"
                label={t("myProfile.fullName")}
                required
              >
                <Input
                  aria-invalid={Boolean(form.formState.errors.fullName)}
                  id="profile-name"
                  {...form.register("fullName")}
                />
              </FormField>
              <FormField
                error={form.formState.errors.phone?.message}
                hint={t("myProfile.phoneHint")}
                htmlFor="profile-phone"
                label={t("myProfile.phone")}
              >
                <Input
                  aria-invalid={Boolean(form.formState.errors.phone)}
                  id="profile-phone"
                  inputMode="tel"
                  placeholder={t("myProfile.phonePlaceholder")}
                  {...form.register("phone")}
                />
              </FormField>
            </div>
            {saveError ? (
              <InlineErrorAlert>{saveError}</InlineErrorAlert>
            ) : null}
            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border/60 pt-[18px]">
              <Button
                disabled={update.isPending}
                onClick={cancelEditing}
                shape="pill"
                size="xl"
                type="button"
                variant="outline"
              >
                {t("myProfile.cancel")}
              </Button>
              <Button
                disabled={update.isPending || !form.formState.isDirty}
                shape="pill"
                size="xl"
                type="submit"
              >
                {update.isPending ? t("myProfile.saving") : t("myProfile.save")}
              </Button>
            </div>
          </SectionCard>
        </form>
      ) : (
        <SectionCard
          className="gap-[18px] p-6"
          description={t("myProfile.personalDescription")}
          title={t("myProfile.details")}
          titleSize="lg"
        >
          <dl className="m-0">
            <DetailRow
              className="sm:grid-cols-[180px_minmax(0,1fr)]"
              label={t("myProfile.fullName")}
              layout="grid"
              value={displayName}
            />
            <DetailRow
              className="sm:grid-cols-[180px_minmax(0,1fr)]"
              label={t("myProfile.phone")}
              layout="grid"
              value={profile.phone || t("myProfile.notProvided")}
            />
          </dl>
        </SectionCard>
      )}

      <SectionCard
        actions={
          <LockKeyhole aria-hidden className="size-4 text-muted-foreground" />
        }
        className="gap-[18px] p-6"
        description={t("myProfile.accountDescription")}
        title={t("myProfile.account")}
        titleSize="lg"
      >
        <dl className="m-0">
          <DetailRow
            className="sm:grid-cols-[180px_minmax(0,1fr)]"
            label={t("myProfile.emailLabel")}
            layout="grid"
            value={
              <span className="flex flex-wrap items-center gap-2">
                <span>{profile.email}</span>
                <VerificationBadge verified={profile.emailVerified} />
              </span>
            }
          />
          <DetailRow
            className="sm:grid-cols-[180px_minmax(0,1fr)]"
            label={t("myProfile.roleLabel")}
            layout="grid"
            value={roleKey ? t(roleKey) : profile.role}
          />
          <DetailRow
            className="sm:grid-cols-[180px_minmax(0,1fr)]"
            label={t("myProfile.accountStatus")}
            layout="grid"
            value={
              <span
                className={cn(
                  "inline-flex h-[22px] items-center rounded-full px-2.5 text-xs font-semibold",
                  statusStyle,
                )}
              >
                {statusKey ? t(statusKey) : profile.status}
              </span>
            }
          />
          {profile.createdAt ? (
            <DetailRow
              className="sm:grid-cols-[180px_minmax(0,1fr)]"
              label={t("myProfile.memberSince")}
              layout="grid"
              value={formatDate(profile.createdAt)}
            />
          ) : null}
          <DetailRow
            className="sm:grid-cols-[180px_minmax(0,1fr)]"
            label={t("myProfile.accountId")}
            layout="grid"
            value={<span className="itt-mono text-[12.5px]">{profile.id}</span>}
          />
        </dl>
        <div className="flex justify-end border-t border-border/60 pt-[18px]">
          <Button
            onClick={onOpenPassword}
            shape="pill"
            size="xl"
            type="button"
            variant="outline"
          >
            <LockKeyhole aria-hidden className="size-4" />
            {t("myProfile.changePassword")}
          </Button>
        </div>
      </SectionCard>
    </div>
  );
}

function VerificationBadge({ verified }: { verified: boolean }) {
  const { t } = useTranslation();
  return (
    <span
      className={cn(
        "inline-flex h-[22px] items-center gap-1 rounded-full px-2.5 text-xs font-semibold",
        verified
          ? "bg-(--status-success-bg) text-(--status-success-fg)"
          : "bg-(--status-warning-bg) text-(--status-warning-fg)",
      )}
    >
      {verified ? (
        <Check aria-hidden className="size-3" strokeWidth={3} />
      ) : null}
      {t(verified ? "myProfile.verified" : "myProfile.notVerified")}
    </span>
  );
}

function ChangePassword({
  hasPassword,
  onCancel,
}: {
  hasPassword: boolean;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { logout } = useSession();
  const [error, setError] = useState<string | null>(null);
  const change = useChangeMyPassword();
  const schema = z
    .object({
      currentPassword: z.string().min(1, t("myProfile.currentRequired")),
      newPassword: strongPasswordSchema.regex(
        PASSWORD_RULES.symbol,
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
    mode: "onSubmit",
  });
  const [currentPassword, newPassword] = useWatch({
    control: form.control,
    name: ["currentPassword", "newPassword"],
  });
  const passwordRules = [
    {
      key: "length",
      met: PASSWORD_RULES.length.test(newPassword),
      text: t("myProfile.passwordRules.length"),
    },
    {
      key: "uppercase",
      met: PASSWORD_RULES.uppercase.test(newPassword),
      text: t("myProfile.passwordRules.uppercase"),
    },
    {
      key: "lowercase",
      met: PASSWORD_RULES.lowercase.test(newPassword),
      text: t("myProfile.passwordRules.lowercase"),
    },
    {
      key: "number",
      met: PASSWORD_RULES.number.test(newPassword),
      text: t("myProfile.passwordRules.number"),
    },
    {
      key: "symbol",
      met: PASSWORD_RULES.symbol.test(newPassword),
      text: t("myProfile.passwordRules.symbol"),
    },
    {
      key: "different",
      met: Boolean(newPassword && currentPassword !== newPassword),
      text: t("myProfile.passwordRules.different"),
    },
  ];

  if (!hasPassword)
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

  async function save(values: PasswordForm) {
    setError(null);
    try {
      await change.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      showToast({
        message: t("myProfile.passwordChanged"),
        title: t("myProfile.passwordChanged"),
        tone: "success",
      });
      logout();
      queryClient.clear();
      navigate("/login", { replace: true });
    } catch (failure) {
      setError(requestErrorMessage(failure, t("myProfile.passwordFailed")));
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
                      <Check
                        aria-hidden
                        className="size-2.5"
                        strokeWidth={3.5}
                      />
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
            shape="pill"
            size="xl"
            type="button"
            variant="outline"
          >
            {t("myProfile.cancel")}
          </Button>
          <Button
            disabled={change.isPending}
            shape="pill"
            size="xl"
            type="submit"
          >
            {change.isPending
              ? t("myProfile.changingPassword")
              : t("myProfile.changePassword")}
          </Button>
        </div>
      </SectionCard>
    </form>
  );
}
