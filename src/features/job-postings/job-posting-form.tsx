import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  FormFieldLabel,
  FormFieldMessage,
} from "@/components/common/form-field";
import type { JobPosting, JobPostingPayload } from "./job-postings.api";

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

function payloadFrom(values: Values): JobPostingPayload {
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

export function JobPostingForm({
  isSaving,
  onSubmit,
  posting,
}: {
  isSaving: boolean;
  onSubmit: (payload: JobPostingPayload) => void;
  posting?: JobPosting;
}) {
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
      <FormFieldLabel htmlFor={name}>{label}</FormFieldLabel>
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
      className="grid gap-5"
      onSubmit={form.handleSubmit((values) => onSubmit(payloadFrom(values)))}
    >
      <div className="grid gap-5 md:grid-cols-2">
        {field("title", "Title")} {field("location", "Location")}
        {field("employmentType", "Employment type")} {field("level", "Level")}
        {field("salaryMin", "Minimum salary", { type: "number" })}{" "}
        {field("salaryMax", "Maximum salary", { type: "number" })}
        {field("currency", "Currency")}{" "}
        {field("openings", "Openings", { type: "number" })}
        {field("expiresAt", "Expiry date", { type: "date" })}
        <div className="space-y-1.5">
          <FormFieldLabel htmlFor="status">Status</FormFieldLabel>
          <select
            className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            id="status"
            {...form.register("status")}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
          <FormFieldMessage error>
            {form.formState.errors.status?.message}
          </FormFieldMessage>
        </div>
      </div>
      {field("description", "Description", { multiline: true })}
      {field("requirements", "Requirements", { multiline: true })}
      {field("benefits", "Benefits", { multiline: true })}
      <div className="flex justify-end">
        <Button disabled={isSaving} type="submit">
          {isSaving
            ? "Saving…"
            : posting
              ? "Save changes"
              : "Create job posting"}
        </Button>
      </div>
    </form>
  );
}
