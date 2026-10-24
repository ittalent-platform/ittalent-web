export const PROFILE_QUERY_KEY = ["my-profile"] as const;
export const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const AVATAR_ACCEPT = AVATAR_TYPES.join(",");
export const PROFILE_PHONE_PATTERN = /^0[35789]\d{8}$/;
export const PROFILE_NAME_MIN = 2;
export const PROFILE_NAME_MAX = 100;
export const CANDIDATE_ROLE = "user";
export const PROFILE_ACTIVE_STATUS = "active";
export const PROFILE_BLOCKED_STATUSES = ["blocked", "suspended"] as const;

export const PROFILE_STATUS_VARIANTS = {
  active: "success",
  inactive: "neutral",
  pending: "warning",
  suspended: "destructive",
} as const;

export const PROFILE_STATUS_LABEL_KEYS = {
  active: "myProfile.status.active",
  inactive: "myProfile.status.inactive",
  pending: "myProfile.status.pending",
  suspended: "myProfile.status.suspended",
} as const;
