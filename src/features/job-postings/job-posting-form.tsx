import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  FormFieldLabel,
  FormFieldMessage,
} from "@/components/common/form-field";
import type {
  CreateJobPostingRequest,
  JobPosting,
  UpdateJobPostingRequest,
} from "@/api/generated/types.gen";
import { Breadcrumb } from "@/components/common/breadcrumb";

const optionalText = z.string().trim().max(200);
const schema = z
  .object({
    title: z.string().trim().min(5, "Title must be 5–150 characters.").max(150),
    location: optionalText,
    employmentType: optionalText,
    level: optionalText,
    salaryMin: z.string(),
    salaryMax: z.string(),
    currency: z.string().trim().min(1).max(10),
    openings: z.string(),
    expiresAt: z.string(),
    description: z.string(),
    requirements: z.string(),
    benefits: z.string(),
    status: z.enum(["draft", "published", "archived"]),
  })
  .superRefine((value, ctx) => {
    const min = value.salaryMin ? Number(value.salaryMin) : undefined;
    const max = value.salaryMax ? Number(value.salaryMax) : undefined;
    if (
      (min !== undefined && (!Number.isFinite(min) || min < 0)) ||
      (max !== undefined && (!Number.isFinite(max) || max < 0)) ||
      (min !== undefined && max !== undefined && min > max)
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Enter a valid salary range.",
        path: ["salaryMin"],
      });
    }
    if (
      value.openings &&
      (!Number.isInteger(Number(value.openings)) || Number(value.openings) < 1)
    )
      ctx.addIssue({
        code: "custom",
        message: "Openings must be a positive whole number.",
        path: ["openings"],
      });
    if (value.status === "published") {
      (
        [
          "location",
          "employmentType",
          "expiresAt",
          "requirements",
          "benefits",
        ] as const
      ).forEach((key) => {
        if (!value[key].trim())
          ctx.addIssue({
            code: "custom",
            message: "Required to publish.",
            path: [key],
          });
      });
      if (value.description.trim().length < 20)
        ctx.addIssue({
          code: "custom",
          message: "Description must be at least 20 characters to publish.",
          path: ["description"],
        });
    }
  });

type Values = z.infer<typeof schema>;
const blank: Values = {
  title: "",
  location: "",
  employmentType: "",
  level: "",
  salaryMin: "",
  salaryMax: "",
  currency: "USD",
  openings: "",
  expiresAt: "",
  description: "",
  requirements: "",
  benefits: "",
  status: "draft",
};

function valuesFrom(posting?: JobPosting): Values {
  if (!posting) return blank;
  return {
    title: posting.title,
    location: posting.location ?? "",
    employmentType: posting.employmentType ?? "",
    level: posting.level ?? "",
    salaryMin: posting.salaryMin?.toString() ?? "",
    salaryMax: posting.salaryMax?.toString() ?? "",
    currency: posting.currency,
    openings: posting.openings?.toString() ?? "",
    expiresAt: posting.expiresAt?.slice(0, 10) ?? "",
    description: posting.description ?? "",
    requirements: posting.requirements ?? "",
    benefits: posting.benefits ?? "",
    status: posting.status,
  };
}

function payloadFrom(values: Values): CreateJobPostingRequest {
  const optional = (value: string) => value.trim() || undefined;
  return {
    title: values.title.trim(),
    location: optional(values.location),
    employment_type: optional(values.employmentType),
    level: optional(values.level),
    salary_min: values.salaryMin ? Number(values.salaryMin) : undefined,
    salary_max: values.salaryMax ? Number(values.salaryMax) : undefined,
    currency: values.currency.trim(),
    openings: values.openings ? Number(values.openings) : undefined,
    expires_at: values.expiresAt
      ? `${values.expiresAt}T12:00:00.000Z`
      : undefined,
    description: optional(values.description),
    requirements: optional(values.requirements),
    benefits: optional(values.benefits),
    status: values.status,
  };
}

function updatePayloadFrom(values: Values): UpdateJobPostingRequest {
  const clearableText = (value: string) => value.trim() || null;
  return {
    title: values.title.trim(),
    location: clearableText(values.location),
    employment_type: clearableText(values.employmentType),
    level: clearableText(values.level),
    salary_min: values.salaryMin ? Number(values.salaryMin) : null,
    salary_max: values.salaryMax ? Number(values.salaryMax) : null,
    currency: values.currency.trim(),
    openings: values.openings ? Number(values.openings) : null,
    expires_at: values.expiresAt ? `${values.expiresAt}T12:00:00.000Z` : null,
    description: clearableText(values.description),
    requirements: clearableText(values.requirements),
    benefits: clearableText(values.benefits),
  };
}

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
  const form = useForm<Values>({
    defaultValues: valuesFrom(posting),
    resolver: zodResolver(schema),
  });
  useEffect(() => form.reset(valuesFrom(posting)), [form, posting]);
  const field = (
    name: keyof Values,
    label: string,
    options: { multiline?: boolean; type?: string } = {},
  ) => (
    <div className="space-y-1.5">
      <FormFieldLabel htmlFor={name}>
        {label}{" "}
        {name === "title" ? (
          <span className="text-destructive">*</span>
        ) : (
          <span className="text-muted-foreground">
            ({t("jobPostings.optional")})
          </span>
        )}
      </FormFieldLabel>
      {options.multiline ? (
        <Textarea id={name} {...form.register(name)} rows={5} />
      ) : (
        <Input
          id={name}
          type={options.type ?? "text"}
          {...form.register(name)}
        />
      )}
      <FormFieldMessage error>
        {form.formState.errors[name]?.message}
      </FormFieldMessage>
    </div>
  );
  return (
    <form
      className="grid gap-6"
      onSubmit={form.handleSubmit((values) =>
        posting
          ? onUpdate(updatePayloadFrom(values))
          : onCreate(payloadFrom(values)),
      )}
    >
      <Breadcrumb
        ariaLabel={t("jobPostings.title")}
        items={[
          { label: t("jobPostings.title"), to: "/recruiter/job-postings" },
          {
            label: posting
              ? t("jobPostings.editTitle")
              : t("jobPostings.createTitle"),
          },
        ]}
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="grid gap-6">
          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="itt-display text-xl font-semibold">
              {t("jobPostings.basicInformation")}
            </h2>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              {field("title", t("jobPostings.titleLabel"))}
              {field("location", t("jobPostings.location"))}
              {field("employmentType", t("jobPostings.employmentType"))}
              {field("level", t("jobPostings.level"))}
            </div>
          </section>
          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="itt-display text-xl font-semibold">
              {t("jobPostings.compensation")}
            </h2>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              {field("salaryMin", t("jobPostings.minimumSalary"), {
                type: "number",
              })}
              {field("salaryMax", t("jobPostings.maximumSalary"), {
                type: "number",
              })}
              {field("currency", t("jobPostings.currency"))}
              {field("openings", t("jobPostings.openings"), { type: "number" })}
            </div>
          </section>
          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="itt-display text-xl font-semibold">
              {t("jobPostings.content")}
            </h2>
            <div className="mt-5 grid gap-5">
              {field("description", t("jobPostings.description"), {
                multiline: true,
              })}
              {field("requirements", t("jobPostings.requirements"), {
                multiline: true,
              })}
              {field("benefits", t("jobPostings.benefits"), {
                multiline: true,
              })}
            </div>
          </section>
        </div>
        <aside className="h-fit rounded-2xl border border-border bg-card p-5 xl:sticky xl:top-6">
          <h2 className="text-[11.5px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
            {t("jobPostings.jobDetails")}
          </h2>
          <div className="mt-4">
            {field("expiresAt", t("jobPostings.expiryDate"), { type: "date" })}
          </div>
        </aside>
      </div>
      <div className="flex justify-end gap-2 border-t border-border pt-5">
        <Button
          onClick={() =>
            navigate(
              posting
                ? `/recruiter/job-postings/${posting.id}`
                : "/recruiter/job-postings",
            )
          }
          type="button"
          variant="outline"
        >
          {t("jobPostings.cancel")}
        </Button>
        <Button
          disabled={isSaving || (Boolean(posting) && !form.formState.isDirty)}
          type="submit"
        >
          {isSaving
            ? t("state.saving")
            : posting
              ? t("jobPostings.save")
              : t("jobPostings.create")}
        </Button>
      </div>
    </form>
  );
}
