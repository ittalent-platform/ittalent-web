export const ENTERPRISES_PATH = "/admin/enterprises";

export const ENTERPRISE_STATUSES = [
  "active",
  "pending",
  "suspended",
  "rejected",
  "inactive",
] as const;

export type EnterpriseStatus = (typeof ENTERPRISE_STATUSES)[number];

export const MIN_SUSPEND_REASON_CHARS = 10;

export const COMPANY_SIZE_OPTIONS = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1000+",
] as const;

export const COMPANY_TYPE_OPTIONS = [
  "Product",
  "Outsourcing",
  "IT Service",
  "Consulting",
  "Agency",
  "Hybrid",
  "Other",
] as const;

export const INDUSTRY_OPTIONS = [
  "Software & IT Services",
  "Fintech & Banking",
  "E-commerce & Retail",
  "Healthcare & Biotech",
  "Education & Edtech",
  "Telecommunications",
  "Gaming & Entertainment",
  "Logistics & Supply Chain",
  "Artificial Intelligence & Data",
  "Hardware & Electronics",
  "Other",
] as const;

export const CITY_OPTIONS = [
  "Ho Chi Minh",
  "Ha Noi",
  "Da Nang",
  "Can Tho",
  "Hai Phong",
  "Binh Duong",
  "Dong Nai",
  "Other",
] as const;

export const COUNTRY_OPTIONS = [
  "Vietnam",
  "Singapore",
  "Japan",
  "United States",
  "Other",
] as const;

export type EnterpriseSortField = "id" | "name" | "email" | "status" | "createdAt";
export type EnterpriseSortOrder = "asc" | "desc";

/** Social link keys shown on the detail page, in display order. */
export const SOCIAL_LINK_LABELS = [
  ["linkedin", "LinkedIn"],
  ["facebook", "Facebook"],
  ["github", "GitHub"],
  ["twitter", "X"],
] as const;

/** Statuses the backend allows to move to "active" (see VALID_STATUS_TRANSITIONS). */
const ACTIVATABLE_STATUSES: readonly string[] = ["pending", "suspended", "inactive"];

/**
 * Which lifecycle actions an enterprise offers. An active enterprise can only be suspended;
 * Delete is the last step for one that is no longer active (and the backend still refuses it
 * while the company has open jobs).
 */
export function getEnterpriseActions(status?: string | null) {
  const current = status?.toLowerCase() ?? "";
  return {
    canSuspend: current === "active",
    canActivate: ACTIVATABLE_STATUSES.includes(current),
    canDelete: current !== "active" && current !== "deleted",
  };
}
