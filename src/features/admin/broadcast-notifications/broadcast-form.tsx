import type { UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { FormField } from "@/components/common/form-field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import {
  BROADCAST_AUDIENCES,
  BROADCAST_CATEGORIES,
  BROADCAST_PRIORITIES,
} from "./broadcast-notifications.constants";
import type { BroadcastFormValues } from "./broadcast-notifications.schemas";

export function BroadcastForm({
  disabled = false,
  form,
}: {
  disabled?: boolean;
  form: UseFormReturn<BroadcastFormValues>;
  isEditing?: boolean;
}) {
  const { t } = useTranslation();
  const {
    formState: { errors },
    register,
    setValue,
    watch,
  } = form;

  const currentCategory = watch("category");
  const currentAudience = watch("target_audience");
  const currentPriority = watch("priority");
  const currentChannels = watch("channels") || [];
  const contentValue = watch("content") || "";
  const titleValue = watch("title") || "";

  function toggleChannel(channel: "In-App Inbox" | "Email Digest") {
    if (disabled) return;
    if (channel === "In-App Inbox") {
      // In-App Inbox is mandatory
      return;
    }
    const has = currentChannels.includes(channel);
    const next = has
      ? currentChannels.filter((c) => c !== channel)
      : [...currentChannels, channel];
    setValue("channels", next, { shouldValidate: true });
  }

  return (
    <div className="flex flex-col gap-4">
      <FormField
        error={errors.title?.message}
        hint={t("adminBroadcasts.form.titleHint", { count: titleValue.length })}
        htmlFor="broadcast-title"
        label={t("adminBroadcasts.form.title")}
        required
      >
        <Input
          aria-invalid={Boolean(errors.title)}
          disabled={disabled}
          id="broadcast-title"
          maxLength={150}
          placeholder={t("adminBroadcasts.form.titlePlaceholder")}
          {...register("title")}
        />
      </FormField>

      <FormField
        error={errors.content?.message}
        hint={t("adminBroadcasts.form.contentHint", { count: contentValue.length })}
        htmlFor="broadcast-content"
        label={t("adminBroadcasts.form.content")}
        required
      >
        <Textarea
          aria-invalid={Boolean(errors.content)}
          className="min-h-[110px] resize-y"
          disabled={disabled}
          id="broadcast-content"
          maxLength={2000}
          placeholder={t("adminBroadcasts.form.contentPlaceholder")}
          rows={4}
          {...register("content")}
        />
      </FormField>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FormField
          error={errors.category?.message}
          htmlFor="broadcast-category"
          label={t("adminBroadcasts.form.category")}
          required
        >
          <Select
            disabled={disabled}
            onValueChange={(val) =>
              setValue("category", val as BroadcastFormValues["category"], {
                shouldValidate: true,
              })
            }
            value={currentCategory}
          >
            <SelectTrigger id="broadcast-category">
              <SelectValue placeholder={t("adminBroadcasts.form.selectCategory")} />
            </SelectTrigger>
            <SelectContent>
              {BROADCAST_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {t(`adminBroadcasts.category.${cat}`, { defaultValue: cat })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField
          error={errors.target_audience?.message}
          htmlFor="broadcast-audience"
          label={t("adminBroadcasts.form.targetAudience")}
          required
        >
          <Select
            disabled={disabled}
            onValueChange={(val) =>
              setValue("target_audience", val as BroadcastFormValues["target_audience"], {
                shouldValidate: true,
              })
            }
            value={currentAudience}
          >
            <SelectTrigger id="broadcast-audience">
              <SelectValue placeholder={t("adminBroadcasts.form.selectAudience")} />
            </SelectTrigger>
            <SelectContent>
              {BROADCAST_AUDIENCES.map((aud) => (
                <SelectItem key={aud} value={aud}>
                  {t(`adminBroadcasts.audience.${aud}`, { defaultValue: aud })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField
          error={errors.priority?.message}
          htmlFor="broadcast-priority"
          label={t("adminBroadcasts.form.priority")}
          required
        >
          <Select
            disabled={disabled}
            onValueChange={(val) =>
              setValue("priority", val as BroadcastFormValues["priority"], {
                shouldValidate: true,
              })
            }
            value={currentPriority}
          >
            <SelectTrigger id="broadcast-priority">
              <SelectValue placeholder={t("adminBroadcasts.form.selectPriority")} />
            </SelectTrigger>
            <SelectContent>
              {BROADCAST_PRIORITIES.map((pri) => (
                <SelectItem key={pri} value={pri}>
                  {t(`adminBroadcasts.priority.${pri}`, { defaultValue: pri })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          error={errors.action_url?.message}
          hint={t("adminBroadcasts.form.actionUrlHint")}
          htmlFor="broadcast-action-url"
          label={t("adminBroadcasts.form.actionUrl")}
        >
          <Input
            aria-invalid={Boolean(errors.action_url)}
            disabled={disabled}
            id="broadcast-action-url"
            maxLength={2048}
            placeholder="https://example.com/announcement"
            type="url"
            {...register("action_url")}
          />
        </FormField>

        <FormField
          error={errors.action_label?.message}
          hint={t("adminBroadcasts.form.actionLabelHint")}
          htmlFor="broadcast-action-label"
          label={t("adminBroadcasts.form.actionLabel")}
        >
          <Input
            aria-invalid={Boolean(errors.action_label)}
            disabled={disabled}
            id="broadcast-action-label"
            maxLength={50}
            placeholder={t("adminBroadcasts.form.actionLabelPlaceholder")}
            {...register("action_label")}
          />
        </FormField>
      </div>

      <div className="flex flex-col gap-2 pt-1">
        <label className="text-[13.5px] font-semibold text-foreground">
          {t("adminBroadcasts.form.deliveryChannels")}
        </label>
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex cursor-not-allowed items-center gap-2 text-sm text-foreground">
            <input
              checked={currentChannels.includes("In-App Inbox")}
              className="size-4 rounded border-border text-primary focus:ring-primary"
              disabled
              type="checkbox"
            />
            <span>{t("adminBroadcasts.channel.inApp")}</span>
            <span className="text-xs text-muted-foreground">({t("adminBroadcasts.form.mandatory")})</span>
          </label>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
            <input
              checked={currentChannels.includes("Email Digest")}
              className="size-4 rounded border-border text-primary focus:ring-primary"
              disabled={disabled}
              onChange={() => toggleChannel("Email Digest")}
              type="checkbox"
            />
            <span>{t("adminBroadcasts.channel.emailDigest")}</span>
          </label>
        </div>
        {errors.channels?.message ? (
          <p className="text-[12.5px] leading-normal text-danger" role="alert">
            {errors.channels.message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
