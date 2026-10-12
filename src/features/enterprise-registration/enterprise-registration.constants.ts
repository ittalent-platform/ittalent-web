export const registrationStatuses = [
  "draft",
  "pending_review",
  "under_review",
  "approved",
  "rejected",
] as const;

export type EnterpriseRegistrationStatus = (typeof registrationStatuses)[number];

export const legalDocumentTypes = [
  "business_license",
  "tax_registration",
  "power_of_attorney",
  "other",
] as const;

export type LegalDocumentType = (typeof legalDocumentTypes)[number];

export const adminDecisionTypes = ["approved", "rejected"] as const;

export type AdminDecisionType = (typeof adminDecisionTypes)[number];

/**
 * Common consumer and personal email domains blocked for corporate registration (BR-39).
 */
export const BLOCKED_EMAIL_DOMAINS = [
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "ymail.com",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "mail.com",
  "zoho.com",
  "proton.me",
  "protonmail.com",
  "aol.com",
  "gmx.com",
  "fastmail.com",
] as const;

export const REGISTRATION_CONFIG = {
  CODE_REGEX: /^REG-\d{8}-[A-Z0-9]{4,6}$/,
  TAX_CODE_REGEX: /^[0-9]{10,13}$/,
  PHONE_REGEX: /^[+]?[0-9\s().-]{8,20}$/,
  REPRESENTATIVE_NAME_MIN_LENGTH: 2,
  REPRESENTATIVE_NAME_MAX_LENGTH: 100,
  COMPANY_NAME_MIN_LENGTH: 2,
  COMPANY_NAME_MAX_LENGTH: 150,
  LEGAL_NAME_MAX_LENGTH: 200,
  REGISTRATION_NUMBER_MAX_LENGTH: 100,
  POSITION_MAX_LENGTH: 100,
  INDUSTRY_MIN_LENGTH: 2,
  INDUSTRY_MAX_LENGTH: 100,
  SHORT_DESC_MAX_LENGTH: 300,
  DESCRIPTION_MAX_LENGTH: 3000,
  MIN_FOUNDED_YEAR: 1800,
  STREET_MAX_LENGTH: 200,
  CITY_MAX_LENGTH: 100,
  DISTRICT_MAX_LENGTH: 100,
  STATE_PROVINCE_MAX_LENGTH: 100,
  COUNTRY_MAX_LENGTH: 100,
  POSTAL_CODE_MAX_LENGTH: 20,
  FILE_NAME_MAX_LENGTH: 255,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB per BR-41 / NFR-2
  ALLOWED_DOCUMENT_MIME_TYPES: ["application/pdf"],
  REJECTION_REASON_MIN_LENGTH: 20,
  REJECTION_REASON_MAX_LENGTH: 1000,
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
} as const;

export const REGISTRATION_MESSAGES = {
  PERSONAL_EMAIL_REJECTED: "Use your company domain, not a personal email",
  CANDIDATE_ACCOUNT_RESTRICTION: "Candidate accounts cannot request a company profile",
  TAX_CODE_CLAIM_CONFLICT: "This tax code already belongs to a company on ITTalent or another registration in review.",
  MISSING_LEGAL_DOCUMENTS: "Business Registration Certificate (PDF) is required for submission",
  AUTHORIZATION_LETTER_REQUIRED: "Letter of Authorization (PDF) is required when you are not the legal representative",
  CHECKLIST_INCOMPLETE: "All verification checklist items must be confirmed before approval",
  REJECTION_REASON_REQUIRED: "Write at least 20 characters so the requester knows what to fix.",
} as const;

export const DOCUMENT_TYPE_LABELS: Record<LegalDocumentType, string> = {
  business_license: "Business Registration Certificate (BRC)",
  power_of_attorney: "Letter of Authorization (LoA)",
  tax_registration: "Tax Registration Certificate",
  other: "Supporting Document",
};
