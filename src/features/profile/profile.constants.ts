export const PROFILE_QUERY_KEY = ["my-profile"] as const;
export const AVATAR_MAX_BYTES = 5 * 1_048_576;
export const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const PROFILE_PHONE_PATTERN = /^0[35789]\d{8}$/;
export const PROFILE_NAME_MIN = 2;
export const PROFILE_NAME_MAX = 100;

export const PROFILE_ROLE_KEYS = {
  admin: "roles.admin",
  enterprise_admin: "roles.enterpriseAdmin",
  recruiter: "roles.recruiter",
  user: "roles.user",
} as const;

export const PROFILE_STATUS_STYLES = {
  active: "bg-(--status-success-bg) text-(--status-success-fg)",
  inactive: "bg-muted text-muted-foreground",
  pending: "bg-(--status-warning-bg) text-(--status-warning-fg)",
  suspended: "bg-(--status-error-bg) text-(--status-error-fg)",
} as const;

export const PROFILE_STATUS_LABEL_KEYS = {
  active: "myProfile.status.active",
  inactive: "myProfile.status.inactive",
  pending: "myProfile.status.pending",
  suspended: "myProfile.status.suspended",
} as const;

export const PASSWORD_RULES = {
  length: /^.{8,64}$/,
  lowercase: /[a-z]/,
  number: /\d/,
  symbol: /[!@#$%^&*]/,
  uppercase: /[A-Z]/,
} as const;
