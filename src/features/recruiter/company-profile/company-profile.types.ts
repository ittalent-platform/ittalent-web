import { z } from "zod";
import type { EnterpriseDetailDto } from "@/api/generated/types.gen";
import { validationMessage as msg } from "@/lib/validation-message";

export type EnterpriseDetail = EnterpriseDetailDto;

// `value` is what the API stores; `labelKey` is the i18n key of the text shown to the user.
export const INDUSTRY_OPTIONS = [
  { labelKey: "recruiterCompanyProfile.industry.fintech", value: "Fintech" },
  { labelKey: "recruiterCompanyProfile.industry.it", value: "Information Technology" },
  { labelKey: "recruiterCompanyProfile.industry.software", value: "Software Development" },
  { labelKey: "recruiterCompanyProfile.industry.ecommerce", value: "E-Commerce" },
  { labelKey: "recruiterCompanyProfile.industry.banking", value: "Banking & Financial Services" },
  { labelKey: "enterpriseRegistration.industries.telecom", value: "Telecommunications" },
  { labelKey: "recruiterCompanyProfile.industry.ai", value: "AI & Machine Learning" },
  { labelKey: "recruiterCompanyProfile.industry.healthcare", value: "Healthcare & Biotech" },
  { labelKey: "recruiterCompanyProfile.industry.education", value: "Education & EdTech" },
  { labelKey: "enterpriseRegistration.industries.other", value: "Other" },
];

export const COMPANY_SIZE_OPTIONS = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"].map((value) => ({
  labelKey: `recruiterCompanyProfile.companySize.${value}`,
  value,
}));

export const COMPANY_TYPE_OPTIONS = [
  { labelKey: "recruiterCompanyProfile.companyType.product", value: "Product" },
  { labelKey: "recruiterCompanyProfile.companyType.outsourcing", value: "Outsourcing" },
  { labelKey: "recruiterCompanyProfile.companyType.itService", value: "IT Service" },
  { labelKey: "recruiterCompanyProfile.companyType.consulting", value: "Consulting" },
  { labelKey: "recruiterCompanyProfile.companyType.agency", value: "Agency" },
  { labelKey: "recruiterCompanyProfile.companyType.hybrid", value: "Hybrid" },
  { labelKey: "enterpriseRegistration.industries.other", value: "Other" },
];

export const COMPANY_NAME_MIN_LENGTH = 2;
export const COMPANY_NAME_MAX_LENGTH = 150;
export const COMPANY_DESCRIPTION_MAX_LENGTH = 5000;
const PHONE_PATTERN = /^[0-9+() -]{8,20}$/;

export const updateEnterpriseProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(COMPANY_NAME_MIN_LENGTH, msg("recruiterEmployees.validation.displayNameMin", { min: COMPANY_NAME_MIN_LENGTH }))
    .max(COMPANY_NAME_MAX_LENGTH, msg("recruiterEmployees.validation.displayNameMax", { max: COMPANY_NAME_MAX_LENGTH })),
  email: z
    .string()
    .trim()
    .email(msg("recruiterEmployees.validation.emailInvalid")),
  phone: z
    .string()
    .trim()
    .regex(PHONE_PATTERN, msg("recruiterCompanyProfile.validation.phoneInvalid")),
  website: z
    .string()
    .trim()
    .url(msg("recruiterCompanyProfile.validation.urlWebsite"))
    .optional()
    .or(z.literal("")),
  industry: z.string().trim().min(1, msg("recruiterCompanyProfile.validation.industryRequired")),
  company_size: z.string().trim().optional().or(z.literal("")),
  company_type: z.string().trim().optional().or(z.literal("")),
  description: z
    .string()
    .trim()
    .max(COMPANY_DESCRIPTION_MAX_LENGTH, msg("recruiterCompanyProfile.validation.descriptionMax", { max: COMPANY_DESCRIPTION_MAX_LENGTH }))
    .optional()
    .or(z.literal("")),
  street: z.string().trim().optional().or(z.literal("")),
  city: z.string().trim().optional().or(z.literal("")),
  country: z.string().trim().optional().or(z.literal("")),
  social_linkedin: z
    .string()
    .trim()
    .url(msg("recruiterCompanyProfile.validation.urlLinkedin"))
    .optional()
    .or(z.literal("")),
  social_facebook: z
    .string()
    .trim()
    .url(msg("recruiterCompanyProfile.validation.urlFacebook"))
    .optional()
    .or(z.literal("")),
  social_github: z
    .string()
    .trim()
    .url(msg("recruiterCompanyProfile.validation.urlGithub"))
    .optional()
    .or(z.literal("")),
  social_twitter: z
    .string()
    .trim()
    .url(msg("recruiterCompanyProfile.validation.urlTwitter"))
    .optional()
    .or(z.literal("")),
  benefits: z.array(z.string()).optional(),
  tech_stack: z.array(z.string()).optional(),
  working_days: z.string().trim().optional().or(z.literal("")),
});

export type UpdateEnterpriseProfileFormValues = z.infer<
  typeof updateEnterpriseProfileSchema
>;
