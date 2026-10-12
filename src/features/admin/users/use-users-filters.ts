import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router";

import { useListParams } from "@/hooks/use-list-params";

import {
  COMPANY_ID_PATTERN,
  USER_EMAIL_FILTERS,
  USER_FILTER_PARAM,
  USER_ROLE_FILTERS,
  USER_SEARCH_RANGE,
  USER_SORT_FIELDS,
  USER_SORT_PARAM,
  USER_STATUS_FILTERS,
  USER_DEFAULT_SORT,
  type UserEmailFilter,
  type UserRole,
  type UserSortField,
  type UserSortOrder,
  type UserStatus,
} from "./users.constants";
import { DEFAULT_PAGE_SIZE } from "./users.queries";

export type UsersFilters = {
  companies: string[];
  emails: UserEmailFilter[];
  roles: UserRole[];
  statuses: UserStatus[];
};

const PARAM_BY_GROUP = { companies: USER_FILTER_PARAM.company, emails: USER_FILTER_PARAM.email, roles: USER_FILTER_PARAM.role, statuses: USER_FILTER_PARAM.status } as const;

/** Keeps the known, unique values of a comma separated param; `dropped` is true when anything else was there. */
function parseList<T extends string>(raw: string | null, accept: (value: string) => value is T): { dropped: boolean; values: T[] } {
  const parts = raw ? raw.split(",").map((part) => part.trim()).filter(Boolean) : [];
  const values = [...new Set(parts.filter(accept))];
  return { dropped: values.length !== parts.length, values };
}

const oneOf = <T extends string>(list: readonly T[]) => (value: string): value is T => (list as readonly string[]).includes(value);

/** Reads the filters from the URL. Unknown roles/statuses/emails and malformed company ids are dropped. */
export function parseUsersFilters(params: URLSearchParams): UsersFilters & { dropped: boolean } {
  const roles = parseList(params.get(USER_FILTER_PARAM.role), oneOf(USER_ROLE_FILTERS));
  const statuses = parseList(params.get(USER_FILTER_PARAM.status), oneOf(USER_STATUS_FILTERS));
  const emails = parseList(params.get(USER_FILTER_PARAM.email), oneOf(USER_EMAIL_FILTERS));
  const companies = parseList(params.get(USER_FILTER_PARAM.company), (value): value is string => COMPANY_ID_PATTERN.test(value));
  return {
    companies: companies.values,
    dropped: roles.dropped || statuses.dropped || emails.dropped || companies.dropped,
    emails: emails.values,
    roles: roles.values,
    statuses: statuses.values,
  };
}

/** Both (or none) of verified/unverified is no filter. */
export function emailVerifiedFilter(emails: UserEmailFilter[]): boolean | undefined {
  return emails.length === 1 ? emails[0] === "verified" : undefined;
}

export function isValidSearch(search: string): boolean {
  const length = search.trim().length;
  return length === 0 || (length >= USER_SEARCH_RANGE.min && length <= USER_SEARCH_RANGE.max);
}

/** URL-backed state of the users list: filters, search, paging and sort. */
export function useUsersFilters() {
  const [searchParams] = useSearchParams();
  const { page, limit, search, set, setMany } = useListParams({ defaultLimit: DEFAULT_PAGE_SIZE });
  const raw = searchParams.toString();
  // Re-parse only when the URL changes so the arrays stay referentially stable.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const parsed = useMemo(() => parseUsersFilters(searchParams), [raw]);
  const { dropped, ...filters } = parsed;
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const sortBy = USER_SORT_FIELDS.find((field) => field === searchParams.get(USER_SORT_PARAM.sortBy)) ?? USER_DEFAULT_SORT.sortBy;
  const rawOrder = searchParams.get(USER_SORT_PARAM.sortOrder);
  const sortOrder: UserSortOrder = rawOrder === "asc" || rawOrder === "desc" ? rawOrder : USER_DEFAULT_SORT.sortOrder;

  // A search that is too short is never sent: the list keeps the last valid term.
  const searchValid = isValidSearch(search);
  const [lastValidSearch, setLastValidSearch] = useState(searchValid ? search.trim() : "");
  if (searchValid && lastValidSearch !== search.trim()) setLastValidSearch(search.trim());

  const setFilter = useCallback((group: keyof UsersFilters, values: string[]) => setMany({ [PARAM_BY_GROUP[group]]: values.join(",") || null }), [setMany]);
  const remove = useCallback((group: keyof UsersFilters) => setMany({ [PARAM_BY_GROUP[group]]: null }), [setMany]);
  // Rewrites the URL without the invalid values, which also dismisses the banner.
  const clearAll = useCallback(
    () => setMany({ ...Object.fromEntries(Object.values(PARAM_BY_GROUP).map((key) => [key, null])), search: null }),
    [setMany],
  );
  const sanitize = useCallback(
    () => setMany(Object.fromEntries(Object.entries(PARAM_BY_GROUP).map(([group, key]) => [key, filters[group as keyof UsersFilters].join(",") || null]))),
    [setMany, filters],
  );

  const activeCount = filters.companies.length + filters.emails.length + filters.roles.length + filters.statuses.length;
  return {
    ...filters,
    activeCount,
    appliedSearch: searchValid ? search.trim() : lastValidSearch,
    clearAll,
    droppedBanner: dropped && !bannerDismissed,
    dismissBanner: () => { setBannerDismissed(true); sanitize(); },
    limit,
    page,
    remove,
    search,
    searchValid,
    set,
    setFilter,
    setMany,
    sortBy: sortBy as UserSortField,
    sortOrder,
  };
}
