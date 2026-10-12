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

export const BYTES_PER_MB = 1024 * 1024;

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
  MAX_FILE_SIZE: 5 * BYTES_PER_MB, // 5MB per BR-41 / NFR-2
  ALLOWED_DOCUMENT_MIME_TYPES: ["application/pdf"],
  REJECTION_REASON_MIN_LENGTH: 20,
  REJECTION_REASON_MAX_LENGTH: 1000,
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
} as const;

/** Backend business-rule codes map to these translated messages (`enterpriseRegistration.validation.*`). */
export const REGISTRATION_MESSAGE_KEYS = {
  PERSONAL_EMAIL_REJECTED: "enterpriseRegistration.validation.personalEmail",
  MISSING_LEGAL_DOCUMENTS: "enterpriseRegistration.validation.missingDocuments",
  AUTHORIZATION_LETTER_REQUIRED: "enterpriseRegistration.validation.loaRequired",
  CHECKLIST_INCOMPLETE: "enterpriseRegistration.validation.checklistIncomplete",
  REJECTION_REASON_REQUIRED: "enterpriseRegistration.validation.rejectionReason",
} as const;

/** `value` is what the API stores; `key` picks the translated label (`enterpriseRegistration.industries.*`). */
export const INDUSTRY_OPTIONS = [
  { key: "logisticsTech", value: "Logistics technology" },
  { key: "software", value: "Software & IT Services" },
  { key: "fintech", value: "Fintech & Banking" },
  { key: "ecommerce", value: "E-commerce & Retail" },
  { key: "health", value: "Healthcare & Biotech" },
  { key: "education", value: "Education & Edtech" },
  { key: "telecom", value: "Telecommunications" },
  { key: "gaming", value: "Gaming & Entertainment" },
  { key: "ai", value: "Artificial Intelligence & Data" },
  { key: "hardware", value: "Hardware & Electronics" },
  { key: "other", value: "Other" },
] as const;

export const WIZARD_STEPS = ["step1", "step2", "step3", "step4"] as const;

/** The start screen asks only for name and email, but the API requires a phone there; step 2 collects the real one. */
export const START_PHONE_PLACEHOLDER = "0900000000";

export const DEFAULT_COUNTRY = "Vietnam";
export const DEFAULT_SLA_DAYS = 2;
