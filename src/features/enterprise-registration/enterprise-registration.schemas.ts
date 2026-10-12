import { z } from "zod";
import { strongPasswordSchema } from "@/features/auth/password-schema";
import i18n from "@/i18n";
import { validationMessage } from "@/features/auth/auth-validation";
import {
  adminDecisionTypes,
  BLOCKED_EMAIL_DOMAINS,
  BYTES_PER_MB,
  legalDocumentTypes,
  REGISTRATION_CONFIG,
  REGISTRATION_MESSAGE_KEYS,
} from "./enterprise-registration.constants";

export const companySizeOptions = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1000+",
] as const;

export const companyTypeOptions = [
  "product",
  "outsource",
  "hybrid",
  "consulting",
] as const;

export const corporateEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email(validationMessage("enterpriseRegistration.validation.emailInvalid"))
  .refine(
    (email) => {
      const domain = email.split("@")[1];
      return domain
        ? !BLOCKED_EMAIL_DOMAINS.includes(
            domain as (typeof BLOCKED_EMAIL_DOMAINS)[number],
          )
        : false;
    },
    validationMessage(REGISTRATION_MESSAGE_KEYS.PERSONAL_EMAIL_REJECTED),
  );

export const startRegistrationSchema = z.object({
  corporate_email: corporateEmailSchema,
  representative_name: z
    .string()
    .trim()
    .min(
      REGISTRATION_CONFIG.REPRESENTATIVE_NAME_MIN_LENGTH,
      validationMessage("enterpriseRegistration.validation.repNameMin", { count: REGISTRATION_CONFIG.REPRESENTATIVE_NAME_MIN_LENGTH }),
    )
    .max(
      REGISTRATION_CONFIG.REPRESENTATIVE_NAME_MAX_LENGTH,
      validationMessage("enterpriseRegistration.validation.repNameMax", { count: REGISTRATION_CONFIG.REPRESENTATIVE_NAME_MAX_LENGTH }),
    ),
  representative_phone: z
    .string()
    .trim()
    .regex(REGISTRATION_CONFIG.PHONE_REGEX, validationMessage("enterpriseRegistration.validation.phoneInvalid")),
  representative_position: z
    .string()
    .trim()
    .max(REGISTRATION_CONFIG.POSITION_MAX_LENGTH)
    .optional(),
});

export type StartRegistrationFormData = z.infer<typeof startRegistrationSchema>;

export const companyAddressSchema = z.object({
  street: z.string().trim().min(1, validationMessage("enterpriseRegistration.validation.streetRequired")).max(REGISTRATION_CONFIG.STREET_MAX_LENGTH),
  city: z.string().trim().min(1, validationMessage("enterpriseRegistration.validation.cityRequired")).max(REGISTRATION_CONFIG.CITY_MAX_LENGTH),
  district: z.string().trim().max(REGISTRATION_CONFIG.DISTRICT_MAX_LENGTH).optional(),
  state_province: z.string().trim().max(REGISTRATION_CONFIG.STATE_PROVINCE_MAX_LENGTH).optional(),
  country: z.string().trim().min(1, validationMessage("enterpriseRegistration.validation.countryRequired")).max(REGISTRATION_CONFIG.COUNTRY_MAX_LENGTH),
  postal_code: z.string().trim().max(REGISTRATION_CONFIG.POSTAL_CODE_MAX_LENGTH).optional(),
});

export const step1CompanyDetailsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(
      REGISTRATION_CONFIG.COMPANY_NAME_MIN_LENGTH,
      validationMessage("enterpriseRegistration.validation.companyNameMin", { count: REGISTRATION_CONFIG.COMPANY_NAME_MIN_LENGTH }),
    )
    .max(REGISTRATION_CONFIG.COMPANY_NAME_MAX_LENGTH),
  legal_name: z.string().trim().max(REGISTRATION_CONFIG.LEGAL_NAME_MAX_LENGTH).optional(),
  tax_code: z
    .string()
    .trim()
    .regex(
      REGISTRATION_CONFIG.TAX_CODE_REGEX,
      validationMessage("enterpriseRegistration.validation.taxCode"),
    ),
  registration_number: z
    .string()
    .trim()
    .max(REGISTRATION_CONFIG.REGISTRATION_NUMBER_MAX_LENGTH)
    .optional(),
  website: z.string().trim().url(validationMessage("enterpriseRegistration.validation.websiteInvalid")).optional().or(z.literal("")),
  industry: z
    .string()
    .trim()
    .min(
      REGISTRATION_CONFIG.INDUSTRY_MIN_LENGTH,
      validationMessage("enterpriseRegistration.validation.industryMin", { count: REGISTRATION_CONFIG.INDUSTRY_MIN_LENGTH }),
    )
    .max(REGISTRATION_CONFIG.INDUSTRY_MAX_LENGTH),
  sub_industries: z.array(z.string().trim()).optional(),
  company_size: z.enum(companySizeOptions, validationMessage("enterpriseRegistration.validation.sizeRequired")),
  company_type: z.enum(companyTypeOptions).optional(),
  founded_year: z
    .number()
    .int()
    .min(REGISTRATION_CONFIG.MIN_FOUNDED_YEAR, validationMessage("enterpriseRegistration.validation.foundedInvalid"))
    .max(new Date().getFullYear(), validationMessage("enterpriseRegistration.validation.foundedFuture"))
    .optional(),
  address: companyAddressSchema,
  short_description: z.string().trim().max(REGISTRATION_CONFIG.SHORT_DESC_MAX_LENGTH).optional(),
  description: z.string().trim().max(REGISTRATION_CONFIG.DESCRIPTION_MAX_LENGTH).optional(),
});

export type Step1CompanyDetailsFormData = z.infer<typeof step1CompanyDetailsSchema>;

export const step2RepresentativeSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(
      REGISTRATION_CONFIG.REPRESENTATIVE_NAME_MIN_LENGTH,
      validationMessage("enterpriseRegistration.validation.representativeNameMin", { count: REGISTRATION_CONFIG.REPRESENTATIVE_NAME_MIN_LENGTH }),
    )
    .max(REGISTRATION_CONFIG.REPRESENTATIVE_NAME_MAX_LENGTH),
  phone: z
    .string()
    .trim()
    .regex(REGISTRATION_CONFIG.PHONE_REGEX, validationMessage("enterpriseRegistration.validation.phoneInvalid")),
  position: z.string().trim().max(REGISTRATION_CONFIG.POSITION_MAX_LENGTH).optional(),
  is_legal_representative: z.boolean(),
  legal_representative_name: z
    .string()
    .trim()
    .max(REGISTRATION_CONFIG.REPRESENTATIVE_NAME_MAX_LENGTH)
    .optional(),
});

export type Step2RepresentativeFormData = z.infer<typeof step2RepresentativeSchema>;

export const legalDocumentItemSchema = z.object({
  document_type: z.enum(legalDocumentTypes),
  file_name: z.string().trim().min(1, validationMessage("enterpriseRegistration.validation.fileNameRequired")),
  file_url: z.string().trim().url(validationMessage("enterpriseRegistration.validation.fileUrlInvalid")),
  file_size: z
    .number()
    .max(
      REGISTRATION_CONFIG.MAX_FILE_SIZE,
      validationMessage("enterpriseRegistration.validation.fileTooLarge", { mb: REGISTRATION_CONFIG.MAX_FILE_SIZE / BYTES_PER_MB }),
    )
    .optional(),
});

export const step3DocumentsSchema = z
  .object({
    is_legal_representative: z.boolean(),
    documents: z.array(legalDocumentItemSchema),
  })
  .superRefine((data, ctx) => {
    const hasLicense = data.documents.some(
      (doc) => doc.document_type === "business_license",
    );
    if (!hasLicense) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["documents"],
        message: i18n.t(REGISTRATION_MESSAGE_KEYS.MISSING_LEGAL_DOCUMENTS),
      });
    }

    if (!data.is_legal_representative) {
      const hasAuthLetter = data.documents.some(
        (doc) => doc.document_type === "power_of_attorney",
      );
      if (!hasAuthLetter) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["documents"],
          message: i18n.t(REGISTRATION_MESSAGE_KEYS.AUTHORIZATION_LETTER_REQUIRED),
        });
      }
    }
  });

export type Step3DocumentsFormData = z.infer<typeof step3DocumentsSchema>;

export const step4ReviewSubmitSchema = z.object({
  agreed_to_terms: z.literal(true, validationMessage("enterpriseRegistration.validation.certifyRequired")),
});

export type Step4ReviewSubmitFormData = z.infer<typeof step4ReviewSubmitSchema>;

export const adminDecisionFormSchema = z
  .object({
    decision: z.enum(adminDecisionTypes),
    version: z.number().int().positive(validationMessage("enterpriseRegistration.validation.versionPositive")),
    checklist: z
      .object({
        tax_code_verified: z.boolean(),
        legal_representative_verified: z.boolean(),
        documents_verified: z.boolean(),
      })
      .optional(),
    rejection_reason: z
      .string()
      .trim()
      .max(REGISTRATION_CONFIG.REJECTION_REASON_MAX_LENGTH)
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.decision === "rejected") {
      if (
        !data.rejection_reason ||
        data.rejection_reason.trim().length <
          REGISTRATION_CONFIG.REJECTION_REASON_MIN_LENGTH
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["rejection_reason"],
          message: i18n.t(REGISTRATION_MESSAGE_KEYS.REJECTION_REASON_REQUIRED, { count: REGISTRATION_CONFIG.REJECTION_REASON_MIN_LENGTH }),
        });
      }
    }

    if (data.decision === "approved") {
      if (
        !data.checklist ||
        !data.checklist.tax_code_verified ||
        !data.checklist.legal_representative_verified ||
        !data.checklist.documents_verified
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["checklist"],
          message: i18n.t(REGISTRATION_MESSAGE_KEYS.CHECKLIST_INCOMPLETE),
        });
      }
    }
  });

export type AdminDecisionFormData = z.infer<typeof adminDecisionFormSchema>;

export const acceptInvitationFormSchema = z
  .object({
    password: strongPasswordSchema,
    confirm_password: z.string().min(1, validationMessage("enterpriseRegistration.validation.confirmPassword")),
    agree_to_terms: z.literal(true, validationMessage("enterpriseRegistration.validation.termsRequired")),
  })
  .refine((data) => data.password === data.confirm_password, {
    path: ["confirm_password"],
    ...validationMessage("enterpriseRegistration.validation.passwordsMismatch"),
  });

export type AcceptInvitationFormData = z.infer<typeof acceptInvitationFormSchema>;
