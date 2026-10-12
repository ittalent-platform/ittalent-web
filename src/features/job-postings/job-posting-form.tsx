import { zodResolver } from "@hookform/resolvers/zod";
import { Bold, Italic, Link2, List, Underline } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { z } from "zod";

import type {
  CreateJobPostingRequest,
  JobPosting,
  UpdateJobPostingRequest,
} from "@/api/generated/types.gen";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import {
  DEFAULT_CURRENCY,
  JOB_EMPLOYMENT_TYPES,
  JOB_LEVELS,
  JOB_LIMITS,
  JOB_POSTINGS_PATH,
} from "./job-postings.constants";
import { toDeadlineDate } from "./job-postings.format";

type Translate = (key: string, options?: Record<string, unknown>) => string;

function buildSchema(t: Translate, today: string, postingDeadline?: string) {
  const length = (min: number, max: number, key: string) =>
    z
      .string()
      .trim()
      .min(min, t(key, { min, max }))
      .max(max, t(key, { min, max }));
  const optionalLength = (min: number, max: number, key: string) =>
    z
      .string()
      .trim()
      .max(max, t(key, { min, max }))
      .refine((value) => value.length === 0 || value.length >= min, {
        message: t(key, { min, max }),
      });
  return z
    .object({
      title: length(
        JOB_LIMITS.TITLE_MIN,
        JOB_LIMITS.TITLE_MAX,
        "jobPostings.validation.titleLength",
      ),
      location: optionalLength(
        JOB_LIMITS.LOCATION_MIN,
        JOB_LIMITS.LOCATION_MAX,
        "jobPostings.validation.locationLength",
      ),
      employmentType: z.union([z.enum(JOB_EMPLOYMENT_TYPES), z.literal("")]),
      level: z.string().trim().max(JOB_LIMITS.LEVEL_MAX),
      salaryMin: z.string(),
      salaryMax: z.string(),
      salaryNegotiable: z.boolean(),
      currency: z
        .string()
        .trim()
        .min(1, t("jobPostings.validation.currency"))
        .max(JOB_LIMITS.CURRENCY_MAX),
      openings: z.string(),
      expiresAt: z.string(),
      description: optionalLength(
        JOB_LIMITS.CONTENT_MIN,
        JOB_LIMITS.CONTENT_MAX,
        "jobPostings.validation.contentLength",
      ),
      requirements: optionalLength(
        JOB_LIMITS.CONTENT_MIN,
        JOB_LIMITS.CONTENT_MAX,
        "jobPostings.validation.contentLength",
      ),
      benefits: optionalLength(
        JOB_LIMITS.CONTENT_MIN,
        JOB_LIMITS.CONTENT_MAX,
        "jobPostings.validation.contentLength",
      ),
      publicationStatus: z.enum(["draft", "published", "unchanged"]),
    })
    .superRefine((value, ctx) => {
      if (value.publicationStatus !== "draft") {
        const requiredFields: Array<{
          key:
            | "benefits"
            | "description"
            | "employmentType"
            | "expiresAt"
            | "location"
            | "requirements";
          message: string;
        }> = [
          {
            key: "location",
            message: t("jobPostings.validation.locationLength", {
              min: JOB_LIMITS.LOCATION_MIN,
              max: JOB_LIMITS.LOCATION_MAX,
            }),
          },
          {
            key: "employmentType",
            message: t("jobPostings.validation.employmentType"),
          },
          {
            key: "description",
            message: t("jobPostings.validation.contentLength", {
              min: JOB_LIMITS.CONTENT_MIN,
              max: JOB_LIMITS.CONTENT_MAX,
            }),
          },
          {
            key: "requirements",
            message: t("jobPostings.validation.contentLength", {
              min: JOB_LIMITS.CONTENT_MIN,
              max: JOB_LIMITS.CONTENT_MAX,
            }),
          },
          {
            key: "benefits",
            message: t("jobPostings.validation.contentLength", {
              min: JOB_LIMITS.CONTENT_MIN,
              max: JOB_LIMITS.CONTENT_MAX,
            }),
          },
          {
            key: "expiresAt",
            message: t("jobPostings.validation.deadlineRequired"),
          },
        ];
        for (const field of requiredFields) {
          if (!value[field.key]) {
            ctx.addIssue({
              code: "custom",
              message: field.message,
              path: [field.key],
            });
          }
        }
      }
      const min = value.salaryMin ? Number(value.salaryMin) : undefined;
      const max = value.salaryMax ? Number(value.salaryMax) : undefined;
      if (
        (!value.salaryNegotiable &&
          min !== undefined &&
          (!Number.isFinite(min) || min < 0)) ||
        (!value.salaryNegotiable &&
          max !== undefined &&
          (!Number.isFinite(max) || max < 0)) ||
        (!value.salaryNegotiable &&
          min !== undefined &&
          max !== undefined &&
          min > max)
      ) {
        ctx.addIssue({
          code: "custom",
          message: t("jobPostings.validation.salary"),
          path: ["salaryMin"],
        });
      }
      if (
        value.openings &&
        (!Number.isInteger(Number(value.openings)) ||
          Number(value.openings) < 1)
      ) {
        ctx.addIssue({
          code: "custom",
          message: t("jobPostings.validation.openings"),
          path: ["openings"],
        });
      }
      if (
        value.expiresAt &&
        value.expiresAt !== postingDeadline &&
        value.expiresAt < today
      ) {
        ctx.addIssue({
          code: "custom",
          message: t("jobPostings.validation.deadlinePast"),
          path: ["expiresAt"],
        });
      }
    });
}

type Values = z.infer<ReturnType<typeof buildSchema>>;

const blank: Values = {
  benefits: "",
  currency: DEFAULT_CURRENCY,
  description: "",
  employmentType: "",
  expiresAt: "",
  level: "",
  location: "",
  openings: "",
  publicationStatus: "published",
  requirements: "",
  salaryMax: "",
  salaryMin: "",
  salaryNegotiable: false,
  title: "",
};

function valuesFrom(posting?: JobPosting): Values {
  if (!posting) return blank;
  return {
    benefits: posting.benefits ?? "",
    currency: posting.currency,
    description: posting.description ?? "",
    employmentType: (JOB_EMPLOYMENT_TYPES as readonly string[]).includes(
      posting.employmentType ?? "",
    )
      ? (posting.employmentType as Values["employmentType"])
      : "",
    expiresAt: posting.expiresAt ? toDeadlineDate(posting.expiresAt) : "",
    level: posting.level ?? "",
    location: posting.location ?? "",
    openings: posting.openings?.toString() ?? "",
    publicationStatus: posting.status === "draft" ? "draft" : "unchanged",
    requirements: posting.requirements ?? "",
    salaryMax: posting.salaryMax?.toString() ?? "",
    salaryMin: posting.salaryMin?.toString() ?? "",
    salaryNegotiable: posting.salaryNegotiable,
    title: posting.title,
  };
}

function payloadFrom(values: Values): CreateJobPostingRequest {
  const optional = (value: string) => value.trim() || undefined;
  return {
    benefits: optional(values.benefits),
    currency: values.currency.trim(),
    description: optional(values.description),
    employment_type: values.employmentType || undefined,
    expires_at: optional(values.expiresAt),
    level: optional(values.level),
    location: optional(values.location),
    openings: values.openings ? Number(values.openings) : undefined,
    ...(values.publicationStatus === "unchanged"
      ? {}
      : { publication_status: values.publicationStatus }),
    requirements: optional(values.requirements),
    ...(values.salaryNegotiable
      ? { salary_negotiable: true }
      : {
          salary_max: values.salaryMax ? Number(values.salaryMax) : undefined,
          salary_min: values.salaryMin ? Number(values.salaryMin) : undefined,
        }),
    title: values.title.trim(),
  };
}

function updatePayloadFrom(values: Values): UpdateJobPostingRequest {
  return {
    ...payloadFrom(values),
    level: values.level.trim() || null,
    openings: values.openings ? Number(values.openings) : null,
    salary_max:
      !values.salaryNegotiable && values.salaryMax
        ? Number(values.salaryMax)
        : null,
    salary_min:
      !values.salaryNegotiable && values.salaryMin
        ? Number(values.salaryMin)
        : null,
    salary_negotiable: values.salaryNegotiable,
  };
}

const NO_SELECTION = "__none__";

export function JobPostingForm({
  isSaving,
  onCreate,
  onUpdate,
  posting,
}: {
  isSaving: boolean;
  onCreate: (payload: CreateJobPostingRequest) => void;
  onUpdate: (payload: UpdateJobPostingRequest) => void;
  posting?: JobPosting;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [today] = useState(() => toDeadlineDate(Date.now()));
  const schema = buildSchema(
    t as Translate,
    today,
    posting?.expiresAt ? toDeadlineDate(posting.expiresAt) : undefined,
  );
  const form = useForm<Values>({
    defaultValues: valuesFrom(posting),
    resolver: zodResolver(schema) as never,
  });

  useEffect(() => form.reset(valuesFrom(posting)), [form, posting]);

  const publicationStatus = useWatch({
    control: form.control,
    name: "publicationStatus",
  });
  const salaryNegotiable = useWatch({
    control: form.control,
    name: "salaryNegotiable",
  });
  const requiresPublishedFields = publicationStatus !== "draft";

  const errorOf = (name: keyof Values) => form.formState.errors[name]?.message;

  const submit = (values: Values) =>
    posting
      ? onUpdate(updatePayloadFrom(values))
      : onCreate(payloadFrom(values));

  const submitAs = (status: Values["publicationStatus"]) => {
    form.setValue("publicationStatus", status);
    void form.handleSubmit(submit)();
  };

  const hasErrors =
    form.formState.submitCount > 0 &&
    Object.keys(form.formState.errors).length > 0;

  return (
    <form className="space-y-6" noValidate onSubmit={form.handleSubmit(submit)}>
      {/* Top action header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="itt-display text-2xl font-bold tracking-tight text-foreground sm:text-[28px]">
            {posting
              ? t("jobPostings.editTitle")
              : t("jobPostings.createTitle")}
          </h1>
          <p className="mt-1 text-[13.5px] text-muted-foreground">
            {posting
              ? t("jobPostings.form.editDescription")
              : t("jobPostings.form.createDescription")}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            className="h-10 px-5 text-[13.5px] font-semibold"
            onClick={() =>
              navigate(
                posting
                  ? `${JOB_POSTINGS_PATH}/${posting.id}`
                  : JOB_POSTINGS_PATH,
              )
            }
            shape="pill"
            type="button"
            variant="outline"
          >
            {t("jobPostings.cancel")}
          </Button>

          {!posting || posting.status === "draft" ? (
            <Button
              className="h-10 px-5 text-[13.5px] font-semibold"
              disabled={
                isSaving || (Boolean(posting) && !form.formState.isDirty)
              }
              onClick={() => submitAs("draft")}
              shape="pill"
              type="button"
              variant="outline"
            >
              {isSaving ? t("state.saving") : t("jobPostings.save.draftAction")}
            </Button>
          ) : null}

          <Button
            className="h-10 px-5 text-[13.5px] font-semibold"
            disabled={
              isSaving ||
              (Boolean(posting) &&
                posting?.status !== "draft" &&
                !form.formState.isDirty)
            }
            onClick={() =>
              form.setValue(
                "publicationStatus",
                !posting || posting.status === "draft"
                  ? "published"
                  : "unchanged",
              )
            }
            shape="pill"
            type="submit"
          >
            {isSaving
              ? t("state.saving")
              : posting
                ? posting.status === "draft"
                  ? t("jobPostings.save.publishAction")
                  : t("jobPostings.save.action")
                : t("jobPostings.save.publishAction")}
          </Button>
        </div>
      </div>

      {/* Highlighted error alert banner */}
      {hasErrors ? (
        <div
          className="rounded-lg border border-destructive/30 bg-destructive/10 p-3.5 px-4 text-[13.5px] font-medium leading-relaxed text-destructive"
          role="alert"
        >
          {t("jobPostings.form.errorBanner")}
        </div>
      ) : null}

      {/* Two-column layout matching reference (minmax(0,1fr) 300px) */}
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        {/* Left Column: Role Details & Content */}
        <section className="flex flex-col gap-6 rounded-xl border border-border bg-card p-6 shadow-xs">
          {/* Title Field */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline gap-2">
              <label
                className="text-[13px] font-semibold text-foreground"
                htmlFor="title"
              >
                {t("jobPostings.titleLabel")}
              </label>
              <span className="text-[12px] text-muted-foreground">
                {t("jobPostings.form.titleDraftHint")}
              </span>
            </div>
            <Input
              aria-invalid={errorOf("title") ? true : undefined}
              className={cn(
                "h-11 rounded-lg border-border text-[14px]",
                errorOf("title") && "border-destructive ring-1 ring-destructive/30",
              )}
              id="title"
              placeholder="Senior Backend Engineer (Java)"
              {...form.register("title")}
            />
            {errorOf("title") ? (
              <p className="text-[12px] text-destructive" role="alert">
                {errorOf("title")}
              </p>
            ) : (
              <p className="text-[12px] text-muted-foreground">
                5–150 characters
              </p>
            )}
          </div>

          {/* Description Textarea with Toolbar */}
          <RichTextareaField
            error={errorOf("description")}
            hint={t("jobPostings.contentHint", {
              max: JOB_LIMITS.CONTENT_MAX,
              min: JOB_LIMITS.CONTENT_MIN,
            })}
            id="description"
            label={t("jobPostings.description")}
            register={form.register("description")}
            required={requiresPublishedFields}
            subtext={
              requiresPublishedFields
                ? t("jobPostings.form.requiredToPublish")
                : undefined
            }
          />

          {/* Requirements Textarea with Toolbar */}
          <RichTextareaField
            error={errorOf("requirements")}
            hint={t("jobPostings.contentHint", {
              max: JOB_LIMITS.CONTENT_MAX,
              min: JOB_LIMITS.CONTENT_MIN,
            })}
            id="requirements"
            label={t("jobPostings.requirements")}
            register={form.register("requirements")}
            required={requiresPublishedFields}
            subtext={
              requiresPublishedFields
                ? t("jobPostings.form.requiredToPublish")
                : undefined
            }
          />

          {/* Benefits Textarea with Toolbar */}
          <RichTextareaField
            error={errorOf("benefits")}
            hint={t("jobPostings.contentHint", {
              max: JOB_LIMITS.CONTENT_MAX,
              min: JOB_LIMITS.CONTENT_MIN,
            })}
            id="benefits"
            label={t("jobPostings.benefits")}
            register={form.register("benefits")}
            required={requiresPublishedFields}
            subtext={
              requiresPublishedFields
                ? t("jobPostings.form.requiredToPublish")
                : undefined
            }
          />
        </section>

        {/* Right Column: Metadata & Sidebar Callout (300px) */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
          <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-xs">
            {/* Employment Type */}
            <div className="flex flex-col gap-1.5">
              <label
                className="text-[13px] font-semibold text-foreground"
                htmlFor="employmentType"
              >
                {t("jobPostings.employmentType")}
              </label>
              <Controller
                control={form.control}
                name="employmentType"
                render={({ field }) => (
                  <Select
                    onValueChange={(val) =>
                      field.onChange(val === NO_SELECTION ? "" : val)
                    }
                    value={field.value || NO_SELECTION}
                  >
                    <SelectTrigger
                      aria-invalid={errorOf("employmentType") ? true : undefined}
                      aria-label={t("jobPostings.employmentType")}
                      className={cn(
                        "h-11 rounded-lg border-border text-[13.5px]",
                        errorOf("employmentType") &&
                          "border-destructive ring-1 ring-destructive/30",
                      )}
                      id="employmentType"
                    >
                      <SelectValue
                        placeholder={t("jobPostings.employmentTypePlaceholder")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_SELECTION}>
                        {t("jobPostings.notSpecified")}
                      </SelectItem>
                      {JOB_EMPLOYMENT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {t(`jobPostings.employmentTypes.${type}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errorOf("employmentType") ? (
                <p className="text-[12px] text-destructive" role="alert">
                  {errorOf("employmentType")}
                </p>
              ) : null}
            </div>

            {/* Level */}
            <div className="flex flex-col gap-1.5">
              <label
                className="text-[13px] font-semibold text-foreground"
                htmlFor="level"
              >
                {t("jobPostings.level")}
              </label>
              <Controller
                control={form.control}
                name="level"
                render={({ field }) => (
                  <Select
                    onValueChange={(val) =>
                      field.onChange(val === NO_SELECTION ? "" : val)
                    }
                    value={field.value || NO_SELECTION}
                  >
                    <SelectTrigger
                      aria-invalid={errorOf("level") ? true : undefined}
                      aria-label={t("jobPostings.level")}
                      className="h-11 rounded-lg border-border text-[13.5px]"
                      id="level"
                    >
                      <SelectValue
                        placeholder={t("jobPostings.level_placeholder")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_SELECTION}>
                        {t("jobPostings.notSpecified")}
                      </SelectItem>
                      {JOB_LEVELS.map((lvl) => (
                        <SelectItem key={lvl} value={lvl}>
                          {lvl}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Location */}
            <div className="flex flex-col gap-1.5">
              <label
                className="text-[13px] font-semibold text-foreground"
                htmlFor="location"
              >
                {t("jobPostings.location")}
              </label>
              <Input
                aria-invalid={errorOf("location") ? true : undefined}
                className={cn(
                  "h-11 rounded-lg border-border text-[13.5px]",
                  errorOf("location") &&
                    "border-destructive ring-1 ring-destructive/30",
                )}
                id="location"
                placeholder="Ho Chi Minh City"
                {...form.register("location")}
              />
              {errorOf("location") ? (
                <p className="text-[12px] text-destructive" role="alert">
                  {errorOf("location")}
                </p>
              ) : null}
            </div>

            {/* Openings */}
            <div className="flex flex-col gap-1.5">
              <label
                className="text-[13px] font-semibold text-foreground"
                htmlFor="openings"
              >
                {t("jobPostings.openings")}
              </label>
              <Input
                aria-invalid={errorOf("openings") ? true : undefined}
                className={cn(
                  "h-11 rounded-lg border-border text-[13.5px]",
                  errorOf("openings") &&
                    "border-destructive ring-1 ring-destructive/30",
                )}
                id="openings"
                min="1"
                placeholder={t("jobPostings.notSpecified")}
                type="number"
                {...form.register("openings")}
              />
              {errorOf("openings") ? (
                <p className="text-[12px] text-destructive" role="alert">
                  {errorOf("openings")}
                </p>
              ) : null}
            </div>

            {/* Deadline */}
            <div className="flex flex-col gap-1.5">
              <label
                className="text-[13px] font-semibold text-foreground"
                htmlFor="expiresAt"
              >
                {t("jobPostings.expiryDate")}
              </label>
              <Controller
                control={form.control}
                name="expiresAt"
                render={({ field }) => (
                  <DatePicker
                    aria-invalid={errorOf("expiresAt") ? true : undefined}
                    id="expiresAt"
                    min={today}
                    onChange={field.onChange}
                    today={today}
                    value={field.value}
                  />
                )}
              />
              {errorOf("expiresAt") ? (
                <p className="text-[12px] text-destructive" role="alert">
                  {errorOf("expiresAt")}
                </p>
              ) : (
                <p className="text-[12px] text-muted-foreground">
                  {t("jobPostings.form.dateHint")}
                </p>
              )}
            </div>

            {/* Salary Range with Negotiable Toggle */}
            <div className="flex flex-col gap-2 pt-1 border-t border-border/60">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold text-foreground">
                  {t("jobPostings.compensation")}
                </span>
                <Controller
                  control={form.control}
                  name="salaryNegotiable"
                  render={({ field }) => (
                    <label className="flex cursor-pointer items-center gap-1.5 text-[12.5px] font-medium text-foreground">
                      <input
                        checked={field.value}
                        className="size-4 rounded accent-primary cursor-pointer"
                        id="salaryNegotiable"
                        onChange={(event) => {
                          field.onChange(event.target.checked);
                          if (event.target.checked) {
                            form.setValue("salaryMin", "", {
                              shouldDirty: true,
                            });
                            form.setValue("salaryMax", "", {
                              shouldDirty: true,
                            });
                          }
                        }}
                        type="checkbox"
                      />
                      <span>{t("jobPostings.salaryNegotiable")}</span>
                    </label>
                  )}
                />
              </div>

              <div className="grid grid-cols-[minmax(0,1fr)_12px_minmax(0,1fr)] items-center gap-2">
                <div>
                  <label className="sr-only" htmlFor="salaryMin">
                    {t("jobPostings.minimumSalary")}
                  </label>
                  <Input
                    aria-invalid={errorOf("salaryMin") ? true : undefined}
                    className="h-11 rounded-lg border-border text-[13.5px]"
                    disabled={salaryNegotiable}
                    id="salaryMin"
                    min="0"
                    placeholder={t("jobPostings.form.minSalaryPlaceholder")}
                    type="number"
                    {...form.register("salaryMin")}
                  />
                </div>
                <span className="text-center text-muted-foreground">–</span>
                <div>
                  <label className="sr-only" htmlFor="salaryMax">
                    {t("jobPostings.maximumSalary")}
                  </label>
                  <Input
                    aria-invalid={errorOf("salaryMin") ? true : undefined}
                    className="h-11 rounded-lg border-border text-[13.5px]"
                    disabled={salaryNegotiable}
                    id="salaryMax"
                    min="0"
                    placeholder={t("jobPostings.form.maxSalaryPlaceholder")}
                    type="number"
                    {...form.register("salaryMax")}
                  />
                </div>
              </div>

              {errorOf("salaryMin") ? (
                <p className="text-[12px] text-destructive" role="alert">
                  {errorOf("salaryMin")}
                </p>
              ) : (
                <p className="text-[12px] text-muted-foreground">
                  {salaryNegotiable
                    ? t("jobPostings.form.salaryRangeNegotiableHint")
                    : t("jobPostings.form.compensationDescription")}
                </p>
              )}
            </div>
          </section>

          {/* Informational Callout matching reference */}
          <div className="rounded-xl border border-primary/20 bg-(--status-info-bg) p-4 text-[13px] leading-relaxed text-(--status-info-fg)">
            {t("jobPostings.form.sidebarCallout")}
          </div>
        </aside>
      </div>
    </form>
  );
}

function RichTextareaField({
  error,
  hint,
  id,
  label,
  register,
  required,
  subtext,
}: {
  error?: string;
  hint?: string;
  id: string;
  label: string;
  register: Record<string, unknown>;
  required?: boolean;
  subtext?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <label
          className="text-[13px] font-semibold text-foreground"
          htmlFor={id}
        >
          {label}
        </label>
        {subtext ? (
          <span
            className={cn(
              "text-[12px]",
              required ? "font-medium text-destructive" : "text-muted-foreground",
            )}
          >
            {subtext}
          </span>
        ) : null}
      </div>

      <div
        className={cn(
          "overflow-hidden rounded-lg border bg-card transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20",
          error
            ? "border-destructive ring-1 ring-destructive/30"
            : "border-border",
        )}
      >
        <div className="flex h-10 items-center gap-1 border-b border-border bg-(--surface-subtle) px-2 dark:bg-muted/30">
          <button
            aria-label="Bold"
            className="flex size-7 items-center justify-center rounded text-muted-foreground transition hover:bg-card hover:text-foreground"
            tabIndex={-1}
            type="button"
          >
            <Bold className="size-3.5" />
          </button>
          <button
            aria-label="Italic"
            className="flex size-7 items-center justify-center rounded text-muted-foreground transition hover:bg-card hover:text-foreground"
            tabIndex={-1}
            type="button"
          >
            <Italic className="size-3.5" />
          </button>
          <button
            aria-label="Underline"
            className="flex size-7 items-center justify-center rounded text-muted-foreground transition hover:bg-card hover:text-foreground"
            tabIndex={-1}
            type="button"
          >
            <Underline className="size-3.5" />
          </button>
          <button
            aria-label="List"
            className="flex size-7 items-center justify-center rounded text-muted-foreground transition hover:bg-card hover:text-foreground"
            tabIndex={-1}
            type="button"
          >
            <List className="size-3.5" />
          </button>
          <button
            aria-label="Link"
            className="flex size-7 items-center justify-center rounded text-muted-foreground transition hover:bg-card hover:text-foreground"
            tabIndex={-1}
            type="button"
          >
            <Link2 className="size-3.5" />
          </button>
        </div>
        <textarea
          aria-invalid={error ? true : undefined}
          aria-label={label}
          className="block w-full resize-y border-0 bg-transparent p-3.5 text-[14px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground"
          id={id}
          rows={5}
          {...register}
        />
      </div>

      {error ? (
        <p className="text-[12px] text-destructive" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[12px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
