export const USER_ROLE_FILTERS = ["admin", "user"] as const;
export const USER_STATUS_FILTERS = ["active", "inactive", "suspended"] as const;

export const USER_EMAIL_FILTERS = ["verified", "unverified"] as const;

export type UserRoleFilter = (typeof USER_ROLE_FILTERS)[number] | "all";
export type UserStatusFilter = (typeof USER_STATUS_FILTERS)[number] | "all";
export type UserEmailFilter = (typeof USER_EMAIL_FILTERS)[number] | "all";

/** Columns the users API can sort by, and the table column that drives each one. */
export const USER_SORT_FIELDS = ["createdAt", "id", "name", "email"] as const;
export type UserSortField = (typeof USER_SORT_FIELDS)[number];
export type UserSortOrder = "asc" | "desc";
export const USER_DEFAULT_SORT: { sortBy: UserSortField; sortOrder: UserSortOrder } = { sortBy: "createdAt", sortOrder: "desc" };
export const USER_SORT_FIELD_BY_COLUMN: Record<string, UserSortField> = { createdAt: "createdAt", email: "email", id: "id", name: "name" };
export const USER_SORT_PARAM = { sortBy: "sortBy", sortOrder: "sortOrder" } as const;

export const ALL_FILTER = "all";

/** Roles an internal account can be given in the create / edit dialog (Users design). */
export const USER_FORM_ROLES = ["admin", "applicant"] as const;
export type UserFormRole = (typeof USER_FORM_ROLES)[number];

export const USER_FORM_STATUSES = ["active", "suspended"] as const;
export type UserFormStatus = (typeof USER_FORM_STATUSES)[number];

export const FULL_NAME_HINT_RANGE = { max: 100, min: 2 } as const;
/** Same rule as the API: 9-15 digits with an optional leading +, after spaces, dots, dashes and brackets are removed. */
export const PHONE_PATTERN = /^\+?\d{9,15}$/;
export const PHONE_NOISE = /[\s().-]/g;
export const EMAIL_MAX_LENGTH = 254;
