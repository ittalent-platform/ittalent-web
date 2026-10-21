import { z } from "zod";
import type { EnterpriseDetailDto } from "@/api/generated/types.gen";

export type EnterpriseDetail = EnterpriseDetailDto;

export const INDUSTRY_OPTIONS = [
  { label: "Fintech", value: "Fintech" },
  { label: "Information Technology", value: "Information Technology" },
  { label: "Software Development", value: "Software Development" },
  { label: "E-Commerce", value: "E-Commerce" },
  {
    label: "Banking & Financial Services",
    value: "Banking & Financial Services",
  },
  { label: "Telecommunications", value: "Telecommunications" },
  { label: "AI & Machine Learning", value: "AI & Machine Learning" },
  { label: "Healthcare & Biotech", value: "Healthcare & Biotech" },
  { label: "Education & EdTech", value: "Education & EdTech" },
  { label: "Other", value: "Other" },
];

export const COMPANY_SIZE_OPTIONS = [
  { label: "1–10 employees", value: "1-10" },
  { label: "11–50 employees", value: "11-50" },
  { label: "51–200 employees", value: "51-200" },
  { label: "201–500 employees", value: "201-500" },
  { label: "501–1000 employees", value: "501-1000" },
  { label: "1000+ employees", value: "1000+" },
];

export const COMPANY_TYPE_OPTIONS = [
  { label: "Product", value: "Product" },
  { label: "Outsourcing", value: "Outsourcing" },
  { label: "IT Service", value: "IT Service" },
  { label: "Consulting", value: "Consulting" },
  { label: "Agency", value: "Agency" },
  { label: "Hybrid", value: "Hybrid" },
  { label: "Other", value: "Other" },
];

export const updateEnterpriseProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Display name must be at least 2 characters")
    .max(150, "Display name cannot exceed 150 characters"),
  email: z
    .string()
    .trim()
    .email("Please provide a valid corporate email address"),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+() -]{8,20}$/, "Phone number must be 8–20 digits"),
  website: z
    .string()
    .trim()
    .url("Website must be a valid URL")
    .optional()
    .or(z.literal("")),
  industry: z.string().trim().min(1, "Please select an industry"),
  company_size: z.string().trim().optional().or(z.literal("")),
  company_type: z.string().trim().optional().or(z.literal("")),
  description: z
    .string()
    .trim()
    .max(5000, "Description cannot exceed 5000 characters")
    .optional()
    .or(z.literal("")),
  street: z.string().trim().optional().or(z.literal("")),
  city: z.string().trim().optional().or(z.literal("")),
  country: z.string().trim().optional().or(z.literal("")),
  social_linkedin: z
    .string()
    .trim()
    .url("LinkedIn link must be a valid URL")
    .optional()
    .or(z.literal("")),
  social_facebook: z
    .string()
    .trim()
    .url("Facebook link must be a valid URL")
    .optional()
    .or(z.literal("")),
  social_github: z
    .string()
    .trim()
    .url("GitHub link must be a valid URL")
    .optional()
    .or(z.literal("")),
  social_twitter: z
    .string()
    .trim()
    .url("X / Twitter link must be a valid URL")
    .optional()
    .or(z.literal("")),
  benefits: z.array(z.string()).optional(),
  tech_stack: z.array(z.string()).optional(),
  working_days: z.string().trim().optional().or(z.literal("")),
});

export type UpdateEnterpriseProfileFormValues = z.infer<
  typeof updateEnterpriseProfileSchema
>;
