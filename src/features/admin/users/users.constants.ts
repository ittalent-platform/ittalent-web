export const USER_ROLE_FILTERS = ["admin", "user"] as const;
export const USER_STATUS_FILTERS = ["active", "inactive", "suspended"] as const;

export type UserRoleFilter = (typeof USER_ROLE_FILTERS)[number] | "all";
export type UserStatusFilter = (typeof USER_STATUS_FILTERS)[number] | "all";

export const ALL_FILTER = "all";

/** Roles an internal account can be given in the create / edit dialog (Users design). */
export const USER_FORM_ROLES = ["admin", "applicant"] as const;
export type UserFormRole = (typeof USER_FORM_ROLES)[number];

export const USER_FORM_STATUSES = ["active", "suspended"] as const;
export type UserFormStatus = (typeof USER_FORM_STATUSES)[number];

export const FULL_NAME_HINT_RANGE = { max: 100, min: 2 } as const;
export const EMAIL_MAX_LENGTH = 254;
