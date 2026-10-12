export const USER_ROLE_FILTERS = ["user", "recruiter", "enterprise_admin", "admin"] as const;
export const USER_STATUS_FILTERS = ["invited", "active", "inactive", "suspended", "blocked"] as const;

export const USER_EMAIL_FILTERS = ["verified", "unverified"] as const;

export type UserRole = (typeof USER_ROLE_FILTERS)[number];
export type UserStatus = (typeof USER_STATUS_FILTERS)[number];
export type UserEmailFilter = (typeof USER_EMAIL_FILTERS)[number];

/** URL query keys of the list filters (comma separated values). */
export const USER_FILTER_PARAM = { company: "company", created: "created", email: "email", role: "role", status: "status" } as const;
export const COMPANY_ID_PATTERN = /^[0-9a-fA-F]{24}$/;
export const USER_SEARCH_RANGE = { max: 100, min: 2 } as const;
/** Where the 403 state sends the person (the public home; their role dashboard redirects from there). */
export const FORBIDDEN_HOME_PATH = "/";
/** An unverified, inactive account older than this missed its verification window. */
export const VERIFICATION_WINDOW_MS = 24 * 60 * 60 * 1000;
export const CREATED_HIGHLIGHT_MS = 6000;
/** Chip text lists this many names before collapsing the rest into "+N". */
export const CHIP_MAX_COMPANY_NAMES = 1;

/** Columns the users API can sort by, and the table column that drives each one. */
export const USER_SORT_FIELDS = ["createdAt", "id", "name", "email"] as const;
export type UserSortField = (typeof USER_SORT_FIELDS)[number];
export type UserSortOrder = "asc" | "desc";
export const USER_DEFAULT_SORT: { sortBy: UserSortField; sortOrder: UserSortOrder } = { sortBy: "createdAt", sortOrder: "desc" };
export const USER_SORT_FIELD_BY_COLUMN: Record<string, UserSortField> = { createdAt: "createdAt", email: "email", id: "id", name: "name" };
export const USER_SORT_PARAM = { sortBy: "sortBy", sortOrder: "sortOrder" } as const;

/** Roles an internal account can be given in the create / edit dialog (Users design). */
export const USER_FORM_ROLES = ["user", "recruiter", "enterprise_admin"] as const;
export type UserFormRole = (typeof USER_FORM_ROLES)[number];

export const USER_FORM_STATUSES = ["active", "suspended"] as const;
export type UserFormStatus = (typeof USER_FORM_STATUSES)[number];

export const ENTERPRISES_PAGE_SIZE = 50;
/** Same bounds as the API for every reason (suspend, reopen, emergency suspend, cancel invitation, role change). */
export const REASON_MIN_LENGTH = 10;
export const REASON_MAX_LENGTH = 500;

export const FULL_NAME_HINT_RANGE = { max: 100, min: 2 } as const;
export const USERNAME_HINT_RANGE = { max: 30, min: 3 } as const;
export const USERNAME_PATTERN = /^[a-z0-9_]+$/;
/** Same rule as the API: a Vietnamese mobile number, 10 digits starting with 0 (03, 05, 07, 08, 09). */
export const PHONE_PATTERN = /^0[35789]\d{8}$/;
export const PHONE_NOISE = /[\s().-]/g;
export const PHONE_MAX_DIGITS = 10;
/** A pasted +84 / 84 country code is turned into the leading 0. */
export const PHONE_COUNTRY_PREFIX = /^\+?84/;
/** Names put into toast / dialog titles are cut to this many characters. */
export const NAME_TITLE_MAX_LENGTH = 30;
export const REASON_PREVIEW_LENGTH = 160;
export const EMAIL_MAX_LENGTH = 254;

export const COMPANY_SEARCH_DEBOUNCE_MS = 300;
