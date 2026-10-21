export const HISTORY_PAGE_SIZE = 10;
export const HISTORY_PREVIEW_SIZE = 5;
export const HISTORY_MAX_RANGE_MONTHS = 12;
/** The admin UI shows history in Vietnam time and labels it. */
export const HISTORY_TIME_ZONE = "Asia/Ho_Chi_Minh";
export const HISTORY_TIME_ZONE_LABEL = "ICT";

export const HISTORY_GROUPS = ["account", "profile", "email"] as const;
export const HISTORY_ACTORS = ["admin", "self"] as const;
export type HistoryGroup = (typeof HISTORY_GROUPS)[number];
export type HistoryActor = (typeof HISTORY_ACTORS)[number];

export const HISTORY_ACTIONS = ["account_invited", "profile_updated", "role_changed", "status_suspended", "status_reopened", "invitation_accepted", "invitation_revoked", "email_change_requested", "email_changed"] as const;
export type HistoryAction = (typeof HISTORY_ACTIONS)[number];
/** Dot colour per event: created/accepted/reactivated green, suspended red, cancelled amber, the rest blue. */
export const HISTORY_ACTION_TONE: Record<HistoryAction, "error" | "info" | "success" | "warning"> = {
  account_invited: "success",
  email_change_requested: "info",
  email_changed: "info",
  invitation_accepted: "success",
  profile_updated: "info",
  role_changed: "info",
  invitation_revoked: "warning",
  status_reopened: "success",
  status_suspended: "error",
};


/** The API's `code` on a 409 says which conflict it is. */
export const CONFLICT_CODES: Record<string, "accountConflict" | "companyUnavailable" | "lastAdmin" | "lastEnterpriseAdmin" | "onboardingPending" | "stale" | "transition"> = {
  ACCOUNT_CONFLICT: "accountConflict",
  COMPANY_UNAVAILABLE: "companyUnavailable",
  ENTERPRISE_ONBOARDING_PENDING: "onboardingPending",
  INVALID_TRANSITION: "transition",
  LAST_ADMIN: "lastAdmin",
  LAST_ENTERPRISE_ADMIN: "lastEnterpriseAdmin",
  VERSION_CONFLICT: "stale",
};

/** Fallback for responses without a code: told apart by their message. */
export const CONFLICT_MESSAGE_MARKERS = {
  accountConflict: "email address or username is already in use",
  companyUnavailable: "enterprise is missing or inactive",
  lastAdmin: "final active System Administrator",
  lastEnterpriseAdmin: "another Enterprise Administrator",
  transition: "Unsupported account status transition",
} as const;
